<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestMultimediaDetail extends Model
{
    use HasFactory;

    protected $table = 'request_multimedia_details';

    protected $fillable = [
        'permohonan_id',
        'tanggal_pelaksanaan',
        'jam_mulai',
        'jam_selesai',
        'durasi_menit',
        'lokasi_alat',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pelaksanaan' => 'date',
            'durasi_menit' => 'integer',
        ];
    }

    public function permohonan(): BelongsTo
    {
        return $this->belongsTo(Permohonan::class);
    }
}
