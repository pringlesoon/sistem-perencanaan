<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Mengambil daftar notifikasi pengguna aktif
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    /**
     * Tandai notifikasi sebagai sudah dibaca
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = Auth::user();
        $notif = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notif->is_read = true;
        $notif->read_at = Carbon::now();
        $notif->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Notifikasi ditandai telah dibaca.',
            'data' => $notif,
        ]);
    }

    /**
     * Tandai seluruh notifikasi sebagai sudah dibaca
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => Carbon::now(),
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Seluruh notifikasi telah ditandai dibaca.',
        ]);
    }
}
