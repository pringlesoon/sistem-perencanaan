<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LdapAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    protected LdapAuthService $ldapService;

    public function __construct(LdapAuthService $ldapService)
    {
        $this->ldapService = $ldapService;
    }

    /**
     * Login menggunakan akun LDAP/SSO
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = $this->ldapService->authenticate($request->username, $request->password);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kredensial LDAP tidak valid atau akun tidak terdaftar pada direktori institusi.',
            ], 401);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil melalui SSO LDAP.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'unit_kerja' => $user->unit_kerja,
                    'role' => $user->role,
                    'pic_service_code' => $user->pic_service_code,
                ],
            ],
        ]);
    }

    /**
     * Mendapatkan profil pengguna aktif
     */
    public function me(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sesi autentikasi telah berakhir.',
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'unit_kerja' => $user->unit_kerja,
                    'role' => $user->role,
                    'pic_service_code' => $user->pic_service_code,
                ],
            ],
        ]);
    }

    /**
     * Logout pengguna
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil logout.',
        ]);
    }
}
