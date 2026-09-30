<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Permohonan extends Model
{
    use HasFactory;

    protected $table = 'permohonans';

    protected $fillable = [
        'nomor_tiket',
        'user_id',
        'service_id',
        'kategori',
        'judul_permohonan',
        'deskripsi_kebutuhan',
        'tanggal_dibutuhkan',
        'status',
        'catatan_revisi',
        'lead_time_minutes',
        'selesai_at',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_dibutuhkan' => 'date',
            'selesai_at' => 'datetime',
            'lead_time_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function multimediaDetail(): HasOne
    {
        return $this->hasOne(RequestMultimediaDetail::class, 'permohonan_id');
    }

    public function suvenirDetail(): HasOne
    {
        return $this->hasOne(RequestSuvenirDetail::class, 'permohonan_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(StatusHistory::class, 'permohonan_id')->orderBy('created_at', 'asc');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(RequestAttachment::class, 'permohonan_id');
    }

    /**
     * Hitung Lead Time saat ini atau hingga status selesai
     */
    public function getCalculatedLeadTimeAttribute(): string
    {
        $start = $this->created_at;
        $end = $this->selesai_at ?? now();

        $totalDetik = (int) $start->diffInSeconds($end);
        $diffMinutes = intdiv($totalDetik, 60);
        $sisaDetik   = $totalDetik % 60;

        if ($diffMinutes < 60) {
            $result = $diffMinutes . ' menit';
            if ($sisaDetik > 0) $result .= " {$sisaDetik} detik";
            return $result;
        }

        $hours = intdiv($diffMinutes, 60);
        $minutes = $diffMinutes % 60;

        if ($hours < 24) {
            return "{$hours} jam" . ($minutes > 0 ? " {$minutes} mnt" : "");
        }

        $days = intdiv($hours, 24);
        $remainingHours = $hours % 24;
        return "{$days} hari" . ($remainingHours > 0 ? " {$remainingHours} jam" : "");
    }
}
