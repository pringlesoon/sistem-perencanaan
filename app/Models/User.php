<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'unit_kerja',
        'role',
        'is_active',
        'pic_service_code',
        'password',
        'guid',
        'domain',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->password)) {
                $user->password = \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(32));
            }
        });
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SuperAdmin';
    }

    public function isTataUsaha(): bool
    {
        return $this->role === 'Tata Usaha';
    }

    public function hasAdminAccess(): bool
    {
        return $this->role === 'SuperAdmin';
    }

    public function isPic(): bool
    {
        return $this->role === 'PIC';
    }




    public function isUser(): bool
    {
        return $this->role === 'User';
    }

    public function picService(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'pic_service_code', 'code');
    }

    public function permohonans(): HasMany
    {
        return $this->hasMany(Permohonan::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(StatusHistory::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
