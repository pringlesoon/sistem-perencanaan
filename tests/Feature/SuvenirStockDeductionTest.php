<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\InventoryLog;
use App\Models\Permohonan;
use App\Models\RequestSuvenirDetail;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuvenirStockDeductionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $pic;
    protected User $admin;
    protected Service $serviceS;
    protected InventoryItem $item;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Pemohon TU Test',
            'role' => 'Tata Usaha',
            'unit_kerja' => 'Tata Usaha Fakultas Kedokteran',
        ]);

        $this->pic = User::factory()->create([
            'name' => 'Bagas PIC',
            'username' => 'bagas',
            'role' => 'PIC',
            'pic_service_code' => 'S',
            'unit_kerja' => 'Humas & Marketing',
        ]);

        $this->admin = User::factory()->create([
            'name' => 'SuperAdmin Sari',
            'username' => 'sari',
            'role' => 'SuperAdmin',
            'unit_kerja' => 'Humas & Marketing',
        ]);

        $this->serviceS = Service::create([
            'code' => 'S',
            'name' => 'Layanan Permohonan Alat Promosi',
            'description' => 'Layanan Permohonan Alat Promosi dan Suvenir Kampus',
            'lead_time_days' => 3,
            'is_active' => true,
        ]);

        $this->item = InventoryItem::create([
            'nama_item' => 'Goodiebag',
            'stok_tersedia' => 100,
            'satuan' => 'pcs',
            'kategori' => 'suvenir',
            'kondisi' => 'Bagus/Oke',
        ]);
    }

    public function test_stock_does_not_deduct_when_diajukan_menunggu_approval_or_diproses()
    {
        // 1. Submit Permohonan (Diajukan)
        $this->actingAs($this->user);
        $res = $this->postJson('/api/v1/requests', [
            'service_code' => 'S',
            'judul_permohonan' => 'Permohonan Goodiebag Acara',
            'deskripsi_kebutuhan' => 'Kebutuhan suvenir',
            'form_data' => [
                'nama_kegiatan' => 'Seminar Kedokteran',
                'tanggal_kegiatan' => '2026-11-01',
                'waktu_kegiatan' => '09:00',
                'lokasi_kegiatan' => 'Auditorium',
                'tanggal_dibutuhkan' => '2026-10-30',
                'souvenir_items' => [
                    ['nama_item' => 'Goodiebag', 'qty' => 15, 'qty_disetujui' => 15]
                ]
            ]
        ]);

        $res->assertStatus(201);
        $reqId = $res->json('data.id');

        // Pastikan stok MASIH 100 saat status Diajukan
        $this->item->refresh();
        $this->assertEquals(100, $this->item->stok_tersedia);
        $this->assertEquals(0, InventoryLog::where('permohonan_id', $reqId)->count());

        // 2. PIC Konfirmasi Kuota (Menunggu Approval)
        $this->actingAs($this->pic);
        $resConfirm = $this->postJson("/api/v1/requests/{$reqId}/confirm-quota-pic", [
            'items' => [
                ['nama_item' => 'Goodiebag', 'qty_disetujui' => 10]
            ],
            'catatan' => 'Disesuaikan jadi 10 pcs',
        ]);
        $resConfirm->assertStatus(200);

        // Pastikan stok MASIH 100 saat status Menunggu Approval
        $this->item->refresh();
        $this->assertEquals(100, $this->item->stok_tersedia);
        $this->assertEquals(0, InventoryLog::where('permohonan_id', $reqId)->count());

        // 3. Admin Approve (Status menjadi Diproses)
        $this->actingAs($this->admin);
        $resApprove = $this->postJson("/api/v1/requests/{$reqId}/approve", [
            'decision' => 'approve',
            'catatan' => 'Disetujui 10 pcs',
        ]);
        $resApprove->assertStatus(200);

        // Pastikan stok MASIH 100 saat status Diproses (TIDAK BOLEH BERKURANG)
        $this->item->refresh();
        $this->assertEquals(100, $this->item->stok_tersedia);
        $this->assertEquals(0, InventoryLog::where('permohonan_id', $reqId)->count());

        // 4. Ubah status menjadi Selesai -> Stok HANYA BERKURANG DI SINI!
        $this->actingAs($this->pic);
        $resComplete = $this->postJson("/api/v1/requests/{$reqId}/status", [
            'status' => 'Selesai',
            'catatan' => 'Suvenir telah diserahkan ke pemohon.',
        ]);
        $resComplete->assertStatus(200);

        // Stok sekarang harus berkurang 10 (100 - 10 = 90)
        $this->item->refresh();
        $this->assertEquals(90, $this->item->stok_tersedia);

        // Log keluar tercatat
        $this->assertDatabaseHas('inventory_logs', [
            'inventory_item_id' => $this->item->id,
            'tipe' => 'Keluar',
            'jumlah' => 10,
            'permohonan_id' => $reqId,
        ]);
    }

    public function test_stock_does_not_deduct_when_rejected()
    {
        $this->actingAs($this->user);
        $res = $this->postJson('/api/v1/requests', [
            'service_code' => 'S',
            'judul_permohonan' => 'Permohonan Goodiebag Ditolak',
            'deskripsi_kebutuhan' => 'Kebutuhan suvenir',
            'form_data' => [
                'nama_kegiatan' => 'Seminar Kedokteran',
                'tanggal_kegiatan' => '2026-11-01',
                'waktu_kegiatan' => '09:00',
                'lokasi_kegiatan' => 'Auditorium',
                'tanggal_dibutuhkan' => '2026-10-30',
                'souvenir_items' => [
                    ['nama_item' => 'Goodiebag', 'qty' => 15, 'qty_disetujui' => 15]
                ]
            ]
        ]);
        $reqId = $res->json('data.id');

        // Admin langsung tolak
        $this->actingAs($this->admin);
        $resApprove = $this->postJson("/api/v1/requests/{$reqId}/approve", [
            'decision' => 'reject',
            'catatan' => 'Alokasi kuota tidak mencukupi.',
        ]);
        $resApprove->assertStatus(200);

        // Pastikan stok tetap 100
        $this->item->refresh();
        $this->assertEquals(100, $this->item->stok_tersedia);
        $this->assertEquals(0, InventoryLog::where('permohonan_id', $reqId)->count());
    }

    public function test_stock_is_restored_if_status_reverted_from_selesai()
    {
        $this->actingAs($this->user);
        $res = $this->postJson('/api/v1/requests', [
            'service_code' => 'S',
            'judul_permohonan' => 'Permohonan Goodiebag Revert',
            'deskripsi_kebutuhan' => 'Kebutuhan suvenir',
            'form_data' => [
                'nama_kegiatan' => 'Seminar Kedokteran',
                'tanggal_kegiatan' => '2026-11-01',
                'waktu_kegiatan' => '09:00',
                'lokasi_kegiatan' => 'Auditorium',
                'tanggal_dibutuhkan' => '2026-10-30',
                'souvenir_items' => [
                    ['nama_item' => 'Goodiebag', 'qty' => 20, 'qty_disetujui' => 20]
                ]
            ]
        ]);
        $reqId = $res->json('data.id');

        // Ubah langsung ke Selesai
        $this->actingAs($this->admin);
        $resComplete = $this->postJson("/api/v1/requests/{$reqId}/status", [
            'status' => 'Selesai',
            'catatan' => 'Selesai',
        ]);
        $resComplete->assertStatus(200);

        $this->item->refresh();
        $this->assertEquals(80, $this->item->stok_tersedia);

        // Revert ke Diproses
        $resRevert = $this->postJson("/api/v1/requests/{$reqId}/status", [
            'status' => 'Diproses',
            'catatan' => 'Dibatalkan dari selesai ke diproses',
        ]);
        $resRevert->assertStatus(200);

        // Stok kembali menjadi 100
        $this->item->refresh();
        $this->assertEquals(100, $this->item->stok_tersedia);
    }
}
