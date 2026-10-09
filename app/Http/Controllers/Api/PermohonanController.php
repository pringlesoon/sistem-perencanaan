<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Permohonan;
use App\Models\RequestAttachment;
use App\Models\RequestMultimediaDetail;
use App\Models\RequestSuvenirDetail;
use App\Models\Service;
use App\Models\StatusHistory;
use App\Models\User;
use App\Services\MultimediaSchedulingService;
use App\Services\SuvenirApprovalService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PermohonanController extends Controller
{
    protected MultimediaSchedulingService $multimediaService;
    protected SuvenirApprovalService $suvenirService;

    public function __construct(
        MultimediaSchedulingService $multimediaService,
        SuvenirApprovalService $suvenirService
    ) {
        $this->multimediaService = $multimediaService;
        $this->suvenirService = $suvenirService;
    }

    /**
     * Daftar Permohonan (Datatable dengan Server-Side Filtering, Sorting, Pagination)
     * Sesuai PRD FR-TRK-03, FR-TRK-04, FR-TRK-05
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $query = Permohonan::with(['user', 'service', 'multimediaDetail', 'suvenirDetail'])
            ->orderBy('created_at', 'desc');

        // FR-TRK-05: Isolasi Hak Akses
        // User biasa hanya melihat permohonan miliknya sendiri.
        // PIC hanya melihat permohonan dari layanan mereka.
        // Admin, SuperAdmin melihat seluruh permohonan.
        if ($user->role === 'User') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'PIC') {
            if ($user->pic_service_code) {
                $picCatMap = ['D' => 'Desain', 'P' => 'Publikasi', 'S' => 'Suvenir', 'M' => 'Multimedia', 'L' => 'Liputan'];
                $catName = $picCatMap[$user->pic_service_code] ?? null;
                $query->where(function ($q) use ($user, $catName) {
                    $q->whereHas('service', fn($sq) => $sq->where('code', $user->pic_service_code));
                    if ($catName) {
                        $q->orWhere('kategori', 'like', "%{$catName}%");
                    }
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // Filter: Status
        if ($request->filled('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        // Filter: Layanan / Kategori
        if ($request->filled('service_code') && $request->service_code !== 'Semua') {
            $query->whereHas('service', function ($q) use ($request) {
                $q->where('code', $request->service_code);
            });
        }

        // Filter: Rentang Tanggal
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search: Nomor Tiket, Judul, atau Nama Pemohon
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_tiket', 'like', "%{$search}%")
                  ->orWhere('judul_permohonan', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('unit_kerja', 'like', "%{$search}%");
                  });
            });
        }

        // Pagination
        $perPage = (int) $request->input('per_page', 10);
        $permohonans = $query->paginate($perPage);

        // Tambahkan atribut Lead Time kalkulasi dinamis
        $permohonans->getCollection()->transform(function ($item) {
            $item->calculated_lead_time = $item->calculated_lead_time;
            return $item;
        });

        return response()->json([
            'status' => 'success',
            'data' => $permohonans,
        ]);
    }

    /**
     * Submit Permohonan Baru
     * Mendukung validasi khusus Multimedia (Conflict Checking & Max Duration) dan Suvenir (Auto-Approval)
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        // Validasi Umum
        $request->validate([
            'service_code' => 'required|string|in:D,P,S,M,L',
            'judul_permohonan' => 'required|string|max:255',
            'deskripsi_kebutuhan' => 'required|string',
            'tanggal_dibutuhkan' => 'nullable|date',
            'attachments.*' => 'nullable|file|max:10240|mimes:pdf,jpg,jpeg,png,docx',
        ]);

        $service = Service::where('code', $request->service_code)->firstOrFail();

        // Parse form_data JSON jika dikirim sebagai string
        $formData = $request->form_data;
        if (is_string($formData)) {
            $formData = json_decode($formData, true) ?? [];
        } elseif (!is_array($formData)) {
            $formData = [];
        }

        // 1. Validasi Khusus Multimedia [M]
        if ($request->service_code === 'M') {
            $jamMulai = $request->jam_mulai ?? ($formData['jam_mulai'] ?? null);
            $jamSelesai = $request->jam_selesai ?? ($formData['jam_selesai'] ?? null);
            $tglPelaksanaan = $request->tanggal_pelaksanaan ?? ($formData['tanggal_produksi'] ?? $formData['tanggal_kegiatan'] ?? null);

            if ($jamMulai && $jamSelesai && $tglPelaksanaan) {
                // Cek Durasi Maksimal (FR-MM-04)
                $durationCheck = $this->multimediaService->validateDuration($jamMulai, $jamSelesai);
                if (!$durationCheck['valid']) {
                    return response()->json([
                        'status' => 'error',
                        'message' => $durationCheck['message'],
                    ], 422);
                }
            }
        }

        // 2. Validasi Khusus Suvenir [S]
        if ($request->service_code === 'S') {
            $hasDirectItem = $request->filled('nama_item') && $request->filled('qty_diminta');
            $hasMultiItems = !empty($formData['souvenir_items']) && is_array($formData['souvenir_items']);

            if (!$hasDirectItem && !$hasMultiItems) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Mohon pilih minimal satu jenis suvenir beserta jumlah yang dibutuhkan.',
                ], 422);
            }
        }

        // Transaksi Database ACID untuk menjamin integritas data (NFR-REL-02, FR-MM-05)
        try {
            $createdPermohonan = DB::transaction(function () use ($request, $user, $service, $formData) {
                // Skenario Multimedia: Conflict Checking dengan Lock untuk cegah race condition (FR-MM-05)
                $tglPelaksanaan = $request->tanggal_pelaksanaan ?? ($formData['tanggal_produksi'] ?? $formData['tanggal_kegiatan'] ?? null);
                $jamMulai = $request->jam_mulai ?? ($formData['jam_mulai'] ?? null);
                $jamSelesai = $request->jam_selesai ?? ($formData['jam_selesai'] ?? null);

                if ($request->service_code === 'M' && $tglPelaksanaan && $jamMulai && $jamSelesai) {
                    $hasConflict = $this->multimediaService->checkConflict(
                        $tglPelaksanaan,
                        $jamMulai,
                        $jamSelesai,
                        null,
                        true // with row locking
                    );

                    if ($hasConflict) {
                        throw new Exception('JADWAL_BENTROK');
                    }
                }

                // Tentukan Status Awal & Ringkasan Suvenir
                $initialStatus = 'Diajukan';
                $suvenirSummaryName = $request->nama_item;
                $suvenirTotalQty = (int) $request->qty_diminta;

                if ($request->service_code === 'S') {
                    if (!empty($formData['souvenir_items']) && is_array($formData['souvenir_items'])) {
                        $itemsSummary = [];
                        $calcTotal = 0;
                        foreach ($formData['souvenir_items'] as &$sItem) {
                            $q = (int) ($sItem['qty'] ?? 0);
                            if ($q > 0) {
                                $calcTotal += $q;
                                $itemsSummary[] = "{$sItem['nama_item']} ({$q})";
                                // Default unit disetujui sama dengan yang diajukan sebelum diverifikasi PIC
                                $sItem['qty_disetujui'] = $q;
                            }
                        }
                        unset($sItem);
                        if ($calcTotal > 0) {
                            $suvenirTotalQty = $calcTotal;
                            $suvenirSummaryName = implode(', ', $itemsSummary);
                        }
                    }
                    $initialStatus = 'Diajukan';
                }

                // Buat Nomor Tiket Unik
                $dateCode = Carbon::now()->format('Ymd');
                $countToday = Permohonan::whereDate('created_at', Carbon::today())->count() + 1;
                $nomorTiket = sprintf("REQ-%s-%04d", $dateCode, $countToday);

                // Buat Permohonan Utama
                $permohonan = Permohonan::create([
                    'nomor_tiket' => $nomorTiket,
                    'user_id' => $user->id,
                    'service_id' => $service->id,
                    'kategori' => $service->name,
                    'judul_permohonan' => $request->judul_permohonan,
                    'deskripsi_kebutuhan' => $request->deskripsi_kebutuhan,
                    'form_data' => $formData,
                    'tanggal_dibutuhkan' => $request->tanggal_dibutuhkan ?? ($formData['deadline'] ?? $formData['tanggal_publikasi'] ?? null),
                    'status' => $initialStatus,
                ]);

                // Simpan Detail Multimedia
                if ($request->service_code === 'M' && $tglPelaksanaan && $jamMulai && $jamSelesai) {
                    $start = Carbon::parse($jamMulai);
                    $end = Carbon::parse($jamSelesai);

                    RequestMultimediaDetail::create([
                        'permohonan_id' => $permohonan->id,
                        'tanggal_pelaksanaan' => $tglPelaksanaan,
                        'jam_mulai' => $start->format('H:i:s'),
                        'jam_selesai' => $end->format('H:i:s'),
                        'durasi_menit' => $start->diffInMinutes($end),
                        'lokasi_alat' => $request->lokasi_alat ?? ($formData['lokasi_produksi'] ?? 'Studio / Peralatan Terpilih'),
                    ]);
                }

                // Simpan Detail Suvenir
                if ($request->service_code === 'S') {
                    RequestSuvenirDetail::create([
                        'permohonan_id' => $permohonan->id,
                        'nama_item' => $suvenirSummaryName ?? 'Suvenir Kampus',
                        'qty_diminta' => $suvenirTotalQty > 0 ? $suvenirTotalQty : 1,
                        'qty_disetujui_otomatis' => $suvenirTotalQty > 0 ? $suvenirTotalQty : 1,
                        'qty_perlu_approval' => $suvenirTotalQty > 0 ? $suvenirTotalQty : 1,
                        'status_approval' => 'Menunggu Verifikasi PIC',
                    ]);

                    // Notifikasi ke PIC Alat Promosi & Admin
                    $pics = User::where('role', 'PIC')->where('pic_service_code', 'S')->get();
                    if ($pics->isEmpty()) {
                        $pics = User::whereIn('role', ['Admin', 'SuperAdmin'])->get();
                    }
                    foreach ($pics as $picUser) {
                        Notification::create([
                            'user_id' => $picUser->id,
                            'permohonan_id' => $permohonan->id,
                            'title' => "Permohonan Alat Promosi Baru: {$nomorTiket}",
                            'message' => "Pengajuan {$suvenirTotalQty} unit suvenir oleh {$user->name}. Silakan periksa ketersediaan stok dan atur kuota unit yang disetujui.",
                            'type' => 'info',
                        ]);
                    }
                }

                // Simpan Entri Status History Awal (Append-Only)
                $historyNote = 'Permohonan diajukan oleh pemohon melalui sistem SAPT.';

                StatusHistory::create([
                    'permohonan_id' => $permohonan->id,
                    'user_id' => $user->id,
                    'status_sebelumnya' => null,
                    'status_baru' => $initialStatus,
                    'catatan' => $historyNote,
                ]);

                // Simpan File Lampiran jika ada
                if ($request->hasFile('attachments')) {
                    foreach ($request->file('attachments') as $file) {
                        $fileName = $file->getClientOriginalName();
                        $filePath = $file->store('attachments', 'public');

                        RequestAttachment::create([
                            'permohonan_id' => $permohonan->id,
                            'file_name' => $fileName,
                            'file_path' => $filePath,
                            'file_size' => $file->getSize(),
                            'mime_type' => $file->getClientMimeType(),
                        ]);
                    }
                }

                // Notifikasi in-app untuk Admin bahwa ada permohonan baru
                $admins = User::where('role', 'Admin')->get();
                foreach ($admins as $admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'permohonan_id' => $permohonan->id,
                        'title' => "Permohonan Baru: {$nomorTiket} [{$service->code}]",
                        'message' => "Permohonan {$service->name} baru diajukan oleh {$user->name} ({$user->unit_kerja}).",
                        'type' => 'info',
                    ]);
                }

                return $permohonan;
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Permohonan berhasil diajukan dengan nomor tiket: ' . $createdPermohonan->nomor_tiket,
                'data' => $createdPermohonan->load(['service', 'multimediaDetail', 'suvenirDetail', 'statusHistories', 'attachments']),
            ], 201);
        } catch (Exception $e) {
            if ($e->getMessage() === 'JADWAL_BENTROK') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Jadwal yang Anda pilih bentrok dengan jadwal Multimedia yang sudah terkunci (berstatus Diproses) pada tanggal dan jam tersebut. Silakan pilih slot jam lain.',
                ], 409); // HTTP 409 Conflict sesuai PRD FR-MM-05 / AC-07
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memproses permohonan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detail Lengkap Permohonan + Status Histories & Attachments
     */
    public function show(int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $permohonan = Permohonan::with([
            'user',
            'service',
            'multimediaDetail',
            'suvenirDetail.approver',
            'statusHistories.user',
            'attachments',
        ])->findOrFail($id);

        // Validasi Otorisasi: User biasa hanya boleh melihat miliknya
        if ($user->isUser() && $permohonan->user_id !== $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Anda tidak memiliki izin melihat permohonan ini.',
            ], 403);
        }

        // PIC hanya boleh melihat permohonan dari layanannya sendiri
        if ($user->role === 'PIC') {
            $picCatMap = ['D' => 'Desain', 'P' => 'Publikasi', 'S' => 'Suvenir', 'M' => 'Multimedia', 'L' => 'Liputan'];
            $catName = $picCatMap[$user->pic_service_code] ?? null;
            $matchesService = ($permohonan->service?->code === $user->pic_service_code);
            $matchesCat = ($catName && str_contains($permohonan->kategori ?? '', $catName));

            if (!$matchesService && !$matchesCat) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Akses ditolak. PIC hanya dapat mengakses permohonan dari layanan miliknya.',
                ], 403);
            }
        }

        $permohonan->calculated_lead_time = $permohonan->calculated_lead_time;

        return response()->json([
            'status' => 'success',
            'data' => $permohonan,
        ]);
    }

    /**
     * Ubah Status Permohonan (Admin / Super Admin / PIC Layanan Bersangkutan)
     * Sesuai PRD FR-TRK-01, FR-TRK-02
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $permohonan = Permohonan::with(['service', 'user', 'multimediaDetail'])->findOrFail($id);

        // Otorisasi: Admin & SuperAdmin berhak untuk semua; PIC hanya untuk layanannya sendiri
        $isAuthorized = false;
        if (in_array($user->role, ['Admin', 'SuperAdmin'])) {
            $isAuthorized = true;
        } elseif ($user->role === 'PIC') {
            $picCatMap = ['D' => 'Desain', 'P' => 'Publikasi', 'S' => 'Suvenir', 'M' => 'Multimedia', 'L' => 'Liputan'];
            $catName = $picCatMap[$user->pic_service_code] ?? null;
            if ($permohonan->service?->code === $user->pic_service_code || ($catName && str_contains($permohonan->kategori ?? '', $catName))) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Anda tidak memiliki hak memperbarui permohonan dari layanan ini.',
            ], 403);
        }

        // Kolom catatan wajib jika PIC yang mengubah status, atau jika status Direvisi / Ditolak
        $isPic = ($user->role === 'PIC');
        $requiresNote = $isPic || in_array($request->status, ['Direvisi', 'Ditolak']);
        $noteRule = $requiresNote ? 'required|string|min:3' : 'nullable|string';

        $request->validate([
            'status' => 'required|string|max:50',
            'catatan' => $noteRule,
            'revision_file' => 'nullable|file|max:10240', // max 10MB
        ]);

        $oldStatus = $permohonan->status;
        $newStatus = $request->status;

        // Validasi Bentrok Jadwal Multimedia saat mengubah status menjadi 'Diproses' / 'Disetujui'
        if (in_array($newStatus, ['Diproses', 'Disetujui']) && $permohonan->multimediaDetail) {
            $mmDetail = $permohonan->multimediaDetail;
            $tgl = $mmDetail->tanggal_pelaksanaan ? Carbon::parse($mmDetail->tanggal_pelaksanaan)->format('Y-m-d') : null;
            $mulai = $mmDetail->jam_mulai;
            $selesai = $mmDetail->jam_selesai;

            if ($tgl && $mulai && $selesai) {
                // Cek apakah slot ini sudah terkunci oleh permohonan lain yang berstatus Diproses / Disetujui / Selesai
                $hasConflictWithLocked = $this->multimediaService->checkConflict(
                    $tgl,
                    $mulai,
                    $selesai,
                    $permohonan->id,
                    true,
                    ['Diproses', 'Disetujui', 'Selesai']
                );

                if ($hasConflictWithLocked) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Gagal mengubah status menjadi Diproses. Slot waktu ruangan/alat pada tanggal dan jam tersebut telah terkunci oleh permohonan lain yang sudah diproses terlebih dahulu.',
                    ], 422);
                }
            }
        }

        DB::transaction(function () use ($permohonan, $user, $oldStatus, $newStatus, $request) {
            $permohonan->status = $newStatus;

            // Jika permohonan Multimedia diubah menjadi 'Diproses' / 'Disetujui':
            // Otomatis tolak permohonan lain yang masih 'Diajukan' pada slot waktu yang sama (Requirement 3)
            if (in_array($newStatus, ['Diproses', 'Disetujui']) && $permohonan->multimediaDetail) {
                $mmDetail = $permohonan->multimediaDetail;
                $tgl = $mmDetail->tanggal_pelaksanaan ? Carbon::parse($mmDetail->tanggal_pelaksanaan)->format('Y-m-d') : null;
                $mulai = $mmDetail->jam_mulai;
                $selesai = $mmDetail->jam_selesai;

                if ($tgl && $mulai && $selesai) {
                    $clashingRequests = $this->multimediaService->getConflictingPendingRequests(
                        $tgl,
                        $mulai,
                        $selesai,
                        $permohonan->id
                    );

                    $jamRange = substr($mulai, 0, 5) . ' - ' . substr($selesai, 0, 5);

                    foreach ($clashingRequests as $clashItem) {
                        $otherReq = Permohonan::find($clashItem->id);
                        if ($otherReq && $otherReq->status === 'Diajukan') {
                            $otherReq->status = 'Ditolak';
                            $otherReq->save();

                            $autoRejectNote = "Permohonan otomatis ditolak oleh sistem karena jadwal (tanggal {$tgl} pukul {$jamRange}) telah terkunci oleh permohonan {$permohonan->nomor_tiket} yang diproses terlebih dahulu.";

                            StatusHistory::create([
                                'permohonan_id' => $otherReq->id,
                                'user_id' => $user->id,
                                'status_sebelumnya' => 'Diajukan',
                                'status_baru' => 'Ditolak',
                                'catatan' => $autoRejectNote,
                            ]);

                            Notification::create([
                                'user_id' => $otherReq->user_id,
                                'permohonan_id' => $otherReq->id,
                                'title' => "Permohonan Ditolak Otomatis (Slot Terkunci): {$otherReq->nomor_tiket}",
                                'message' => "Permohonan Anda ditolak otomatis karena slot jadwal pada tanggal {$tgl} pukul {$jamRange} telah terkunci oleh permohonan lain ({$permohonan->nomor_tiket}) yang diproses terlebih dahulu.",
                                'type' => 'danger',
                            ]);
                        }
                    }
                }
            }

            if ($newStatus === 'Direvisi') {
                $permohonan->catatan_revisi = $request->catatan;
            }

            if ($newStatus === 'Selesai') {
                $permohonan->selesai_at = Carbon::now();
                $diff = $permohonan->created_at->diffInMinutes(Carbon::now());
                $permohonan->lead_time_minutes = $diff;
            }

            $permohonan->save();

            // Simpan unggahan lampiran hasil revisi / dokumen pemeriksaan jika ada (terutama PIC Publikasi)
            if ($request->hasFile('revision_file')) {
                $file = $request->file('revision_file');
                $fileName = $file->getClientOriginalName();
                $filePath = $file->store('attachments', 'public');

                RequestAttachment::create([
                    'permohonan_id' => $permohonan->id,
                    'file_name' => '[Hasil Revisi/Pemeriksaan] ' . $fileName,
                    'file_path' => $filePath,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getClientMimeType(),
                ]);
            }

            $actorTitle = match ($user->role) {
                'PIC' => 'PIC ' . ($permohonan->service?->name ?? 'Layanan'),
                'SuperAdmin' => 'Super Admin',
                default => 'Admin'
            };

            // Append-Only Status History
            StatusHistory::create([
                'permohonan_id' => $permohonan->id,
                'user_id' => $user->id,
                'status_sebelumnya' => $oldStatus,
                'status_baru' => $newStatus,
                'catatan' => $request->catatan ?? "Status diperbarui dari {$oldStatus} menjadi {$newStatus} oleh {$actorTitle} ({$user->name}).",
            ]);

            // Kirim Notifikasi in-app ke Pemohon (FR-NOTIF-01)
            $type = match ($newStatus) {
                'Selesai' => 'success',
                'Direvisi' => 'warning',
                'Ditolak' => 'danger',
                default => 'info',
            };

            Notification::create([
                'user_id' => $permohonan->user_id,
                'permohonan_id' => $permohonan->id,
                'title' => "Pembaruan Status Permohonan: {$permohonan->nomor_tiket}",
                'message' => "Status permohonan Anda kini berubah menjadi \"{$newStatus}\". " . ($request->catatan ? "Catatan: {$request->catatan}" : ""),
                'type' => $type,
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => "Status permohonan {$permohonan->nomor_tiket} berhasil diubah menjadi {$newStatus}.",
            'data' => $permohonan->fresh(['user', 'service', 'statusHistories.user', 'multimediaDetail', 'suvenirDetail', 'attachments']),
        ]);
    }

    /**
     * PIC Mengonfirmasi Kuota dan Meneruskan ke Admin untuk Approval
     */
    public function confirmQuotaPic(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $permohonan = Permohonan::where('id', $id)->firstOrFail();

        $canManage = $user->isSuperAdmin() || $user->isAdmin() || ($user->role === 'PIC' && $user->pic_service_code === 'S');
        if (!$canManage) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya PIC Alat Promosi atau Admin yang berhak memverifikasi kuota ini.',
            ], 403);
        }

        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.nama_item' => 'required|string',
            'items.*.qty_disetujui' => 'required|integer|min:0',
            'catatan' => 'nullable|string',
        ]);

        $updated = $this->suvenirService->confirmQuotaByPic(
            $permohonan,
            $user,
            $request->items,
            $request->catatan
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Kuota suvenir berhasil diverifikasi dan diteruskan ke Admin untuk approval.',
            'data' => $updated,
        ]);
    }

    /**
     * Keputusan Approval Suvenir oleh Admin / Super Admin (Setuju / Tolak)
     */
    public function approveSuvenir(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $permohonan = Permohonan::where('id', $id)->firstOrFail();

        $canApprove = $user->isSuperAdmin() || $user->isAdmin();
        if (!$canApprove) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya Admin atau Super Admin yang berhak memberikan persetujuan (approval) akhir.',
            ], 403);
        }

        $request->validate([
            'decision' => 'required|string|in:approve,reject',
            'catatan' => 'nullable|string',
        ]);

        if ($permohonan->kategori !== 'Suvenir' && $permohonan->service?->code !== 'S') {
            return response()->json([
                'status' => 'error',
                'message' => 'Permohonan ini bukan permohonan Suvenir.',
            ], 400);
        }

        $updatedPermohonan = $this->suvenirService->handleApproverDecision(
            $permohonan,
            $user,
            $request->decision,
            $request->catatan
        );

        $actionText = $request->decision === 'approve' ? 'disetujui' : 'ditolak';

        return response()->json([
            'status' => 'success',
            'message' => "Permohonan suvenir telah berhasil {$actionText}.",
            'data' => $updatedPermohonan,
        ]);
    }
}
