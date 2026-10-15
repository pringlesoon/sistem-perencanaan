<?php

namespace Tests\Feature;

use App\Models\Permohonan;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsRoleVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $picD;
    protected User $picS;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin Test',
            'role' => 'SuperAdmin',
        ]);

        $this->picD = User::factory()->create([
            'name' => 'Ahmad PIC Desain',
            'role' => 'PIC',
            'pic_service_code' => 'D',
        ]);

        $this->picS = User::factory()->create([
            'name' => 'Bagas PIC Suvenir',
            'role' => 'PIC',
            'pic_service_code' => 'S',
        ]);

        $services = [
            ['code' => 'D', 'name' => 'Layanan Desain Grafis', 'description' => 'Desain', 'lead_time_days' => 2],
            ['code' => 'P', 'name' => 'Layanan Publikasi', 'description' => 'Publikasi', 'lead_time_days' => 2],
            ['code' => 'S', 'name' => 'Layanan Alat Promosi & Suvenir', 'description' => 'Suvenir', 'lead_time_days' => 3],
            ['code' => 'M', 'name' => 'Layanan Multimedia', 'description' => 'Multimedia', 'lead_time_days' => 2],
            ['code' => 'L', 'name' => 'Layanan Liputan', 'description' => 'Liputan', 'lead_time_days' => 2],
        ];

        foreach ($services as $srv) {
            Service::create(array_merge($srv, ['is_active' => true]));
        }
    }

    public function test_pic_can_only_see_their_own_service_in_analytics()
    {
        // 1. PIC Desain (D)
        $this->actingAs($this->picD);
        $resD = $this->getJson('/api/v1/analytics');

        $resD->assertStatus(200);
        $loadD = $resD->json('data.load_per_service');

        // Pastikan hanya 1 layanan yang dikembalikan yaitu layanan D
        $this->assertCount(1, $loadD);
        $this->assertEquals('D', $loadD[0]['code']);
        $this->assertEquals('Layanan Desain Grafis', $loadD[0]['name']);

        // 2. PIC Suvenir (S)
        $this->actingAs($this->picS);
        $resS = $this->getJson('/api/v1/analytics');

        $resS->assertStatus(200);
        $loadS = $resS->json('data.load_per_service');

        // Pastikan hanya 1 layanan yang dikembalikan yaitu layanan S
        $this->assertCount(1, $loadS);
        $this->assertEquals('S', $loadS[0]['code']);
        $this->assertEquals('Layanan Alat Promosi & Suvenir', $loadS[0]['name']);
    }

    public function test_superadmin_can_see_all_services_in_analytics()
    {
        $this->actingAs($this->superAdmin);
        $res = $this->getJson('/api/v1/analytics?service_code=ALL');

        $res->assertStatus(200);
        $load = $res->json('data.load_per_service');

        // SuperAdmin melihat seluruh 5 layanan
        $this->assertCount(5, $load);
        $codes = collect($load)->pluck('code')->all();
        $this->assertEquals(['D', 'P', 'S', 'M', 'L'], $codes);
    }
}
