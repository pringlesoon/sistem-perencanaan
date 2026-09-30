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
     * Dasbor Analitik Kinerja Divisi Marketing/Humas (PRD FR-AN-01 s.d. FR-AN-03)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || (!$user->isAdmin() && !$user->isApprover())) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Dasbor Analitik hanya dapat diakses oleh Admin dan Approver.',
            ], 403);
        }

        // Filter rentang hari (default 30 hari)
        $days = (int) $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days)->startOfDay();

        $query = Permohonan::query();
        if ($days > 0) {
            $query->where('created_at', '>=', $startDate);
        }

        // 1. KPI Cards
        $totalRequests = (clone $query)->count();
        $completedRequests = (clone $query)->where('status', 'Selesai')->count();
        $activeRequests = (clone $query)->whereIn('status', ['Diajukan', 'Diproses', 'Direvisi', 'Menunggu Approval Sebagian'])->count();
        $rejectedRequests = (clone $query)->where('status', 'Ditolak')->count();

        // Rata-rata Lead Time (hanya untuk yang selesai atau memiliki lead_time_minutes)
        $avgLeadTimeMinutes = (clone $query)
            ->where('status', 'Selesai')
            ->whereNotNull('lead_time_minutes')
            ->avg('lead_time_minutes');

        $avgLeadTimeFormatted = '0 jam';
        if ($avgLeadTimeMinutes) {
            $hours = round($avgLeadTimeMinutes / 60, 1);
            $avgLeadTimeFormatted = ($hours >= 24)
                ? round($hours / 24, 1) . ' hari'
                : "{$hours} jam";
        }

        // 2. Beban per Layanan (PRD FR-AN-02)
        $services = Service::all();
        $loadPerService = [];
        foreach ($services as $service) {
            $count = (clone $query)->where('service_id', $service->id)->count();
            $loadPerService[] = [
                'code' => $service->code,
                'name' => $service->name,
                'color' => $service->color,
                'count' => $count,
                'percentage' => $totalRequests > 0 ? round(($count / $totalRequests) * 100, 1) : 0,
            ];
        }

        // 3. Tren Jumlah Request per Hari (Line Chart)
        $trendQuery = (clone $query)
            ->select([
                DB::raw("DATE(created_at) as date"),
                DB::raw("COUNT(*) as total"),
                DB::raw("SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai")
            ])
            ->groupBy(DB::raw("DATE(created_at)"))
            ->orderBy('date', 'asc')
            ->get();

        // 4. Status Breakdown
        $statusBreakdown = [
            'Diajukan' => (clone $query)->where('status', 'Diajukan')->count(),
            'Diproses' => (clone $query)->where('status', 'Diproses')->count(),
            'Direvisi' => (clone $query)->where('status', 'Direvisi')->count(),
            'Menunggu Approval Sebagian' => (clone $query)->where('status', 'Menunggu Approval Sebagian')->count(),
            'Selesai' => $completedRequests,
            'Ditolak' => $rejectedRequests,
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'kpis' => [
                    'total_requests' => $totalRequests,
                    'completed_requests' => $completedRequests,
                    'active_requests' => $activeRequests,
                    'rejected_requests' => $rejectedRequests,
                    'avg_lead_time' => $avgLeadTimeFormatted,
                    'completion_rate' => $totalRequests > 0 ? round(($completedRequests / $totalRequests) * 100, 1) : 0,
                ],
                'load_per_service' => $loadPerService,
                'trend' => $trendQuery,
                'status_breakdown' => $statusBreakdown,
            ],
        ]);
    }
}
