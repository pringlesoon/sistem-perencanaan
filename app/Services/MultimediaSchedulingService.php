<?php

namespace App\Services;

use App\Models\Permohonan;
use App\Models\RequestMultimediaDetail;
use App\Models\Service;
use App\Models\ServiceConfig;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MultimediaSchedulingService
{
    /**
     * Mengambil daftar slot waktu yang sudah terisi pada tanggal tertentu
     */
    public function getAvailability(string $date): Collection
    {
        return RequestMultimediaDetail::query()
            ->join('permohonans', 'request_multimedia_details.permohonan_id', '=', 'permohonans.id')
            ->where('request_multimedia_details.tanggal_pelaksanaan', $date)
            ->whereIn('permohonans.status', ['Diajukan', 'Diproses', 'Selesai'])
            ->select([
                'request_multimedia_details.id',
                'request_multimedia_details.permohonan_id',
                'permohonans.nomor_tiket',
                'permohonans.judul_permohonan',
                'request_multimedia_details.jam_mulai',
                'request_multimedia_details.jam_selesai',
                'request_multimedia_details.durasi_menit',
                'request_multimedia_details.lokasi_alat',
                'permohonans.status',
            ])
            ->orderBy('request_multimedia_details.jam_mulai', 'asc')
            ->get();
    }

    /**
     * Memeriksa apakah terjadi bentrok jadwal (Conflict Checking)
     * Menggunakan query overlap: (new.jam_mulai < existing.jam_selesai) AND (new.jam_selesai > existing.jam_mulai)
     */
    public function checkConflict(
        string $date,
        string $startTime,
        string $endTime,
        ?int $excludePermohonanId = null,
        bool $useLock = false
    ): bool {
        // Normalisasi format waktu ke H:i:s
        $startTime = Carbon::parse($startTime)->format('H:i:s');
        $endTime = Carbon::parse($endTime)->format('H:i:s');

        $query = RequestMultimediaDetail::query()
            ->join('permohonans', 'request_multimedia_details.permohonan_id', '=', 'permohonans.id')
            ->where('request_multimedia_details.tanggal_pelaksanaan', $date)
            ->whereIn('permohonans.status', ['Diajukan', 'Diproses', 'Selesai'])
            ->where(function ($q) use ($startTime, $endTime) {
                // Syarat Overlap
                $q->where('request_multimedia_details.jam_mulai', '<', $endTime)
                  ->where('request_multimedia_details.jam_selesai', '>', $startTime);
            });

        if ($excludePermohonanId) {
            $query->where('permohonans.id', '!=', $excludePermohonanId);
        }

        if ($useLock) {
            $query->lockForUpdate();
        }

        return $query->exists();
    }

    /**
     * Validasi durasi maksimal peminjaman berdasarkan config database
     */
    public function validateDuration(string $startTime, string $endTime): array
    {
        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);

        if ($end->lessThanOrEqualTo($start)) {
            return [
                'valid' => false,
                'duration' => 0,
                'max_duration' => 0,
                'message' => 'Jam selesai harus lebih akhir dari jam mulai.',
            ];
        }

        $durationMinutes = $start->diffInMinutes($end);

        // Ambil batas maksimal dari config di database
        $service = Service::where('code', 'M')->first();
        $maxDuration = 180; // default 3 jam
        if ($service) {
            $config = ServiceConfig::where('service_id', $service->id)
                ->where('config_key', 'max_duration_minutes')
                ->first();
            if ($config) {
                $maxDuration = (int) $config->config_value;
            }
        }

        if ($durationMinutes > $maxDuration) {
            $maxHours = round($maxDuration / 60, 1);
            return [
                'valid' => false,
                'duration' => $durationMinutes,
                'max_duration' => $maxDuration,
                'message' => "Durasi pemesanan ({$durationMinutes} menit) melebihi batas maksimal yang diizinkan ({$maxHours} jam / {$maxDuration} menit).",
            ];
        }

        return [
            'valid' => true,
            'duration' => $durationMinutes,
            'max_duration' => $maxDuration,
            'message' => null,
        ];
    }
}
