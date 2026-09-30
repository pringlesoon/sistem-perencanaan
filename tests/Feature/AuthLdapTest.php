<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLdapTest extends TestCase
{
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
     * AC-03: Role Admin dan Approver termapping dengan benar
     */
    public function test_role_mapping_for_admin_and_approver(): void
    {
        // Admin
        $resAdmin = $this->postJson('/api/v1/auth/login', [
            'username' => 'sari',
            'password' => 'password',
        ]);
        $resAdmin->assertStatus(200)
            ->assertJsonPath('data.user.role', 'Admin');

        // Approver
        $resApprover = $this->postJson('/api/v1/auth/login', [
            'username' => 'budi',
            'password' => 'password',
        ]);
        $resApprover->assertStatus(200)
            ->assertJsonPath('data.user.role', 'Approver');
    }
}
