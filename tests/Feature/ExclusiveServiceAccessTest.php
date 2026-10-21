<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExclusiveServiceAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Service::create([
            'code' => 'D',
            'name' => 'Layanan Desain Grafis',
            'description' => 'Desain brosur',
            'rules_text' => 'Rules Desain',
        ]);

        Service::create([
            'code' => 'S',
            'name' => 'Layanan Permohonan Alat Promosi',
            'description' => 'Souvenir dan brosur',
            'rules_text' => 'Rules Suvenir',
        ]);

        Service::create([
            'code' => 'M',
            'name' => 'Layanan Multimedia',
            'description' => 'Video dan foto',
            'rules_text' => 'Rules Multimedia',
        ]);
    }

    public function test_user_role_is_forbidden_from_submitting_alat_promosi_or_multimedia(): void
    {
        $user = User::create([
            'name' => 'Andi Pemohon',
            'username' => 'andi',
            'email' => 'andi@kampus.ac.id',
            'role' => 'User',
            'is_active' => true,
        ]);

        // Coba submit Alat Promosi (S)
        $resS = $this->actingAs($user)->postJson('/api/v1/requests', [
            'service_code' => 'S',
            'judul_permohonan' => 'Permintaan Brosur & Goodiebag',
            'deskripsi_kebutuhan' => 'Kebutuhan acara',
        ]);

        $resS->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Mohon maaf, pengajuan layanan ini tidak dapat dilakukan secara langsung oleh akun Anda. Silakan hubungi PIC Layanan atau bagian Tata Usaha (TU) di fakultas Anda masing-masing untuk bantuan pengajuan.',
            ]);

        // Coba submit Multimedia (M)
        $resM = $this->actingAs($user)->postJson('/api/v1/requests', [
            'service_code' => 'M',
            'judul_permohonan' => 'Liputan Video Podcast',
            'deskripsi_kebutuhan' => 'Kebutuhan podcast',
        ]);

        $resM->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'Mohon maaf, pengajuan layanan ini tidak dapat dilakukan secara langsung oleh akun Anda. Silakan hubungi PIC Layanan atau bagian Tata Usaha (TU) di fakultas Anda masing-masing untuk bantuan pengajuan.',
            ]);
    }

    public function test_user_role_can_submit_regular_service_such_as_desain(): void
    {
        $user = User::create([
            'name' => 'Andi Pemohon',
            'username' => 'andi',
            'email' => 'andi@kampus.ac.id',
            'role' => 'User',
            'is_active' => true,
        ]);

        // Submit Desain (D) - Harus diizinkan (bukan 403)
        $resD = $this->actingAs($user)->postJson('/api/v1/requests', [
            'service_code' => 'D',
            'judul_permohonan' => 'Desain Spanduk Webinar',
            'deskripsi_kebutuhan' => 'Spanduk ukuran 3x1 m',
            'tanggal_dibutuhkan' => now()->addDays(7)->toDateString(),
            'form_data' => [
                'nama_pemohon' => 'Andi',
                'unit_pemohon' => 'FTI',
                'no_whatsapp_pemohon' => '081234567890',
                'tanggal_kegiatan' => now()->addDays(7)->toDateString(),
                'waktu_kegiatan' => '09:00',
                'lokasi_kegiatan' => 'Auditorium Lt. 3',
                'deadline' => now()->addDays(5)->toDateString(),
            ],
        ]);

        // Tidak boleh 403 Forbidden
        $this->assertNotEquals(403, $resD->status());
        $this->assertTrue(in_array($resD->status(), [200, 201]));
    }

    public function test_superadmin_can_submit_alat_promosi_without_403_forbidden(): void
    {
        $admin = User::create([
            'name' => 'Rini Admin',
            'username' => 'rini',
            'email' => 'rini@kampus.ac.id',
            'role' => 'SuperAdmin',
            'is_active' => true,
        ]);

        $resS = $this->actingAs($admin)->postJson('/api/v1/requests', [
            'service_code' => 'S',
            'judul_permohonan' => 'Permintaan Brosur & Goodiebag',
            'deskripsi_kebutuhan' => 'Kebutuhan acara pameran',
            'tanggal_dibutuhkan' => now()->addDays(5)->toDateString(),
        ]);

        // Tidak boleh 403 Forbidden
        $this->assertNotEquals(403, $resS->status());
    }

    public function test_tata_usaha_can_submit_exclusive_services_without_403_forbidden(): void
    {
        $tu = User::create([
            'name' => 'Sari Indah TU',
            'username' => 'sari',
            'email' => 'sari@kampus.ac.id',
            'role' => 'Tata Usaha',
            'is_active' => true,
        ]);

        // Submit S (Alat Promosi)
        $resS = $this->actingAs($tu)->postJson('/api/v1/requests', [
            'service_code' => 'S',
            'judul_permohonan' => 'Permintaan Brosur & Goodiebag TU',
            'deskripsi_kebutuhan' => 'Kebutuhan acara wisuda',
            'tanggal_dibutuhkan' => now()->addDays(5)->toDateString(),
        ]);
        $this->assertNotEquals(403, $resS->status());

        // Submit M (Multimedia)
        $resM = $this->actingAs($tu)->postJson('/api/v1/requests', [
            'service_code' => 'M',
            'judul_permohonan' => 'Peminjaman Studio Podcast TU',
            'deskripsi_kebutuhan' => 'Kebutuhan podcast fakultas',
            'tanggal_dibutuhkan' => now()->addDays(5)->toDateString(),
        ]);
        $this->assertNotEquals(403, $resM->status());
    }
}
