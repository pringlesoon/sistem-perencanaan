<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    use HasFactory;

    protected $table = 'inventory_items';

    protected $fillable = [
        'nama_item',
        'stok_tersedia',
        'satuan',
        'deskripsi',
        'kategori',
        'kondisi',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(InventoryLog::class, 'inventory_item_id')->orderBy('created_at', 'desc');
    }
}
