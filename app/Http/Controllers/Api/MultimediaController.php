<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RequestMultimediaDetail;
use App\Services\MultimediaSchedulingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultimediaController extends Controller
{
    protected MultimediaSchedulingService $multimediaService;

    public function __construct(MultimediaSchedulingService $multimediaService)
    {
        $this->multimediaService = $multimediaService;
    }

    /**
     * Endpoint ketersediaan slot jadwal Multimedia (PRD FR-MM-03)
     */
    public function availability(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->query('date', Carbon::today()->format('Y-m-d'));
        $bookedSlots = $this->multimediaService->getAvailability($date);

        return response()->json([
            'status' => 'success',
            'data' => [
                'date' => $date,
                'booked_slots' => $bookedSlots,
            ],
        ]);
    }

    /**
     * Endpoint jadwal peminjaman ruangan & alat multimedia untuk kalender (Google Calendar View)
     */
    public function schedule(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $location = $request->query('location');
        $status = $request->query('status');
        $need = $request->query('need');
        $search = $request->query('search');

        $query = RequestMultimediaDetail::query()
            ->with(['permohonan.user'])
            ->whereHas('permohonan', function ($q) use ($status, $search, $need) {
                if ($status && $status !== 'all') {
                    $q->where('status', $status);
                } else {
                    $q->whereIn('status', ['Diproses', 'Disetujui', 'Selesai']);
                }

                if ($need && $need !== 'all') {
                    $q->where(function ($nq) use ($need) {
                        $nq->where('form_data->jenis_kebutuhan', 'LIKE', "%{$need}%")
                           ->orWhere('judul_permohonan', 'LIKE', "%{$need}%");
                    });
                }

                if ($search) {
                    $q->where(function ($sq) use ($search) {
                        $sq->where('nomor_tiket', 'LIKE', "%{$search}%")
                            ->orWhere('judul_permohonan', 'LIKE', "%{$search}%")
                            ->orWhere('form_data->nama_kegiatan', 'LIKE', "%{$search}%")
                            ->orWhere('form_data->nama_pemohon', 'LIKE', "%{$search}%")
                            ->orWhere('form_data->unit_pemohon', 'LIKE', "%{$search}%")
                            ->orWhere('form_data->lokasi_kegiatan', 'LIKE', "%{$search}%");
                    });
                }
            });

        if ($startDate && $endDate) {
            $query->whereBetween('tanggal_pelaksanaan', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('tanggal_pelaksanaan', '>=', $startDate);
        }

        if ($location && $location !== 'all') {
            $query->where('lokasi_alat', 'LIKE', "%{$location}%");
        }

        $items = $query->orderBy('tanggal_pelaksanaan', 'asc')
            ->orderBy('jam_mulai', 'asc')
            ->get()
            ->map(function ($detail) {
                $p = $detail->permohonan;
                $formData = is_array($p->form_data) ? $p->form_data : json_decode($p->form_data ?? '{}', true);

                return [
                    'id' => $detail->id,
                    'permohonan_id' => $detail->permohonan_id,
                    'nomor_tiket' => $p->nomor_tiket,
                    'judul_permohonan' => $p->judul_permohonan,
                    'status' => $p->status,
                    'tanggal_pelaksanaan' => $detail->tanggal_pelaksanaan ? Carbon::parse($detail->tanggal_pelaksanaan)->format('Y-m-d') : null,
                    'jam_mulai' => substr($detail->jam_mulai, 0, 5),
                    'jam_selesai' => substr($detail->jam_selesai, 0, 5),
                    'durasi_menit' => $detail->durasi_menit,
                    'lokasi_alat' => $detail->lokasi_alat ?: ($formData['lokasi_produksi'] ?? 'Studio / Ruangan Kampus'),
                    'nama_pemohon' => $formData['nama_pemohon'] ?? $p->user?->name ?? 'Pemohon',
                    'unit_pemohon' => $formData['unit_pemohon'] ?? $p->user?->unit_kerja ?? '-',
                    'no_whatsapp' => $formData['no_whatsapp_pemohon'] ?? $formData['no_whatsapp'] ?? $p->user?->no_hp ?? null,
                    'nama_kegiatan' => $formData['nama_kegiatan'] ?? $p->judul_permohonan,
                    'jenis_kebutuhan' => $formData['jenis_kebutuhan'] ?? [],
                    'catatan' => $formData['catatan'] ?? ($p->deskripsi_kebutuhan ?? null),
                ];
            });

        // Lokasi unik untuk dropdown filter
        $allLocations = RequestMultimediaDetail::query()
            ->whereNotNull('lokasi_alat')
            ->where('lokasi_alat', '!=', '')
            ->distinct()
            ->pluck('lokasi_alat')
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'schedules' => $items,
                'locations' => $allLocations,
            ],
        ]);
    }
}
