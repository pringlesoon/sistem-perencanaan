<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConfigController extends Controller
{
    /**
     * Mengambil daftar parameter konfigurasi bisnis (PRD NFR-MAINT-02)
     */
    public function index(): JsonResponse
    {
        $configs = ServiceConfig::with('service')->get();

        return response()->json([
            'status' => 'success',
            'data' => $configs,
        ]);
    }

    /**
     * Memperbarui parameter konfigurasi bisnis (Khusus Admin)
     */
    public function update(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya Admin yang dapat mengubah konfigurasi sistem.',
            ], 403);
        }

        $request->validate([
            'configs' => 'required|array',
            'configs.*.id' => 'required|exists:service_configs,id',
            'configs.*.config_value' => 'required|string',
        ]);

        foreach ($request->configs as $item) {
            ServiceConfig::where('id', $item['id'])->update([
                'config_value' => $item['config_value'],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Konfigurasi parameter bisnis berhasil diperbarui.',
            'data' => ServiceConfig::with('service')->get(),
        ]);
    }
}
