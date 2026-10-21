<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Service::create([
            'code' => 'D',
            'name' => 'Layanan Desain Grafis',
            'description' => 'Desain brosur',
            'rules_text' => 'Rules',
        ]);
    }

    public function test_non_superadmin_cannot_access_user_management(): void
    {
        $user = User::create([
            'name' => 'Andi User',
            'username' => 'andi',
            'email' => 'andi@kampus.ac.id',
            'role' => 'User',
            'is_active' => true,
        ]);

        $res = $this->actingAs($user)->getJson('/api/v1/users');
        $res->assertStatus(403);

        $resPatchRole = $this->actingAs($user)->patchJson("/api/v1/users/{$user->id}/role", [
            'role' => 'SuperAdmin',
        ]);
        $resPatchRole->assertStatus(403);

        $resPatchStatus = $this->actingAs($user)->patchJson("/api/v1/users/{$user->id}/toggle-status");
        $resPatchStatus->assertStatus(403);
    }

    public function test_superadmin_can_view_users_with_pagination_and_search(): void
    {
        $superadmin = User::create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@kampus.ac.id',
            'role' => 'SuperAdmin',
            'is_active' => true,
        ]);

        // Create 15 dummy users
        for ($i = 1; $i <= 15; $i++) {
            User::create([
                'name' => "User {$i}",
                'username' => "user{$i}",
                'email' => "user{$i}@kampus.ac.id",
                'unit_kerja' => $i <= 5 ? 'Fakultas Kedokteran' : 'Fakultas Teknologi Informasi',
                'role' => 'User',
                'is_active' => $i % 2 === 0,
            ]);
        }

        // Test pagination 10 per page
        $res = $this->actingAs($superadmin)->getJson('/api/v1/users?per_page=10');
        $res->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.per_page', 10)
            ->assertJsonPath('data.total', 16); // 1 superadmin + 15 users

        $data = $res->json('data.data');
        $this->assertCount(10, $data);

        // Test search
        $resSearch = $this->actingAs($superadmin)->getJson('/api/v1/users?search=user12');
        $resSearch->assertStatus(200);
        $this->assertEquals('user12', $resSearch->json('data.data.0.username'));

        // Test filter status inactive
        $resFilter = $this->actingAs($superadmin)->getJson('/api/v1/users?status=inactive');
        $resFilter->assertStatus(200);
        foreach ($resFilter->json('data.data') as $u) {
            $this->assertFalse($u['is_active']);
        }
    }

    public function test_superadmin_can_update_user_role_and_pic_service(): void
    {
        $superadmin = User::create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@kampus.ac.id',
            'role' => 'SuperAdmin',
            'is_active' => true,
        ]);

        $targetUser = User::create([
            'name' => 'Bagas',
            'username' => 'bagas',
            'email' => 'bagas@kampus.ac.id',
            'role' => 'User',
            'is_active' => true,
        ]);

        // Change to PIC
        $res = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$targetUser->id}/role", [
            'role' => 'PIC',
            'pic_service_code' => 'D',
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.role', 'PIC')
            ->assertJsonPath('data.pic_service_code', 'D');

        $this->assertEquals('PIC', $targetUser->fresh()->role);
        $this->assertEquals('D', $targetUser->fresh()->pic_service_code);

        // Change to Tata Usaha
        $resTu = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$targetUser->id}/role", [
            'role' => 'Tata Usaha',
        ]);
        $resTu->assertStatus(200)
            ->assertJsonPath('data.role', 'Tata Usaha');
        $this->assertEquals('Tata Usaha', $targetUser->fresh()->role);

        // Setting deleted 'Admin' role should fail with 422 validation error
        $resAdmin = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$targetUser->id}/role", [
            'role' => 'Admin',
        ]);
        $resAdmin->assertStatus(422);

        // Change back to User
        $resUser = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$targetUser->id}/role", [
            'role' => 'User',
        ]);
        $resUser->assertStatus(200);
        $this->assertEquals('User', $targetUser->fresh()->role);
        $this->assertNull($targetUser->fresh()->pic_service_code);
    }

    public function test_superadmin_cannot_demote_self(): void
    {
        $superadmin = User::create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@kampus.ac.id',
            'role' => 'SuperAdmin',
            'is_active' => true,
        ]);

        $res = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$superadmin->id}/role", [
            'role' => 'User',
        ]);

        $res->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertEquals('SuperAdmin', $superadmin->fresh()->role);
    }

    public function test_superadmin_can_toggle_user_status(): void
    {
        $superadmin = User::create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@kampus.ac.id',
            'role' => 'SuperAdmin',
            'is_active' => true,
        ]);

        $targetUser = User::create([
            'name' => 'Fajar',
            'username' => 'fajar',
            'email' => 'fajar@kampus.ac.id',
            'role' => 'User',
            'is_active' => true,
        ]);

        // Deactivate
        $res = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$targetUser->id}/toggle-status", [
            'is_active' => false,
        ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.is_active', false);
        $this->assertFalse($targetUser->fresh()->is_active);

        // Activate again
        $resActivate = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$targetUser->id}/toggle-status");
        $resActivate->assertStatus(200)
            ->assertJsonPath('data.is_active', true);
        $this->assertTrue($targetUser->fresh()->is_active);
    }

    public function test_superadmin_cannot_deactivate_self(): void
    {
        $superadmin = User::create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'superadmin@kampus.ac.id',
            'role' => 'SuperAdmin',
            'is_active' => true,
        ]);

        $res = $this->actingAs($superadmin)->patchJson("/api/v1/users/{$superadmin->id}/toggle-status", [
            'is_active' => false,
        ]);

        $res->assertStatus(422);
        $this->assertTrue($superadmin->fresh()->is_active);
    }
}
