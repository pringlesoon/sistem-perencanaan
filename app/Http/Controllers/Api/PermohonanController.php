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
        // User biasa hanya melihat permohonan miliknya sendiri. Admin & Approver melihat seluruh permohonan.
        if ($user->isUser()) {
            $query->where('user_id', $user->id);
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

        // 1. Validasi Khusus Multimedia [M]
        if ($request->service_code === 'M') {
            $request->validate([
                'tanggal_pelaksanaan' => 'required|date',
                'jam_mulai' => 'required|date_format:H:i',
                'jam_selesai' => 'required|date_format:H:i',
                'lokasi_alat' => 'nullable|string|max:255',
            ]);

            // Cek Durasi Maksimal (FR-MM-04)
            $durationCheck = $this->multimediaService->validateDuration(
                $request->jam_mulai,
                $request->jam_selesai
            );
            if (!$durationCheck['valid']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $durationCheck['message'],
                ], 422);
            }
        }

        // 2. Validasi Khusus Suvenir [S]
        if ($request->service_code === 'S') {
            $request->validate([
                'nama_item' => 'required|string|max:255',
                'qty_diminta' => 'required|integer|min:1',
            ]);
        }

        // Transaksi Database ACID untuk menjamin integritas data (NFR-REL-02, FR-MM-05)
        try {
            $createdPermohonan = DB::transaction(function () use ($request, $user, $service) {
                // Skenario Multimedia: Conflict Checking dengan Lock untuk cegah race condition (FR-MM-05)
                if ($request->service_code === 'M') {
                    $hasConflict = $this->multimediaService->checkConflict(
                        $request->tanggal_pelaksanaan,
                        $request->jam_mulai,
                        $request->jam_selesai,
                        null,
                        true // with row locking
                    );

                    if ($hasConflict) {
                        throw new Exception('JADWAL_BENTROK');
                    }
                }

                // Tentukan Status Awal
                $initialStatus = 'Diajukan';
                $suvenirCalc = null;

                if ($request->service_code === 'S') {
                    $suvenirCalc = $this->suvenirService->calculateQuota((int) $request->qty_diminta);
                    $initialStatus = $suvenirCalc['initial_status'];
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
                    'tanggal_dibutuhkan' => $request->tanggal_dibutuhkan,
                    'status' => $initialStatus,
                ]);

                // Simpan Detail Multimedia
                if ($request->service_code === 'M') {
                    $start = Carbon::parse($request->jam_mulai);
                    $end = Carbon::parse($request->jam_selesai);

                    RequestMultimediaDetail::create([
                        'permohonan_id' => $permohonan->id,
                        'tanggal_pelaksanaan' => $request->tanggal_pelaksanaan,
                        'jam_mulai' => $start->format('H:i:s'),
                        'jam_selesai' => $end->format('H:i:s'),
                        'durasi_menit' => $start->diffInMinutes($end),
                        'lokasi_alat' => $request->lokasi_alat ?? 'Studio / Peralatan Terpilih',
                    ]);
                }

                // Simpan Detail Suvenir
                if ($request->service_code === 'S' && $suvenirCalc) {
                    RequestSuvenirDetail::create([
                        'permohonan_id' => $permohonan->id,
                        'nama_item' => $request->nama_item,
                        'qty_diminta' => $suvenirCalc['qty_diminta'],
                        'qty_disetujui_otomatis' => $suvenirCalc['qty_disetujui_otomatis'],
                        'qty_perlu_approval' => $suvenirCalc['qty_perlu_approval'],
                        'status_approval' => ($suvenirCalc['qty_perlu_approval'] > 0) ? 'Menunggu Approval' : 'Disetujui',
                    ]);

                    // Jika ada kuota yang perlu approval, kirim notifikasi ke seluruh Approver (FR-SV-04)
                    if ($suvenirCalc['qty_perlu_approval'] > 0) {
                        $approvers = User::where('role', 'Approver')->get();
                        foreach ($approvers as $approver) {
                            Notification::create([
                                'user_id' => $approver->id,
                                'permohonan_id' => $permohonan->id,
                                'title' => "Permintaan Approval Suvenir: {$nomorTiket}",
                                'message' => "Pengajuan {$suvenirCalc['qty_diminta']} unit {$request->nama_item} oleh {$user->name} ({$suvenirCalc['qty_perlu_approval']} unit memerlukan persetujuan).",
                                'type' => 'warning',
                            ]);
                        }
                    }
                }

                // Simpan Entri Status History Awal (Append-Only)
                $historyNote = 'Permohonan diajukan oleh pemohon melalui sistem SAPT.';
                if ($request->service_code === 'S' && $suvenirCalc && $suvenirCalc['qty_perlu_approval'] > 0) {
                    $historyNote = "{$suvenirCalc['qty_disetujui_otomatis']} unit disetujui otomatis. {$suvenirCalc['qty_perlu_approval']} unit masuk ke antrean persetujuan Kepala Divisi.";
                } elseif ($request->service_code === 'S' && $suvenirCalc && $suvenirCalc['qty_perlu_approval'] === 0) {
                    $historyNote = "Permintaan {$suvenirCalc['qty_diminta']} unit suvenir disetujui otomatis oleh sistem (di bawah batas limit). Status langsung Diproses.";
                }

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
                    'message' => 'Jadwal yang Anda pilih bentrok dengan permohonan Multimedia lain yang sudah ada pada tanggal dan jam tersebut. Silakan pilih slot jam lain.',
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

        $permohonan->calculated_lead_time = $permohonan->calculated_lead_time;

        return response()->json([
            'status' => 'success',
            'data' => $permohonan,
        ]);
    }

    /**
     * Ubah Status Permohonan (Khusus Admin / Pelaksana)
     * Sesuai PRD FR-TRK-01, FR-TRK-02
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya Admin/Pelaksana yang berhak mengubah status alur pekerjaan.',
            ], 403);
        }

        $request->validate([
            'status' => 'required|string|in:Diajukan,Diproses,Direvisi,Selesai,Ditolak',
            'catatan' => 'nullable|string',
        ]);

        $permohonan = Permohonan::findOrFail($id);
        $oldStatus = $permohonan->status;
        $newStatus = $request->status;

        if ($newStatus === 'Direvisi' && empty(trim((string)$request->catatan))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Catatan revisi wajib diisi jika status diubah menjadi Direvisi.',
            ], 422);
        }

        DB::transaction(function () use ($permohonan, $user, $oldStatus, $newStatus, $request) {
            $permohonan->status = $newStatus;

            if ($newStatus === 'Direvisi') {
                $permohonan->catatan_revisi = $request->catatan;
            }

            if ($newStatus === 'Selesai') {
                $permohonan->selesai_at = Carbon::now();
                $diff = $permohonan->created_at->diffInMinutes(Carbon::now());
                $permohonan->lead_time_minutes = $diff;
            }

            $permohonan->save();

            // Append-Only Status History
            StatusHistory::create([
                'permohonan_id' => $permohonan->id,
                'user_id' => $user->id,
                'status_sebelumnya' => $oldStatus,
                'status_baru' => $newStatus,
                'catatan' => $request->catatan ?? "Status diperbarui dari {$oldStatus} menjadi {$newStatus} oleh Admin.",
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
            'data' => $permohonan->fresh(['user', 'service', 'statusHistories.user', 'multimediaDetail', 'suvenirDetail']),
        ]);
    }

    /**
     * Keputusan Approver untuk Suvenir yang melebihi batas kuota (Khusus Approver)
     * Sesuai PRD FR-SV-04, FR-SV-06, AC-12
     */
    public function approveSuvenir(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->isApprover()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya Approver (Kepala Divisi) yang berhak memproses persetujuan kuota ini.',
            ], 403);
        }

        $request->validate([
            'decision' => 'required|string|in:approve,reject',
            'catatan' => 'nullable|string',
        ]);

        $permohonan = Permohonan::where('id', $id)->firstOrFail();

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

        $actionText = ($request->decision === 'approve') ? 'disetujui' : 'ditolak';

        return response()->json([
            'status' => 'success',
            'message' => "Persetujuan kuota suvenir telah berhasil diproses ({$actionText}).",
            'data' => $updatedPermohonan,
        ]);
    }
}
