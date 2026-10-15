<?php

namespace Tests\Feature;

use App\Models\Permohonan;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PeliputanWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $picPeliputan;
    protected Service $servicePeliputan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Pemohon Peliputan',
            'username' => 'pemohon_peliputan',
            'email' => 'pemohon@kampus.ac.id',
            'password' => Hash::make('password'),
            'role' => 'User',
            'unit_kerja' => 'Biro Kemahasiswaan',
        ]);

        $this->picPeliputan = User::create([
            'name' => 'PIC Liputan',
            'username' => 'pic_liputan',
            'email' => 'pic.liputan@kampus.ac.id',
            'password' => Hash::make('password'),
            'role' => 'PIC',
            'pic_service_code' => 'L',
            'unit_kerja' => 'Divisi Marketing & Humas',
        ]);

        $this->servicePeliputan = Service::create([
            'code' => 'L',
            'name' => 'Layanan Peliputan Berita',
            'description' => 'Layanan liputan kegiatan dan penulisan berita.',
            'color' => 'rose',
        ]);
    }

    public function test_can_submit_peliputan_with_meliput_kegiatan(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/v1/requests', [
            'service_code' => 'L',
            'service_id' => $this->servicePeliputan->id,
            'kategori' => 'Layanan Peliputan Berita',
            'judul_permohonan' => 'Peliputan: Seminar Nasional AI',
            'deskripsi_kebutuhan' => 'Meliput kegiatan seminar',
            'tanggal_dibutuhkan' => now()->addDays(5)->format('Y-m-d'),
            'form_data' => [
                'nama_kegiatan' => 'Seminar Nasional AI 2026',
                'jenis_peliputan' => ['Meliput Kegiatan', 'Wawancara'],
                'tanggal_peliputan' => now()->addDays(5)->format('Y-m-d'),
                'waktu_peliputan' => '09:00',
                'lokasi_kegiatan' => 'Auditorium Utama',
                'rundown_acara' => 'Pembukaan, materi, tanya jawab',
            ],
        ]);

        $response->assertStatus(201);
        $permohonanId = $response->json('data.id');

        $this->assertDatabaseHas('permohonans', [
            'id' => $permohonanId,
            'status' => 'Diajukan',
        ]);

        $permohonan = Permohonan::find($permohonanId);
        $this->assertContains('Meliput Kegiatan', $permohonan->form_data['jenis_peliputan']);
    }

    public function test_can_update_status_to_terjadwalkan_produksi_berita_and_reflects_in_analytics(): void
    {
        $permohonan = Permohonan::create([
            'nomor_tiket' => 'LP-20261014-001',
            'user_id' => $this->user->id,
            'service_id' => $this->servicePeliputan->id,
            'kategori' => 'Layanan Peliputan Berita',
            'judul_permohonan' => 'Peliputan: Wisuda Sarjana',
            'deskripsi_kebutuhan' => 'Liputan wisuda',
            'status' => 'Diajukan',
            'form_data' => [
                'nama_kegiatan' => 'Wisuda Sarjana 2026',
                'jenis_peliputan' => ['Meliput Kegiatan'],
                'tanggal_peliputan' => now()->addDays(4)->format('Y-m-d'),
                'waktu_peliputan' => '08:00',
                'lokasi_kegiatan' => 'Balairung',
            ],
        ]);

        // PIC update status to 'Terjadwalkan/Produksi Berita'
        $updateRes = $this->actingAs($this->picPeliputan)->postJson("/api/v1/requests/{$permohonan->id}/status", [
            'status' => 'Terjadwalkan/Produksi Berita',
            'catatan' => 'Tim peliputan telah dijadwalkan hadir.',
        ]);

        $updateRes->assertStatus(200);

        $permohonan->refresh();
        $this->assertEquals('Terjadwalkan/Produksi Berita', $permohonan->status);

        // Check Analytics reflects this as active request
        $analyticsRes = $this->actingAs($this->picPeliputan)->getJson('/api/v1/analytics');
        $analyticsRes->assertStatus(200);

        $this->assertEquals(1, $analyticsRes->json('data.kpis.active_requests'));
        $this->assertEquals(1, $analyticsRes->json('data.load_per_service.0.aktif'));
        $this->assertEquals(1, $analyticsRes->json('data.status_breakdown.Terjadwalkan/Produksi Berita.count'));
    }
}
