<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Permohonan;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnBehalfOfRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic services
        Service::create([
            'code' => 'D',
            'name' => 'Layanan Desain Grafis',
            'category' => 'Desain',
            'description' => 'Desain Grafis',
            'is_active' => true,
        ]);

        Service::create([
            'code' => 'M',
            'name' => 'Layanan Multimedia & Dokumentasi',
            'category' => 'Multimedia',
            'description' => 'Multimedia & Dokumentasi',
            'is_active' => true,
        ]);

        Service::create([
            'code' => 'S',
            'name' => 'Layanan Permohonan Alat Promosi',
            'category' => 'Suvenir',
            'description' => 'Alat Promosi',
            'is_active' => true,
        ]);
    }

    public function test_user_search_endpoint_access_control(): void
    {
        $tu = User::factory()->create(['role' => 'Tata Usaha', 'is_active' => true]);
        $pic = User::factory()->create(['role' => 'PIC', 'pic_service_code' => 'M', 'is_active' => true]);
        $regularUser = User::factory()->create(['role' => 'User', 'is_active' => true]);
        $targetUser = User::factory()->create(['name' => 'Budi Dosen', 'username' => '12345678', 'role' => 'User', 'is_active' => true]);

        // Regular user should receive 403
        $this->actingAs($regularUser)
            ->getJson('/api/v1/users/search?search=Budi')
            ->assertStatus(403);

        // Tata Usaha should succeed
        $responseTu = $this->actingAs($tu)
            ->getJson('/api/v1/users/search?search=Budi')
            ->assertStatus(200);

        $responseTu->assertJsonFragment(['name' => 'Budi Dosen']);

        // PIC should succeed
        $responsePic = $this->actingAs($pic)
            ->getJson('/api/v1/users/search?search=12345678')
            ->assertStatus(200);

        $responsePic->assertJsonFragment(['username' => '12345678']);
    }

    public function test_tata_usaha_can_submit_request_on_behalf_of_another_user(): void
    {
        $tu = User::factory()->create(['name' => 'Staf TU Fakultas', 'role' => 'Tata Usaha', 'is_active' => true]);
        $targetUser = User::factory()->create(['name' => 'Dr. Ahmad Pemohon', 'role' => 'User', 'unit_kerja' => 'Fakultas Kedokteran', 'is_active' => true]);

        $payload = [
            'service_code' => 'D',
            'judul_permohonan' => 'Desain Spanduk Seminar Nasional',
            'deskripsi_kebutuhan' => 'Kebutuhan spanduk seminar nasional kedokteran',
            'tanggal_dibutuhkan' => now()->addDays(7)->format('Y-m-d'),
            'requested_for_id' => $targetUser->id,
            'form_data' => [
                'nama_pemohon' => $targetUser->name,
                'unit_pemohon' => $targetUser->unit_kerja,
                'no_whatsapp_pemohon' => '081234567890',
                'nama_kegiatan' => 'Seminar Nasional Kedokteran',
                'tanggal_kegiatan' => now()->addDays(7)->format('Y-m-d'),
                'waktu_kegiatan' => '09:00 - 12:00',
                'lokasi_kegiatan' => 'Auditorium Ar-Rahman Lt. 12',
                'deadline' => now()->addDays(5)->format('Y-m-d'),
                'jenis_desain' => ['Spanduk'],
            ],
        ];

        $response = $this->actingAs($tu)
            ->postJson('/api/v1/requests', $payload)
            ->assertStatus(201);

        $permohonanId = $response->json('data.id');
        $this->assertNotNull($permohonanId);

        $this->assertDatabaseHas('permohonans', [
            'id' => $permohonanId,
            'user_id' => $tu->id,
            'requested_for_id' => $targetUser->id,
            'judul_permohonan' => 'Desain Spanduk Seminar Nasional',
        ]);

        // Notification should be sent to the target user
        $this->assertDatabaseHas('notifications', [
            'user_id' => $targetUser->id,
            'permohonan_id' => $permohonanId,
        ]);
    }

    public function test_target_user_can_see_and_view_ticket_in_tracking(): void
    {
        $tu = User::factory()->create(['name' => 'Staf TU', 'role' => 'Tata Usaha']);
        $targetUser = User::factory()->create(['name' => 'Pemohon Asli', 'role' => 'User']);
        $otherUser = User::factory()->create(['name' => 'User Lain', 'role' => 'User']);
        $service = Service::where('code', 'D')->first();

        $permohonan = Permohonan::create([
            'nomor_tiket' => 'REQ-20261021-0001',
            'user_id' => $tu->id,
            'requested_for_id' => $targetUser->id,
            'service_id' => $service->id,
            'kategori' => $service->name,
            'judul_permohonan' => 'Permohonan untuk target user',
            'deskripsi_kebutuhan' => 'Deskripsi',
            'status' => 'Diajukan',
        ]);

        // Target user can see the ticket in tracking index
        $indexResponse = $this->actingAs($targetUser)
            ->getJson('/api/v1/requests')
            ->assertStatus(200);

        $indexResponse->assertJsonFragment(['nomor_tiket' => 'REQ-20261021-0001']);

        // Target user can view ticket details
        $this->actingAs($targetUser)
            ->getJson("/api/v1/requests/{$permohonan->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['nomor_tiket' => 'REQ-20261021-0001']);

        // Unrelated user cannot see the ticket in tracking index
        $otherIndexResponse = $this->actingAs($otherUser)
            ->getJson('/api/v1/requests')
            ->assertStatus(200);

        $otherIndexResponse->assertJsonMissing(['nomor_tiket' => 'REQ-20261021-0001']);

        // Unrelated user receives 403 on details
        $this->actingAs($otherUser)
            ->getJson("/api/v1/requests/{$permohonan->id}")
            ->assertStatus(403);
    }

    public function test_regular_user_cannot_spoof_requested_for_id(): void
    {
        $regularUser = User::factory()->create(['role' => 'User']);
        $anotherUser = User::factory()->create(['role' => 'User']);

        $payload = [
            'service_code' => 'D',
            'judul_permohonan' => 'Desain Spanduk Pribadi',
            'deskripsi_kebutuhan' => 'Kebutuhan spanduk',
            'requested_for_id' => $anotherUser->id, // Regular user attempts to set another user
            'form_data' => [
                'nama_pemohon' => $regularUser->name,
                'unit_pemohon' => 'Unit Kerja',
                'no_whatsapp_pemohon' => '081234567890',
                'nama_kegiatan' => 'Kegiatan',
                'tanggal_kegiatan' => now()->addDays(7)->format('Y-m-d'),
                'waktu_kegiatan' => '09:00',
                'lokasi_kegiatan' => 'Lokasi',
                'deadline' => now()->addDays(5)->format('Y-m-d'),
                'jenis_desain' => ['Poster'],
            ],
        ];

        $response = $this->actingAs($regularUser)
            ->postJson('/api/v1/requests', $payload)
            ->assertStatus(201);

        $permohonanId = $response->json('data.id');

        // requested_for_id should be NULL because regular User has no permission to request on behalf of others
        $this->assertDatabaseHas('permohonans', [
            'id' => $permohonanId,
            'user_id' => $regularUser->id,
            'requested_for_id' => null,
        ]);
    }
}
