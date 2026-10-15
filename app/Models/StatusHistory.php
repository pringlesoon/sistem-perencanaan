<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusHistory extends Model
{
    use HasFactory;

    protected $table = 'status_histories';

    protected $fillable = [
        'permohonan_id',
        'user_id',
        'status_sebelumnya',
        'status_baru',
        'catatan',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
    ];

    protected $with = ['attachments'];

    protected $appends = ['file_url', 'download_url', 'clean_file_name'];

    public function attachments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StatusHistoryAttachment::class, 'status_history_id');
    }

    public function permohonan(): BelongsTo
    {
        return $this->belongsTo(Permohonan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    public function getDownloadUrlAttribute(): ?string
    {
        return $this->file_path ? url('/api/status-histories/' . $this->id . '/download') : null;
    }

    public function getCleanFileNameAttribute(): ?string
    {
        if (!$this->file_name) return null;
        return preg_replace('/^\[Hasil Revisi\]\s*/i', '', $this->file_name);
    }
}
