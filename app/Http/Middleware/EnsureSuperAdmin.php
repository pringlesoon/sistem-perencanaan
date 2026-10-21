<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user || $user->role !== 'SuperAdmin') {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Endpoint ini hanya dapat diakses oleh Superadmin.',
            ], 403);
        }

        if (isset($user->is_active) && !$user->is_active) {
            Auth::logout();
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Anda telah dinonaktifkan.',
            ], 403);
        }

        return $next($request);
    }
}
