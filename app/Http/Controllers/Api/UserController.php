<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List all users (SuperAdmin only)
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = Auth::user();
        if (!$currentUser || $currentUser->role !== 'SuperAdmin') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $users = User::with('picService')
            ->orderBy('name')
            ->get()
            ->map(function ($u) {
                return [
                    'id'               => $u->id,
                    'name'             => $u->name,
                    'username'         => $u->username,
                    'email'            => $u->email,
                    'unit_kerja'       => $u->unit_kerja,
                    'role'             => $u->role,
                    'pic_service_code' => $u->pic_service_code,
                    'pic_service'      => $u->picService ? [
                        'code' => $u->picService->code,
                        'name' => $u->picService->name,
                    ] : null,
                ];
            });

        return response()->json(['status' => 'success', 'data' => $users]);
    }

    /**
     * Assign a user as PIC for a service (SuperAdmin only)
     */
    public function assignPic(Request $request, $userId): JsonResponse
    {
        $currentUser = Auth::user();
        if (!$currentUser || $currentUser->role !== 'SuperAdmin') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'service_code' => 'nullable|string|in:D,P,S,M,L',
        ]);

        $user = User::findOrFail($userId);

        // Prevent changing SuperAdmin role
        if ($user->role === 'SuperAdmin') {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat mengubah role Super Admin.'], 422);
        }

        $serviceCode = $request->service_code;

        if ($serviceCode) {
            $user->role = 'PIC';
            $user->pic_service_code = $serviceCode;
        } else {
            // Remove PIC assignment - revert to User
            $user->role = 'User';
            $user->pic_service_code = null;
        }

        $user->save();

        return response()->json([
            'status'  => 'success',
            'message' => $serviceCode
                ? "Pengguna {$user->name} berhasil ditetapkan sebagai PIC layanan {$serviceCode}."
                : "Pengguna {$user->name} berhasil diubah kembali menjadi User.",
            'data'    => [
                'id'               => $user->id,
                'name'             => $user->name,
                'role'             => $user->role,
                'pic_service_code' => $user->pic_service_code,
            ],
        ]);
    }

    /**
     * Create a new user (SuperAdmin only)
     */
    public function store(Request $request): JsonResponse
    {
        $currentUser = Auth::user();
        if (!$currentUser || $currentUser->role !== 'SuperAdmin') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'name'       => 'required|string|max:255',
            'username'   => 'required|string|unique:users|max:50',
            'email'      => 'required|email|unique:users',
            'unit_kerja' => 'nullable|string|max:255',
            'password'   => 'required|string|min:6',
        ]);

        $user = User::create([
            'name'       => $request->name,
            'username'   => $request->username,
            'email'      => $request->email,
            'unit_kerja' => $request->unit_kerja,
            'role'       => 'User',
            'password'   => Hash::make($request->password),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => "Akun {$user->name} berhasil dibuat.",
            'data'    => ['id' => $user->id, 'name' => $user->name, 'role' => $user->role],
        ]);
    }

    /**
     * Delete a user (SuperAdmin only)
     */
    public function destroy($userId): JsonResponse
    {
        $currentUser = Auth::user();
        if (!$currentUser || $currentUser->role !== 'SuperAdmin') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $user = User::findOrFail($userId);

        if ($user->role === 'SuperAdmin') {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus akun Super Admin.'], 422);
        }

        if ($user->id === $currentUser->id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus akun sendiri.'], 422);
        }

        $user->delete();

        return response()->json(['status' => 'success', 'message' => "Akun {$user->name} berhasil dihapus."]);
    }
}
