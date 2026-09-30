<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\ServiceConfig;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Akun Persona: Andi (User pemohon)
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

        // 2. Super Admin
        $superadmin = User::firstOrCreate(
            ['username' => 'superadmin'],
            [
                'name' => 'Rini Andriani',
                'email' => 'rini.admin@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'SuperAdmin',
                'password' => Hash::make('password'),
            ]
        );

        // 3. Seed 5 PIC Users (role default = User, akan diubah oleh SuperAdmin)
        $pic_users = [
            [
                'username' => 'ahmad',
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'D',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'nurhaliza',
                'name' => 'Nurhaliza Putri',
                'email' => 'nurhaliza.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'P',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'bagas',
                'name' => 'Bagas Wicaksono',
                'email' => 'bagas.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'S',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'dewi',
                'name' => 'Dewi Rahayu',
                'email' => 'dewi.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'M',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'rizky',
                'name' => 'Rizky Pratama',
                'email' => 'rizky.pic@kampus.ac.id',
                'unit_kerja' => 'Divisi Marketing YARSI',
                'role' => 'PIC',
                'pic_service_code' => 'L',
                'password' => Hash::make('password'),
            ],
        ];

        foreach ($pic_users as $picData) {
            User::firstOrCreate(
                ['username' => $picData['username']],
                $picData
            );
        }

        // 4. Seed 5 User biasa tambahan (bisa diubah menjadi PIC oleh SuperAdmin)
        $additional_users = [
            [
                'username' => 'fajar',
                'name' => 'Fajar Setiawan',
                'email' => 'fajar@kampus.ac.id',
                'unit_kerja' => 'Fakultas Kedokteran',
                'role' => 'User',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'maya',
                'name' => 'Maya Anggraini',
                'email' => 'maya@kampus.ac.id',
                'unit_kerja' => 'Fakultas Teknologi Informasi',
                'role' => 'User',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'hendra',
                'name' => 'Hendra Kurniawan',
                'email' => 'hendra@kampus.ac.id',
                'unit_kerja' => 'Fakultas Hukum',
                'role' => 'User',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'sinta',
                'name' => 'Sinta Permata',
                'email' => 'sinta@kampus.ac.id',
                'unit_kerja' => 'Fakultas Ekonomi & Bisnis',
                'role' => 'User',
                'password' => Hash::make('password'),
            ],
            [
                'username' => 'yusuf',
                'name' => 'Yusuf Ramadhan',
                'email' => 'yusuf@kampus.ac.id',
                'unit_kerja' => 'Biro Keuangan & SDM',
                'role' => 'User',
                'password' => Hash::make('password'),
            ],
        ];

        foreach ($additional_users as $userData) {
            User::firstOrCreate(
                ['username' => $userData['username']],
                $userData
            );
        }

        // 5. Seed 5 Layanan Utama dengan Syarat & Ketentuan Resmi
        $services = [
            [
                'code' => 'D',
                'name' => 'Layanan Desain Grafis',
                'description' => 'Brosur, poster cetak, banner/spanduk, flyer digital, sertifikat, Instagram post, dan infografis.',
                'icon' => 'Palette',
                'color' => 'indigo',
                'rules_text' => "### Syarat dan Ketentuan Layanan Desain
1. **Waktu Pengajuan**: Minimal diajukan **5 (Lima) Hari Kerja** sebelum desain digunakan.
2. **Formulir Website**: Wajib mengisi Form Permintaan melalui Website secara lengkap dan benar.
3. **Kelengkapan Materi Desain**:
   a. **Informasi desain harus sudah lengkap**, meliputi:
      - Judul / Tema kegiatan
      - Informasi yang wajib dicantumkan
      - Ukuran desain
      - Media penggunaan desain
      - Deadline penggunaan
   b. **Materi pendukung wajib disertakan** berupa:
      - Logo / unit terkait
      - Foto atau bahan visual pendukung (jika diperlukan)
      - Referensi desain (apabila tersedia)
4. **Ketentuan Desain**:
   - Desain yang diajukan harus berkaitan dengan kegiatan resmi institusi/unit kerja.
   - Permintaan perubahan konsep besar setelah desain selesai dapat menyebabkan penyesuaian waktu pengerjaan.
   - Pemohon wajib melakukan pengecekan kembali terhadap seluruh informasi pada desain sebelum digunakan.
5. **Ketentuan Revisi**:
   - Revisi desain diberikan berdasarkan materi awal yang telah disampaikan. Perubahan informasi utama setelah proses desain berjalan menjadi tanggung jawab pemohon.
6. **Permohonan Mendadak**:
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.",
            ],
            [
                'code' => 'P',
                'name' => 'Layanan Publikasi Website & Social Media',
                'description' => 'Publikasi Feed/Reels IG, Story IG @universitasyarsi, dan website yarsi.ac.id.',
                'icon' => 'Megaphone',
                'color' => 'sky',
                'rules_text' => "### Syarat dan Ketentuan Layanan Publikasi
1. **Waktu Pengajuan**: Minimal diajukan **2 (Dua) Hari Kerja** sebelum tanggal publikasi.
2. **Formulir Website**: Wajib mengisi Form Permintaan melalui Website secara lengkap dan benar.
3. **Kelengkapan Materi Publikasi**:
   - Konten visual sudah sesuai dengan standar/template Universitas. Apabila belum tersedia, silakan ajukan permohonan desain terlebih dahulu.
   - Caption dan informasi publikasi sudah final serta bebas dari kesalahan penulisan (typo).
   - Lampiran foto/video wajib memiliki kualitas baik (resolusi tinggi) dan diunggah dalam format: PDF, PNG/JPG, Link Drive, atau Video.
   - Apabila publikasi terkait kegiatan, wajib mencantumkan:
     * Nama kegiatan
     * Waktu pelaksanaan
     * Nama dan kontak PIC kegiatan di konten atau caption
4. **Media Publikasi yang Tersedia**:
   - Feed/Reels Instagram @universitasyarsi
   - Story Instagram @universitasyarsi
   - Website yarsi.ac.id / Media Sosial
   - Setelah konten dipublikasikan, pemohon wajib melakukan pengecekan kembali untuk memastikan informasi telah sesuai.
5. **Permohonan Mendadak**:
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.",
            ],
            [
                'code' => 'S',
                'name' => 'Layanan Permohonan Alat Promosi',
                'description' => 'Penyediaan souvenir, brosur S1/S2, goodie bag, stiker, notebook, pulpen, kipas, kalender untuk kebutuhan eksternal.',
                'icon' => 'Gift',
                'color' => 'amber',
                'rules_text' => "### Syarat dan Ketentuan Permohonan Alat Promosi
1. **Kriteria Pengajuan**:
   - Kegiatan resmi yang memiliki kepentingan institusional.
   - Mendukung kegiatan promosi kampus, branding, dan hubungan kelembagaan.
   - **Pengajuan alat promosi ditujukan untuk kebutuhan eksternal (bukan bagian dari kegiatan internal Universitas).**
2. **Waktu Pengajuan**: Minimal diajukan **5 (Lima) Hari Kerja** sebelum alat promosi dibutuhkan.
3. **Surat Permohonan**: Wajib melampirkan **surat permohonan alat promosi dari pimpinan unit kerja**.
4. **Formulir Website**: Wajib mengisi Form Permintaan melalui Website secara lengkap dan benar.
5. **Kelengkapan Pengajuan**: Wajib mencantumkan Nama kegiatan/program, Jenis alat promosi, Jumlah kebutuhan, dan Tanggal kebutuhan.
6. **Pengecualian**: **Jenis alat promosi yang dimaksud tidak termasuk plakat.**
7. **Ketentuan Pemberian Alat Promosi**:
   - Pemberian alat promosi bergantung pada stok yang tersedia.
   - Verifikator/PIC berhak menyesuaikan jenis dan jumlah alat promosi berdasarkan kebutuhan serta ketersediaan (persetujuan sebagian).
   - Form serah terima alat promosi wajib ditandatangani oleh unit pemohon.
8. **Permohonan Mendadak**:
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.",
            ],
            [
                'code' => 'M',
                'name' => 'Layanan Multimedia & Dokumentasi',
                'description' => 'Foto dokumentasi, operator podcast, video promosi, editing video, live streaming, dan video dokumentasi.',
                'icon' => 'Video',
                'color' => 'emerald',
                'rules_text' => "### Syarat dan Ketentuan Layanan Multimedia
1. **Waktu Pengajuan**: Minimal diajukan **5 (Lima) Hari Kerja** sebelum kegiatan atau produksi dilakukan.
2. **Surat Permohonan**: Wajib melampirkan **surat permohonan multimedia dari pimpinan unit kerja**.
3. **Formulir Website**: Wajib mengisi Form Permintaan melalui Website secara lengkap dan benar.
4. **Kelengkapan Informasi Produksi**:
   - Nama kegiatan/program
   - Tanggal, waktu, dan lokasi kegiatan
   - Konsep / kebutuhan konten
   - Tanggal, lokasi, dan durasi produksi
   - Narasumber / talent (jika ada)
   - Output yang diharapkan
5. **Jenis Layanan Multimedia Meliputi**:
   - Foto dokumentasi
   - Operator podcast
   - Video promosi
   - Editing video
   - Live streaming
   - Video dokumentasi
6. **Ketentuan Produksi**:
   - Jadwal produksi wajib disepakati sebelum pelaksanaan.
   - Perubahan konsep setelah produksi berlangsung dapat menyebabkan penyesuaian waktu penyelesaian.
   - Pemohon bertanggung jawab memastikan kesiapan lokasi, narasumber, dan kebutuhan pendukung.
7. **Permohonan Mendadak**:
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.",
            ],
            [
                'code' => 'L',
                'name' => 'Layanan Peliputan Berita',
                'description' => 'Wawancara dan penulisan berita kegiatan resmi universitas untuk publikasi institusi.',
                'icon' => 'Camera',
                'color' => 'rose',
                'rules_text' => "### Syarat dan Ketentuan Layanan Peliputan
1. **Waktu Pengajuan**: Minimal diajukan **3 (Tiga) Hari Kerja** sebelum kegiatan berlangsung.
2. **Formulir Website**: Wajib mengisi Form Permintaan melalui Website secara lengkap dan benar.
3. **Kriteria Kegiatan yang Dapat Diliput**:
   - Kegiatan resmi universitas / unit kerja.
   - Memiliki nilai informasi dan relevansi untuk publikasi institusi.
   - Mendukung citra, reputasi, dan komunikasi universitas.
4. **Kelengkapan Informasi**:
   - Nama kegiatan
   - Rundown acara
   - Waktu peliputan
   - Pimpinan / tamu / narasumber yang hadir
5. **Jenis Layanan Peliputan**:
   - Wawancara
   - Penulisan berita
6. **Ketentuan Persetujuan & Publikasi**:
   - Humas berhak menentukan bentuk, sudut pemberitaan, dan jadwal publikasi sesuai standar komunikasi institusi.
   - Verifikator berhak untuk menolak permohonan peliputan apabila kegiatan yang diajukan tidak sesuai dengan kriteria kegiatan (poin 3).
7. **Permohonan Mendadak**:
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.",
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

        // 6. Seed Config Bisnis
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

        // 7. Seed Inventaris Suvenir & Multimedia Resmi sesuai Dokumen Humas
        $inventoryItems = [
            // Suvenir resmi sesuai Form Permintaan Alat Promosi Humas (tidak termasuk plakat)
            ['nama_item' => 'Brosur S1', 'stok_tersedia' => 500, 'satuan' => 'lembar', 'deskripsi' => 'Brosur promosi program sarjana S1 Universitas YARSI', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Brosur S2', 'stok_tersedia' => 300, 'satuan' => 'lembar', 'deskripsi' => 'Brosur promosi program pascasarjana S2 Universitas YARSI', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Goodiebag', 'stok_tersedia' => 250, 'satuan' => 'pcs', 'deskripsi' => 'Tas spunbond/kanvas resmi YARSI untuk suvenir tamu eksternal', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Stiker YARSI', 'stok_tersedia' => 600, 'satuan' => 'pcs', 'deskripsi' => 'Stiker vinyl logo Universitas YARSI tahan air', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Notebook', 'stok_tersedia' => 120, 'satuan' => 'pcs', 'deskripsi' => 'Buku catatan bersampul eksklusif Universitas YARSI', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Pulpen', 'stok_tersedia' => 350, 'satuan' => 'pcs', 'deskripsi' => 'Pulpen promosi berlogo Universitas YARSI', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Kipas', 'stok_tersedia' => 200, 'satuan' => 'pcs', 'deskripsi' => 'Kipas promosi plastik berdesain YARSI', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Gantungan Kunci', 'stok_tersedia' => 250, 'satuan' => 'pcs', 'deskripsi' => 'Gantungan kunci akrilik/karet logo YARSI', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Kalender', 'stok_tersedia' => 100, 'satuan' => 'eksemplar', 'deskripsi' => 'Kalender meja tahunan resmi Universitas YARSI', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Majalah KABAR', 'stok_tersedia' => 80, 'satuan' => 'eksemplar', 'deskripsi' => 'Majalah berkala KABAR YARSI edisi terkini', 'kategori' => 'suvenir', 'kondisi' => 'Bagus/Oke'],

            // Multimedia
            ['nama_item' => 'Studio Podcast 1 (Lantai 2)', 'stok_tersedia' => 1, 'satuan' => 'ruangan', 'deskripsi' => 'Studio rekaman podcast kedap suara kapasitas 4 narasumber', 'kategori' => 'multimedia', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Studio Podcast 2 (Lantai 3)', 'stok_tersedia' => 1, 'satuan' => 'ruangan', 'deskripsi' => 'Studio rekaman mini podcast & live webinar', 'kategori' => 'multimedia', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Paket Kamera Video Sony Cinema & Wireless Mic', 'stok_tersedia' => 2, 'satuan' => 'paket', 'deskripsi' => '1 unit kamera Sony FX3, 2 mic clip on nirkabel, tripod, dan charger baterai', 'kategori' => 'multimedia', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Set Lighting Studio & Green Screen', 'stok_tersedia' => 3, 'satuan' => 'set', 'deskripsi' => '3 unit Godox LED light panel, softbox, stand, dan kain green screen', 'kategori' => 'multimedia', 'kondisi' => 'Sedang Diperbaiki'],
            ['nama_item' => 'Proyektor 5000 Lumens & Portable Screen', 'stok_tersedia' => 2, 'satuan' => 'unit', 'deskripsi' => 'Proyektor resolusi Full HD dengan input HDMI/VGA dan layar lipat 100 inch', 'kategori' => 'multimedia', 'kondisi' => 'Bagus/Oke'],
            ['nama_item' => 'Microphone Wireless Handheld Shure SLXD', 'stok_tersedia' => 4, 'satuan' => 'unit', 'deskripsi' => 'Mic genggam tanpa kabel untuk MC / Pembicara', 'kategori' => 'multimedia', 'kondisi' => 'Rusak'],
            ['nama_item' => 'Kabel HDMI Fiber Optic 30 Meter', 'stok_tersedia' => 1, 'satuan' => 'buah', 'deskripsi' => 'Kabel transmisi sinyal video resolusi tinggi', 'kategori' => 'multimedia', 'kondisi' => 'Hilang'],
        ];

        foreach ($inventoryItems as $item) {
            \App\Models\InventoryItem::updateOrCreate(
                ['nama_item' => $item['nama_item']],
                $item
            );
        }
    }
}
