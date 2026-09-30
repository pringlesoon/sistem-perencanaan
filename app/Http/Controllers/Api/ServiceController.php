<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permohonan;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceController extends Controller
{
    /**
     * Daftar 5 Layanan Utama
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $services = Service::with('configs')
            ->where('is_active', true)
            ->get()
            ->map(function ($service) use ($user) {
                // Hitung permohonan aktif milik user untuk badge
                $activeCount = 0;
                if ($user) {
                    $activeCount = Permohonan::where('service_id', $service->id)
                        ->where('user_id', $user->id)
                        ->whereIn('status', ['Diajukan', 'Diproses', 'Direvisi', 'Menunggu Approval Sebagian'])
                        ->count();
                }

                return [
                    'id' => $service->id,
                    'code' => $service->code,
                    'name' => $service->name,
                    'description' => $service->description,
                    'rules_text' => $service->rules_text,
                    'icon' => $service->icon,
                    'color' => $service->color,
                    'active_requests_count' => $activeCount,
                    'configs' => $service->configs->pluck('config_value', 'config_key'),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $services,
        ]);
    }

    /**
     * Detail Layanan berdasarkan kode (D, P, S, M, L)
     */
    public function show(string $code): JsonResponse
    {
        $service = Service::with('configs')->where('code', strtoupper($code))->first();

        if (!$service) {
            return response()->json([
                'status' => 'error',
                'message' => 'Layanan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $service->id,
                'code' => $service->code,
                'name' => $service->name,
                'description' => $service->description,
                'rules_text' => $service->rules_text,
                'icon' => $service->icon,
                'color' => $service->color,
                'configs' => $service->configs->pluck('config_value', 'config_key'),
            ],
        ]);
    }

    /**
     * Mengubah Aturan Main Layanan (Khusus Admin)
     */
    public function updateRules(Request $request, string $code): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya Admin yang dapat memperbarui Aturan Main.',
            ], 403);
        }

        $request->validate([
            'rules_text' => 'required|string',
        ]);

        $service = Service::where('code', strtoupper($code))->firstOrFail();
        $service->rules_text = $request->rules_text;
        $service->save();

        return response()->json([
            'status' => 'success',
            'message' => "Aturan Main untuk {$service->name} berhasil diperbarui.",
            'data' => $service,
        ]);
    }
}
