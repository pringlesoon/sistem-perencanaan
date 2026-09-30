<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestSuvenirDetail extends Model
{
    use HasFactory;

    protected $table = 'request_suvenir_details';

    protected $fillable = [
        'permohonan_id',
        'nama_item',
        'qty_diminta',
        'qty_disetujui_otomatis',
        'qty_perlu_approval',
        'status_approval',
        'catatan_approver',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'qty_diminta' => 'integer',
            'qty_disetujui_otomatis' => 'integer',
            'qty_perlu_approval' => 'integer',
            'approved_at' => 'datetime',
        ];
    }

    public function permohonan(): BelongsTo
    {
        return $this->belongsTo(Permohonan::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
