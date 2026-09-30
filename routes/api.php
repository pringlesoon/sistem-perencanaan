<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\MultimediaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermohonanController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Sistem Aplikasi Permohonan Terpusat (SAPT) v1.0 MVP
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
    Route::put('/services/{code}/rules', [ServiceController::class, 'updateRules']);

    // 3. Modul Multimedia — Conflict Checking & Availability (PRD FR-MM-03)
    Route::get('/multimedia/availability', [MultimediaController::class, 'availability']);

    // 4. Modul Permohonan (Requests) & Tracking
    Route::get('/requests', [PermohonanController::class, 'index']);
    Route::post('/requests', [PermohonanController::class, 'store']);
    Route::get('/requests/{id}', [PermohonanController::class, 'show']);
    Route::patch('/requests/{id}/status', [PermohonanController::class, 'updateStatus']);
    Route::post('/requests/{id}/approve', [PermohonanController::class, 'approveSuvenir']);

    // 5. Modul Notifikasi In-App
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // 6. Dasbor Analitik (Admin & Approver)
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    // 7. Pengaturan Konfigurasi Parameter Bisnis
    Route::get('/config', [ConfigController::class, 'index']);
    Route::put('/config', [ConfigController::class, 'update']);

    // 8. Ekspor Data Permohonan (CSV & Excel)
    Route::get('/export/csv', [ExportController::class, 'csv']);
    Route::get('/export/excel', [ExportController::class, 'excel']);
});
