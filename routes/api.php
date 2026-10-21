<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\MultimediaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermohonanController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Sistem Layanan Marketing (SLM) YARSI v2.0
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // 1. Autentikasi LDAP / SSO
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // 2. Master Layanan & Aturan Main
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{code}', [ServiceController::class, 'show']);
    Route::put('/services/{code}', [ServiceController::class, 'update']);
    Route::put('/services/{code}/rules', [ServiceController::class, 'updateRules']);

    // 3. Modul Multimedia — Conflict Checking & Availability & Schedule (PRD FR-MM-03)
    Route::get('/multimedia/availability', [MultimediaController::class, 'availability']);
    Route::get('/multimedia/schedule', [MultimediaController::class, 'schedule']);

    // 4. Modul Permohonan (Requests) & Tracking
    Route::get('/requests', [PermohonanController::class, 'index']);
    Route::post('/requests', [PermohonanController::class, 'store']);
    Route::get('/requests/{id}', [PermohonanController::class, 'show']);
    Route::match(['patch', 'post'], '/requests/{id}/status', [PermohonanController::class, 'updateStatus']);
    Route::match(['patch', 'post'], '/requests/{id}/archive', [PermohonanController::class, 'toggleArchive']);
    Route::post('/requests/{id}/confirm-quota-pic', [PermohonanController::class, 'confirmQuotaPic']);
    Route::post('/requests/{id}/approve', [PermohonanController::class, 'approveSuvenir']);
    Route::get('/attachments/{id}/download', [PermohonanController::class, 'downloadAttachment']);
    Route::get('/status-histories/{id}/download', [PermohonanController::class, 'downloadStatusHistoryFile']);
    Route::get('/status-history-attachments/{id}/download', [PermohonanController::class, 'downloadStatusHistoryAttachment']);

    // 5. Modul Notifikasi In-App
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // 6. Dasbor Analitik (Admin & SuperAdmin)
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    // 7. Pengaturan Konfigurasi Parameter Bisnis
    Route::get('/config', [ConfigController::class, 'index']);
    Route::put('/config', [ConfigController::class, 'update']);

    // 8. Ekspor Data Permohonan (CSV & Excel)
    Route::get('/export/csv', [ExportController::class, 'csv']);
    Route::get('/export/excel', [ExportController::class, 'excel']);

    // 9. Kelola User (SuperAdmin only via middleware)
    Route::middleware(['superadmin'])->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::patch('/users/{id}/role', [UserController::class, 'updateRole']);
        Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::patch('/users/{id}/assign-pic', [UserController::class, 'assignPic']);
    });

    // 10. Modul Inventaris & Stok (Suvenir & Multimedia)
    Route::get('/inventory', [\App\Http\Controllers\Api\InventoryController::class, 'index']);
    Route::post('/inventory', [\App\Http\Controllers\Api\InventoryController::class, 'store']);
    Route::put('/inventory/{id}', [\App\Http\Controllers\Api\InventoryController::class, 'update']);
    Route::post('/inventory/{id}/adjust', [\App\Http\Controllers\Api\InventoryController::class, 'adjust']);
    Route::get('/inventory-logs', [\App\Http\Controllers\Api\InventoryController::class, 'logs']);
    Route::get('/inventory-logs/export/excel', [\App\Http\Controllers\Api\InventoryController::class, 'exportExcel']);
});
