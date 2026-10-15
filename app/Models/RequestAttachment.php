<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestAttachment extends Model
{
    use HasFactory;

    protected $table = 'request_attachments';

    protected $fillable = [
        'permohonan_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
    ];

    protected $appends = ['file_url', 'download_url', 'clean_file_name'];

    public function permohonan(): BelongsTo
    {
        return $this->belongsTo(Permohonan::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    public function getDownloadUrlAttribute(): ?string
    {
        return $this->file_path ? url('/api/attachments/' . $this->id . '/download') : null;
    }

    public function getCleanFileNameAttribute(): ?string
    {
        if (!$this->file_name) return null;
        return preg_replace('/^\[Hasil Revisi(\/Pemeriksaan)?\]\s*/i', '', $this->file_name);
    }
}
