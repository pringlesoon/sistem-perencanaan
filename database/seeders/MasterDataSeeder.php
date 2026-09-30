<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Permohonan;
use App\Models\RequestMultimediaDetail;
use App\Models\RequestSuvenirDetail;
use App\Models\Service;
use App\Models\ServiceConfig;
use App\Models\StatusHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed 3 Akun Persona LDAP
        $andi = User::firstOrCreate(
            ['username' => 'andi'],
            [
                'name' => 'Andi Saputra',
                'email' => 'andi@kampus.ac.id',
                'unit_kerja' => 'Biro Akademik & Kemahasiswaan',
                'role' => 'User',
                'password' => Hash::make('password'),
            ]
        );

        $sari = User::firstOrCreate(
            ['username' => 'sari'],
            [
                'name' => 'Sari Wulandari',
                'email' => 'sari.humas@kampus.ac.id',
                'unit_kerja' => 'Universitas YARSI',
                'role' => 'Admin',
                'password' => Hash::make('password'),
            ]
        );

        $budi = User::firstOrCreate(
            ['username' => 'budi'],
            [
                'name' => 'Dr. Budi Santoso, M.Kom',
                'email' => 'budi.humas@kampus.ac.id',
                'unit_kerja' => 'Universitas YARSI',
                'role' => 'Approver',
                'password' => Hash::make('password'),
            ]
        );

        $dina = User::firstOrCreate(
            ['username' => 'dina'],
            [
                'name' => 'Dina Mariana',
                'email' => 'dina.humas@kampus.ac.id',
                'unit_kerja' => 'Universitas YARSI',
                'role' => 'Verificator',
                'password' => Hash::make('password'),
            ]
        );

        // 2. Seed 5 Layanan Utama dengan Aturan Main PRD
        $services = [
            [
                'code' => 'D',
                'name' => 'Layanan Desain Grafis',
                'description' => 'Pembuatan materi visual, poster, banner seminar, sertifikat, dan media promosi.',
                'icon' => 'Palette',
                'color' => 'indigo',
                'rules_text' => "### Syarat & Ketentuan Layanan Desain
1. **Waktu Pengajuan**: Minimal diajukan **5 (lima) hari kerja** sebelum tenggat waktu penggunaan materi.
2. **Kelengkapan Materi**:
   - Draft teks/konten sudah final dan bebas *typo*.
   - Lampirkan logo resmi instansi/sponsor beresolusi tinggi (format PNG transparan atau PDF/AI).
   - Cantumkan referensi gaya visual/palet warna (jika ada).
3. **Revisi**: Maksimal **2 (dua) kali putaran revisi minor**. Revisi konsep total memerlukan persetujuan ulang.
4. **Estimasi Pengerjaan**: 3 - 5 hari kerja tergantung antrean.
5. **Kontak PIC**: Desain Kreatif — ext. 201 / humas-desain@kampus.ac.id",
            ],
            [
                'code' => 'P',
                'name' => 'Layanan Publikasi Website & Social Media',
                'description' => 'Publikasi berita di portal web resmi, rilis media massa nasional/lokal, dan media sosial.',
                'icon' => 'Megaphone',
                'color' => 'sky',
                'rules_text' => "### Syarat & Ketentuan Layanan Publikasi
1. **Waktu Pengajuan**: Minimal **2 (dua) hari kerja** sebelum tanggal tayang yang ditargetkan.
2. **Kelengkapan Dokumen**:
   - Draft naskah rilis pers (minimal 300 kata, kaidah 5W+1H).
   - Foto pendukung kegiatan minimal 2 lembar (resolusi tinggi, landscape, pencahayaan baik).
3. **Hak Redaksional**: Tim Humas berhak menyunting naskah tanpa mengubah substansi informasi.
4. **Kanal Publikasi**: Portal Website Utama, Instagram Official, Press Release ke Media Partner.
5. **Kontak PIC**: Redaksi Media — ext. 203 / humas-media@kampus.ac.id",
            ],
            [
                'code' => 'S',
                'name' => 'Layanan Permohonan Alat Promosi',
                'description' => 'Pengajuan paket merchandise, goodie bag, plakat, dan souvenir kit untuk tamu/acara.',
                'icon' => 'Gift',
                'color' => 'amber',
                'rules_text' => "### Syarat & Ketentuan Layanan Suvenir
1. **Ketentuan Kuota & Auto-Approval**:
   - Permintaan s.d. **20 unit** akan **langsung disetujui otomatis** oleh sistem.
   - Permintaan **di atas 20 unit** wajib menunggu verifikasi dan persetujuan **Kepala Divisi (Approver)**.
2. **Waktu Pengambilan**: Minimal diajukan **3 (tiga) hari kerja** sebelum acara/kegiatan.
3. **Dokumen Pendukung**: Wajib melampirkan Surat Undangan / Proposal / Rundown Acara yang mencantumkan estimasi jumlah tamu VIP/peserta.
4. **Pengambilan Barang**: Mengambil langsung di Ruang Inventaris Humas Gedung Rektorat Lt. 2 pada jam kerja (09.00 - 16.00 WIB).
5. **Kontak PIC**: Logistik Suvenir — ext. 205 / humas-logistik@kampus.ac.id",
            ],
            [
                'code' => 'M',
                'name' => 'Layanan Multimedia, Dokumentasi, & Live Streaming',
                'description' => 'Peminjaman studio podcast, kamera video, lighting, microphone nirkabel, dan proyektor.',
                'icon' => 'Video',
                'color' => 'emerald',
                'rules_text' => "### Syarat & Ketentuan Layanan Multimedia
1. **Sistem Penjadwalan & Bebas Bentrok (Conflict-Free)**:
   - Sistem menggunakan validasi *real-time*. Jam yang telah dipesan orang lain tidak dapat dipesan kembali.
2. **Batas Durasi Maksimal**:
   - Maksimal peminjaman adalah **3 jam (180 menit)** per permohonan untuk mencegah monopoli alat/ruangan.
3. **Tanggung Jawab Pemohon**:
   - Pemohon wajib hadir 15 menit sebelum sesi dimulai untuk pengecekan kondisi peralatan.
   - Segala bentuk kerusakan akibat kelalaian operasional menjadi tanggung jawab unit pemohon.
4. **Larangan**: Dilarang membawa makanan/minuman beralkohol atau basah ke dalam area Studio Podcast.
5. **Kontak PIC**: Teknisi Multimedia — ext. 208 / multimedia@kampus.ac.id",
            ],
            [
                'code' => 'L',
                'name' => 'Layanan Liputan & Berita',
                'description' => 'Penugasan tim fotografer dan videografer profesional untuk meliput kegiatan/event kampus.',
                'icon' => 'Camera',
                'color' => 'rose',
                'rules_text' => "### Syarat & Ketentuan Layanan Liputan
1. **Waktu Pengajuan**: Minimal **4 (empat) hari kerja** sebelum hari pelaksanaan kegiatan.
2. **Kriteria Acara yang Diliput**:
   - Acara berskala institusi, seminar internasional/nasional, wisuda, atau kunjungan tokoh penting.
3. **Dokumen Wajib**: Melampirkan Rundown Acara rinci lengkap dengan kontak panitia (PIC lapangan).
4. **Hasil Dokumentasi**: File foto dan video pilihan akan diserahkan melalui Google Drive/Cloud maksimal **3 hari kerja** pasca-acara.
5. **Kontak PIC**: Koordinator Dokumentasi — ext. 209 / liputan@kampus.ac.id",
            ],
        ];

        $serviceModels = [];
        foreach ($services as $data) {
            $service = Service::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
            $serviceModels[$data['code']] = $service;
        }

        // 3. Seed Config Bisnis (PRD FR-SV-02 & FR-MM-04)
        ServiceConfig::updateOrCreate(
            ['service_id' => $serviceModels['S']->id, 'config_key' => 'auto_approval_limit'],
            [
                'config_value' => '20',
                'description' => 'Batas maksimal kuota suvenir yang disetujui otomatis tanpa approver (unit)',
            ]
        );

        ServiceConfig::updateOrCreate(
            ['service_id' => $serviceModels['M']->id, 'config_key' => 'max_duration_minutes'],
            [
                'config_value' => '180',
                'description' => 'Batas maksimal durasi peminjaman multimedia/studio per permohonan (menit)',
            ]
        );

    }
}

