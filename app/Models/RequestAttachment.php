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

    public function permohonan(): BelongsTo
    {
        return $this->belongsTo(Permohonan::class);
    }
}
