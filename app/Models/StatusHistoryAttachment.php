<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusHistoryAttachment extends Model
{
    use HasFactory;

    protected $table = 'status_history_attachments';

    protected $fillable = [
        'status_history_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
    ];

    protected $appends = ['file_url', 'download_url', 'clean_file_name'];

    public function statusHistory(): BelongsTo
    {
        return $this->belongsTo(StatusHistory::class);
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    public function getDownloadUrlAttribute(): ?string
    {
        return $this->file_path ? url('/api/v1/status-history-attachments/' . $this->id . '/download') : null;
    }

    public function getCleanFileNameAttribute(): ?string
    {
        if (!$this->file_name) return null;
        return preg_replace('/^\[Hasil Revisi\]\s*/i', '', $this->file_name);
    }
}
