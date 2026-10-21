<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLdapTest extends TestCase
{
    use RefreshDatabase;

    /**
     * AC-01: User dengan kredensial LDAP valid berhasil login dan diarahkan ke Dasbor
     */
    public function test_user_can_login_with_valid_ldap_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'andi',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'username' => 'andi',
                        'role' => 'User',
                    ],
                ],
            ]);

        $this->assertAuthenticated();
    }

    /**
     * AC-02: User dengan kredensial LDAP tidak valid menerima pesan error yang jelas
     */
    public function test_user_fails_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'andi',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertGuest();
    }

    /**
     * AC-03: Role Tata Usaha termapping dengan benar
     */
    public function test_role_mapping_for_tata_usaha(): void
    {
        // Tata Usaha
        $resTu = $this->postJson('/api/v1/auth/login', [
            'username' => 'sari',
            'password' => 'password',
        ]);
        $resTu->assertStatus(200)
            ->assertJsonPath('data.user.role', 'Tata Usaha');

        // Approver
        $resApprover = $this->postJson('/api/v1/auth/login', [
            'username' => 'budi',
            'password' => 'password',
        ]);
        $resApprover->assertStatus(200)
            ->assertJsonPath('data.user.role', 'Approver');
    }

    /**
     * AC-04: User yang dinonaktifkan (is_active = false) ditolak saat login meskipun password benar (403)
     */
    public function test_inactive_user_cannot_login_even_with_valid_credentials(): void
    {
        // Buat user di DB lokal yang berstatus nonaktif
        User::create([
            'username' => 'andi',
            'name' => 'Andi Saputra',
            'email' => 'andi@kampus.ac.id',
            'unit_kerja' => 'Biro Akademik',
            'role' => 'User',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'username' => 'andi',
            'password' => 'password',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Akun Anda dinonaktifkan. Silakan hubungi Superadmin atau administrator sistem.',
            ]);

        $this->assertGuest();
    }
}
