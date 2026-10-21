<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permohonan;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Dasbor Analitik Kinerja Divisi Marketing/Humas & Tiap PIC Layanan (PRD FR-AN-01 s.d. FR-AN-03)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->isSuperAdmin() && !$user->isPic())) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Dasbor Analitik hanya dapat diakses oleh Super Admin dan PIC Layanan.',
            ], 403);
        }

        // Tentukan lingkup layanan (PIC terkunci ke layanannya, Admin/SuperAdmin bisa pilih spesifik atau Semua)
        $selectedServiceCode = $request->input('service_code');
        if ($user->isPic()) {
            $selectedServiceCode = $user->pic_service_code;
        }

        $activeService = null;
        if (!empty($selectedServiceCode) && $selectedServiceCode !== 'ALL') {
            $activeService = Service::where('code', $selectedServiceCode)->first();
        }

        // Filter rentang hari (default 30 hari; 0 = Semua waktu)
        $days = (int) $request->input('days', 30);
        $startDate = $days > 0 ? Carbon::now()->subDays($days)->startOfDay() : null;

        // Query utama dengan filter layanan dan tanggal
        $query = Permohonan::query();
        if ($startDate) {
            $query->where('permohonans.created_at', '>=', $startDate);
        }
        if ($activeService) {
            $query->where('permohonans.service_id', $activeService->id);
        }

        // 1. KPI Cards
        $totalRequests = (clone $query)->count();
        $completedRequests = (clone $query)->where('status', 'Selesai')->count();
        $activeRequests = (clone $query)->whereNotIn('status', ['Selesai', 'Ditolak'])->count();
        $rejectedRequests = (clone $query)->where('status', 'Ditolak')->count();

        // Lead Time (Hanya tiket berstatus Selesai yang memiliki kalkulasi menit)
        $avgLeadTimeMinutes = (clone $query)
            ->where('status', 'Selesai')
            ->whereNotNull('lead_time_minutes')
            ->avg('lead_time_minutes');

        $minLeadTimeMinutes = (clone $query)
            ->where('status', 'Selesai')
            ->whereNotNull('lead_time_minutes')
            ->min('lead_time_minutes');

        $avgLeadTimeFormatted = $this->formatMinutes($avgLeadTimeMinutes);
        $fastestLeadFormatted = $this->formatMinutes($minLeadTimeMinutes);

        // 2. Status Breakdown
        $serviceStatusMap = [
            'D' => ['Diajukan', 'Diproses', 'Direvisi', 'Selesai', 'Ditolak'],
            'P' => ['Diajukan', 'Produksi/Pemeriksaan Konten', 'Proses Tayang', 'Selesai', 'Ditolak'],
            'S' => ['Diajukan', 'Menunggu Approval', 'Diproses', 'Selesai', 'Ditolak'],
            'M' => ['Diajukan', 'Diproses', 'Selesai', 'Ditolak'],
            'L' => ['Diajukan', 'Terjadwalkan/Produksi Berita', 'Selesai', 'Ditolak'],
        ];

        if ($activeService && isset($serviceStatusMap[$activeService->code])) {
            $statuses = $serviceStatusMap[$activeService->code];
        } else {
            $dbStatuses = (clone $query)->distinct()->pluck('status')->filter()->toArray();
            $statuses = array_values(array_unique(array_merge(['Diajukan', 'Diproses', 'Terjadwalkan/Produksi Berita', 'Selesai', 'Ditolak'], $dbStatuses)));
        }

        $statusBreakdown = [];
        foreach ($statuses as $st) {
            $count = (clone $query)->where('status', $st)->count();
            $percentage = $totalRequests > 0 ? round(($count / $totalRequests) * 100, 1) : 0;
            $statusBreakdown[$st] = [
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        // 3. Beban & Kinerja Layanan (PIC HANYA melihat layanannya sendiri, SuperAdmin dapat melihat semua dan setiap layanan)
        if ($user->isPic()) {
            $allServices = Service::where('code', $user->pic_service_code)->get();
        } else {
            $allServices = Service::all();
        }

        $globalQuery = Permohonan::query();
        if ($startDate) {
            $globalQuery->where('created_at', '>=', $startDate);
        }
        $globalTotal = (clone $globalQuery)->count();

        $loadPerService = [];
        foreach ($allServices as $service) {
            $srvQuery = (clone $globalQuery)->where('service_id', $service->id);
            $srvCount = (clone $srvQuery)->count();
            $srvDone = (clone $srvQuery)->where('status', 'Selesai')->count();
            $srvActive = (clone $srvQuery)->whereNotIn('status', ['Selesai', 'Ditolak'])->count();
            $srvRejected = (clone $srvQuery)->where('status', 'Ditolak')->count();
            $srvLeadMinutes = (clone $srvQuery)->where('status', 'Selesai')->whereNotNull('lead_time_minutes')->avg('lead_time_minutes');

            $loadPerService[] = [
                'code' => $service->code,
                'name' => $service->name,
                'color' => $service->color,
                'count' => $srvCount,
                'selesai' => $srvDone,
                'aktif' => $srvActive,
                'ditolak' => $srvRejected,
                'percentage' => $globalTotal > 0 ? round(($srvCount / $globalTotal) * 100, 1) : 0,
                'completion_rate' => $srvCount > 0 ? round(($srvDone / $srvCount) * 100, 1) : 0,
                'avg_lead_time' => $this->formatMinutes($srvLeadMinutes),
                'avg_lead_time_minutes' => round($srvLeadMinutes ?? 0, 1),
            ];
        }

        // 4. Top 5 Unit Kerja Pemohon Terbanyak
        $topUnits = (clone $query)
            ->join('users', 'permohonans.user_id', '=', 'users.id')
            ->select('users.unit_kerja', DB::raw('COUNT(permohonans.id) as total'))
            ->whereNotNull('users.unit_kerja')
            ->where('users.unit_kerja', '!=', '')
            ->groupBy('users.unit_kerja')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // 5. Antrean Permohonan Aktif Terbaru / Perlu Tindakan Segera (Top 5 Paling Lama Belum Selesai)
        $pendingQueue = (clone $query)
            ->with(['user:id,name,unit_kerja', 'service:id,code,name,color'])
            ->whereIn('status', ['Diajukan', 'Diproses', 'Direvisi', 'Menunggu Approval Sebagian'])
            ->orderBy('created_at', 'asc')
            ->limit(5)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'nomor_tiket' => $p->nomor_tiket,
                    'judul_permohonan' => $p->judul_permohonan,
                    'status' => $p->status,
                    'pemohon' => $p->user->name ?? '-',
                    'unit_kerja' => $p->user->unit_kerja ?? '-',
                    'service_code' => $p->service->code ?? '-',
                    'service_name' => $p->service->name ?? '-',
                    'service_color' => $p->service->color ?? 'slate',
                    'created_at' => $p->created_at->format('d M Y, H:i'),
                    'lead_time_running' => $p->created_at->diffForHumans(null, true),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'user_role' => $user->role,
                'user_pic_service' => $user->pic_service_code,
                'selected_service' => $activeService ? [
                    'code' => $activeService->code,
                    'name' => $activeService->name,
                    'color' => $activeService->color,
                ] : null,
                'kpis' => [
                    'total_requests' => $totalRequests,
                    'completed_requests' => $completedRequests,
                    'active_requests' => $activeRequests,
                    'rejected_requests' => $rejectedRequests,
                    'avg_lead_time' => $avgLeadTimeFormatted,
                    'fastest_lead_time' => $fastestLeadFormatted,
                    'completion_rate' => $totalRequests > 0 ? round(($completedRequests / $totalRequests) * 100, 1) : 0,
                ],
                'load_per_service' => $loadPerService,
                'status_breakdown' => $statusBreakdown,
                'top_units' => $topUnits,
                'pending_queue' => $pendingQueue,
            ],
        ]);
    }

    /**
     * Format menit ke representasi waktu yang mudah dibaca (jam/hari/menit)
     */
    protected function formatMinutes(?float $minutes): string
    {
        if ($minutes === null || $minutes <= 0) {
            return '0 jam';
        }

        if ($minutes < 60) {
            return round($minutes) . ' menit';
        }

        $hours = round($minutes / 60, 1);
        if ($hours >= 24) {
            $days = round($hours / 24, 1);
            return "{$days} hari";
        }

        return "{$hours} jam";
    }
}
