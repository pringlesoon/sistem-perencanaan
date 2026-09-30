<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'rules_text',
        'icon',
        'color',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function configs(): HasMany
    {
        return $this->hasMany(ServiceConfig::class);
    }

    public function permohonans(): HasMany
    {
        return $this->hasMany(Permohonan::class);
    }

    public function getConfig(string $key, mixed $default = null): mixed
    {
        $config = $this->configs()->where('config_key', $key)->first();
        return $config ? $config->config_value : $default;
    }
}
