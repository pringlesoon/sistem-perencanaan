<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * List all users with pagination, search, and filters (SuperAdmin only)
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('picService');

        // Pencarian berdasarkan Nama, Username (NIP/NPM), Email, Unit Kerja
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('unit_kerja', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan Role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter berdasarkan Status (is_active)
        if ($request->filled('status')) {
            if ($request->status === 'active' || $request->status === '1' || $request->status === 'true') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive' || $request->status === '0' || $request->status === 'false') {
                $query->where('is_active', false);
            }
        }

        $perPage = max(1, min((int) $request->input('per_page', 10), 100));

        $users = $query->orderBy('name', 'asc')->paginate($perPage);

        $users->getCollection()->transform(function ($u) {
            return [
                'id'               => $u->id,
                'name'             => $u->name,
                'username'         => $u->username,
                'email'            => $u->email,
                'unit_kerja'       => $u->unit_kerja,
                'role'             => $u->role,
                'is_active'        => (bool) ($u->is_active ?? true),
                'pic_service_code' => $u->pic_service_code,
                'pic_service'      => $u->picService ? [
                    'code' => $u->picService->code,
                    'name' => $u->picService->name,
                ] : null,
                'created_at'       => $u->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $users,
        ]);
    }

    /**
     * Ubah Role Pengguna (SuperAdmin / Tata Usaha / PIC / User)
     */
    public function updateRole(Request $request, $userId): JsonResponse
    {
        $currentUser = Auth::user();
        $user = User::findOrFail($userId);

        $request->validate([
            'role'             => 'required|string|in:SuperAdmin,Tata Usaha,PIC,User',
            'pic_service_code' => 'nullable|string|in:D,P,S,M,L',
        ]);

        $newRole = $request->role;
        $picServiceCode = $request->pic_service_code;

        // Cegah SuperAdmin mendowngrade akunnya sendiri
        if ($currentUser && $user->id === $currentUser->id && $newRole !== 'SuperAdmin') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Anda tidak dapat menurunkan role akun Anda sendiri.',
            ], 422);
        }

        if ($newRole === 'PIC') {
            if (!$picServiceCode) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Harap pilih jenis layanan untuk pengguna dengan role PIC.',
                ], 422);
            }
            $user->role = 'PIC';
            $user->pic_service_code = $picServiceCode;
        } else {
            $user->role = $newRole;
            $user->pic_service_code = null;
        }

        $user->save();

        return response()->json([
            'status'  => 'success',
            'message' => "Role pengguna {$user->name} berhasil diperbarui menjadi {$user->role}" . ($user->role === 'PIC' ? " (Layanan {$user->pic_service_code})" : "") . ".",
            'data'    => [
                'id'               => $user->id,
                'name'             => $user->name,
                'role'             => $user->role,
                'pic_service_code' => $user->pic_service_code,
            ],
        ]);
    }

    /**
     * Toggle Status Akun (Aktifkan / Nonaktifkan)
     */
    public function toggleStatus(Request $request, $userId): JsonResponse
    {
        $currentUser = Auth::user();
        $user = User::findOrFail($userId);

        // Cegah menonaktifkan akun sendiri
        if ($currentUser && $user->id === $currentUser->id) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            ], 422);
        }

        // Cegah menonaktifkan sesama SuperAdmin
        if ($user->role === 'SuperAdmin' && $user->is_active) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tidak dapat menonaktifkan akun Super Admin.',
            ], 422);
        }

        if ($request->has('is_active')) {
            $user->is_active = (bool) $request->is_active;
        } else {
            $user->is_active = !$user->is_active;
        }

        $user->save();

        $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'status'  => 'success',
            'message' => "Akun {$user->name} berhasil {$statusText}.",
            'data'    => [
                'id'        => $user->id,
                'name'      => $user->name,
                'is_active' => (bool) $user->is_active,
            ],
        ]);
    }

    /**
     * Assign a user as PIC for a service (SuperAdmin only)
     * Tetap disediakan untuk backward compatibility
     */
    public function assignPic(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'service_code' => 'nullable|string|in:D,P,S,M,L',
        ]);

        $serviceCode = $request->service_code;
        $request->merge([
            'role' => $serviceCode ? 'PIC' : 'User',
            'pic_service_code' => $serviceCode,
        ]);

        return $this->updateRole($request, $userId);
    }

    /**
     * Search active users for "On Behalf Of" (Mewakili Pemohon) feature
     * Accessible by: Tata Usaha, PIC, SuperAdmin
     */
    public function search(Request $request): JsonResponse
    {
        $currentUser = Auth::user();
        if (!$currentUser || !in_array($currentUser->role, ['SuperAdmin', 'Tata Usaha', 'PIC'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akses ditolak. Fitur pencarian user hanya dapat diakses oleh Tata Usaha, PIC, atau SuperAdmin.',
            ], 403);
        }

        $search = trim((string) $request->input('search', ''));
        $query = User::query()->where('is_active', true);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('unit_kerja', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name', 'asc')
            ->limit(25)
            ->get(['id', 'name', 'username', 'email', 'unit_kerja', 'role']);

        return response()->json([
            'status' => 'success',
            'data'   => $users,
        ]);
    }

    /**
     * Delete user (SuperAdmin only)
     */
    public function destroy($userId): JsonResponse
    {
        $currentUser = Auth::user();
        $user = User::findOrFail($userId);

        if ($currentUser && $user->id === $currentUser->id) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        if ($user->permohonans()->count() > 0) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pengguna tidak dapat dihapus karena memiliki riwayat permohonan. Anda dapat menonaktifkan status aksesnya.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'status'  => 'success',
            'message' => "Pengguna {$user->name} ({$user->username}) berhasil dihapus.",
        ]);
    }
}
