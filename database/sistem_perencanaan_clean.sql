-- ============================================================
-- SISTEM LAYANAN MARKETING (SLM) & PERMOHONAN TERPUSAT (SAPT)
-- Database Dump: Clean Master Data (Siap Hosting & LDAP Kampus)
-- Generated: 2026-10-21 08:30:33
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ------------------------------------------------------------
-- Table structure for `migrations`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (`id` integer primary key AUTO_INCREMENT not null, `migration` varchar not null, `batch` integer not null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `migrations`
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('1', '0001_01_01_000000_create_users_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('2', '0001_01_01_000001_create_cache_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('3', '0001_01_01_000002_create_jobs_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('4', '2026_09_22_204727_alter_users_table_add_role', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('5', '2026_09_22_204730_create_services_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('6', '2026_09_22_204739_create_permohonans_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('7', '2026_09_22_204756_create_status_histories_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('8', '2026_09_22_204800_create_request_details_and_notifications_tables', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('9', '2026_09_23_070432_create_personal_access_tokens_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('10', '2026_09_29_090650_update_roles_and_create_inventory_tables', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('11', '2026_09_30_000001_update_roles_add_pic_and_superadmin', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('12', '2026_09_30_073824_fix_status_histories_user_fk_and_delete_old_users', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('13', '2026_09_30_080044_add_form_data_to_permohonans_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('14', '2026_09_30_131200_remove_approver_verificator_roles', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('15', '2026_09_30_192000_alter_status_approval_in_request_suvenir_details_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('16', '2026_10_13_000001_add_is_archived_to_permohonans_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('17', '2026_10_13_000002_add_file_attachment_to_status_histories_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('18', '2026_10_13_000003_create_status_history_attachments_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('19', '2026_10_21_000304_add_is_active_to_users_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('20', '2026_10_21_025439_update_roles_remove_admin_add_tata_usaha', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('21', '2026_10_21_080000_add_requested_for_id_to_permohonans_table', '1');

-- ------------------------------------------------------------
-- Table structure for `users`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (`id` integer primary key AUTO_INCREMENT not null, `name` varchar not null, `email` varchar not null, `email_verified_at` datetime, `password` varchar not null, `remember_token` varchar, `created_at` datetime, `updated_at` datetime, `username` varchar, `unit_kerja` varchar, `role` varchar not null default 'User', `guid` varchar, `domain` varchar, `pic_service_code` varchar, `is_active` tinyint(1) not null default '1') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('1', 'Andi Saputra', 'andi@kampus.ac.id', NULL, '$2y$12$1hbd5Mv8gnLu4i9PlbRYpOQjupAlqiN5JFHJ8w1CKwTlQJ4JwldHq', NULL, '2026-10-21 08:30:21', '2026-10-21 08:30:21', 'andi', 'Biro Akademik & Kemahasiswaan', 'User', NULL, NULL, NULL, '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('2', 'Rini Andriani', 'rini.admin@kampus.ac.id', NULL, '$2y$12$bD7mlHf.74XWPqTb3/FIiOr.S3PNalrVW/AEEqYzu/Jfb7Ak4h64O', NULL, '2026-10-21 08:30:21', '2026-10-21 08:30:21', 'superadmin', 'Divisi Marketing YARSI', 'SuperAdmin', NULL, NULL, NULL, '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('3', 'Sari Indah', 'sari.tu@kampus.ac.id', NULL, '$2y$12$Y2CZbDul0CxJU4gVvy.gdOLvMuMrP2i0Xtl3z.ryZ8.lNiXC1gWpC', NULL, '2026-10-21 08:30:21', '2026-10-21 08:30:21', 'sari', 'Tata Usaha Fakultas Kedokteran', 'Tata Usaha', NULL, NULL, NULL, '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('4', 'Ahmad Fauzi', 'ahmad.pic@kampus.ac.id', NULL, '$2y$12$66WuWdlJkjU.noLfjfF5NOPtmfF5OHSG3ojnmSJn9kcCGzJr4zLsa', NULL, '2026-10-21 08:30:24', '2026-10-21 08:30:24', 'ahmad', 'Divisi Marketing YARSI', 'PIC', NULL, NULL, 'D', '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('5', 'Nurhaliza Putri', 'nurhaliza.pic@kampus.ac.id', NULL, '$2y$12$z1DzZN.9Lz4e8Bt95WjEB.bGcg7g67x/o5/u//lQ4YeLYWzzQDGCy', NULL, '2026-10-21 08:30:24', '2026-10-21 08:30:24', 'nurhaliza', 'Divisi Marketing YARSI', 'PIC', NULL, NULL, 'P', '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('6', 'Bagas Wicaksono', 'bagas.pic@kampus.ac.id', NULL, '$2y$12$gHz/jaJQfERr6CeNE3LNjeSMCMQvQWxyTh865btkdhGTO9TvHnOUC', NULL, '2026-10-21 08:30:24', '2026-10-21 08:30:24', 'bagas', 'Divisi Marketing YARSI', 'PIC', NULL, NULL, 'S', '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('7', 'Dewi Rahayu', 'dewi.pic@kampus.ac.id', NULL, '$2y$12$a0sBwIcTy5R318op8UyEqONLg/97CpmyC00plzgbLl9dzNXkpO0vm', NULL, '2026-10-21 08:30:24', '2026-10-21 08:30:24', 'dewi', 'Divisi Marketing YARSI', 'PIC', NULL, NULL, 'M', '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('8', 'Rizky Pratama', 'rizky.pic@kampus.ac.id', NULL, '$2y$12$MX2apXcI6I9UwQEY6Tnahu6YAj.uHS9oG154lO/VYcmUDOoZN2VlS', NULL, '2026-10-21 08:30:24', '2026-10-21 08:30:24', 'rizky', 'Divisi Marketing YARSI', 'PIC', NULL, NULL, 'L', '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('9', 'Fajar Setiawan', 'fajar@kampus.ac.id', NULL, '$2y$12$qWOviwLJTDTAi8UuozJWOu3TyY5gJv3ngdGr8NTlGrzaMAzNpsOSy', NULL, '2026-10-21 08:30:26', '2026-10-21 08:30:26', 'fajar', 'Fakultas Kedokteran', 'User', NULL, NULL, NULL, '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('10', 'Maya Anggraini', 'maya@kampus.ac.id', NULL, '$2y$12$sTMA3vlDo/GBm0I6zyTVJup9fnK5f0CvoYH5C1tpeSyEkzsWb7EXG', NULL, '2026-10-21 08:30:26', '2026-10-21 08:30:26', 'maya', 'Fakultas Teknologi Informasi', 'User', NULL, NULL, NULL, '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('11', 'Hendra Kurniawan', 'hendra@kampus.ac.id', NULL, '$2y$12$QJ9XsfECN2oZZLw2kMRw7e9EngnqxXFXaWfoNUyt2e3tv7go92YTK', NULL, '2026-10-21 08:30:26', '2026-10-21 08:30:26', 'hendra', 'Fakultas Hukum', 'User', NULL, NULL, NULL, '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('12', 'Sinta Permata', 'sinta@kampus.ac.id', NULL, '$2y$12$T92rkFd4P0TPx.uvDkXCtOcphCSxJ5t2C1mAfPp31wgix75QCmx76', NULL, '2026-10-21 08:30:26', '2026-10-21 08:30:26', 'sinta', 'Fakultas Ekonomi & Bisnis', 'User', NULL, NULL, NULL, '1');
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `username`, `unit_kerja`, `role`, `guid`, `domain`, `pic_service_code`, `is_active`) VALUES ('13', 'Yusuf Ramadhan', 'yusuf@kampus.ac.id', NULL, '$2y$12$dTUcYqyXlVNw2G0HiwC1V.Nbig.oeyXbdSgebJsQQCOaV/GFjdr5y', NULL, '2026-10-21 08:30:26', '2026-10-21 08:30:26', 'yusuf', 'Biro Keuangan & SDM', 'User', NULL, NULL, NULL, '1');

-- ------------------------------------------------------------
-- Table structure for `password_reset_tokens`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (`email` varchar not null, `token` varchar not null, `created_at` datetime, primary key (`email`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `sessions`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (`id` varchar not null, `user_id` integer, `ip_address` varchar, `user_agent` text, `payload` text not null, `last_activity` integer not null, primary key (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `cache`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (`key` varchar not null, `value` text not null, `expiration` integer not null, primary key (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `cache_locks`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (`key` varchar not null, `owner` varchar not null, `expiration` integer not null, primary key (`key`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `jobs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (`id` integer primary key AUTO_INCREMENT not null, `queue` varchar not null, `payload` text not null, `attempts` integer not null, `reserved_at` integer, `available_at` integer not null, `created_at` integer not null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `job_batches`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (`id` varchar not null, `name` varchar not null, `total_jobs` integer not null, `pending_jobs` integer not null, `failed_jobs` integer not null, `failed_job_ids` text not null, `options` text, `cancelled_at` integer, `created_at` integer not null, `finished_at` integer, primary key (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `failed_jobs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (`id` integer primary key AUTO_INCREMENT not null, `uuid` varchar not null, `connection` text not null, `queue` text not null, `payload` text not null, `exception` text not null, `failed_at` datetime not null default CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `services`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (`id` integer primary key AUTO_INCREMENT not null, `code` varchar not null, `name` varchar not null, `description` text not null, `rules_text` text, `icon` varchar not null default 'file-text', `color` varchar not null default 'blue', `is_active` tinyint(1) not null default '1', `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `services`
INSERT INTO `services` (`id`, `code`, `name`, `description`, `rules_text`, `icon`, `color`, `is_active`, `created_at`, `updated_at`) VALUES ('1', 'D', 'Layanan Desain Grafis', 'Brosur, poster cetak, banner/spanduk, flyer digital, sertifikat, Instagram post, dan infografis.', '### Syarat dan Ketentuan Layanan Desain
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
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.', 'Palette', 'indigo', '1', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `services` (`id`, `code`, `name`, `description`, `rules_text`, `icon`, `color`, `is_active`, `created_at`, `updated_at`) VALUES ('2', 'P', 'Layanan Publikasi Website & Social Media', 'Publikasi Feed/Reels IG, Story IG @universitasyarsi, dan website yarsi.ac.id.', '### Syarat dan Ketentuan Layanan Publikasi
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
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.', 'Megaphone', 'sky', '1', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `services` (`id`, `code`, `name`, `description`, `rules_text`, `icon`, `color`, `is_active`, `created_at`, `updated_at`) VALUES ('3', 'S', 'Layanan Permohonan Alat Promosi', 'Penyediaan souvenir, brosur S1/S2, goodie bag, stiker, notebook, pulpen, kipas, kalender untuk kebutuhan eksternal.', '### Syarat dan Ketentuan Permohonan Alat Promosi
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
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.', 'Gift', 'amber', '1', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `services` (`id`, `code`, `name`, `description`, `rules_text`, `icon`, `color`, `is_active`, `created_at`, `updated_at`) VALUES ('4', 'M', 'Layanan Multimedia & Dokumentasi', 'Foto dokumentasi, operator podcast, video promosi, editing video, live streaming, dan video dokumentasi.', '### Syarat dan Ketentuan Layanan Multimedia
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
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.', 'Video', 'emerald', '1', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `services` (`id`, `code`, `name`, `description`, `rules_text`, `icon`, `color`, `is_active`, `created_at`, `updated_at`) VALUES ('5', 'L', 'Layanan Peliputan Berita', 'Wawancara dan penulisan berita kegiatan resmi universitas untuk publikasi institusi.', '### Syarat dan Ketentuan Layanan Peliputan
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
   - Meliput kegiatan
6. **Ketentuan Persetujuan & Publikasi**:
   - Humas berhak menentukan bentuk, sudut pemberitaan, dan jadwal publikasi sesuai standar komunikasi institusi.
   - Verifikator berhak untuk menolak permohonan peliputan apabila kegiatan yang diajukan tidak sesuai dengan kriteria kegiatan (poin 3).
7. **Permohonan Mendadak**:
   - Permohonan yang bersifat mendadak dapat dipertimbangkan berdasarkan ketersediaan sumber daya dan tingkat urgensi kegiatan.', 'Camera', 'rose', '1', '2026-10-21 08:30:26', '2026-10-21 08:30:26');

-- ------------------------------------------------------------
-- Table structure for `service_configs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `service_configs`;
CREATE TABLE `service_configs` (`id` integer primary key AUTO_INCREMENT not null, `service_id` integer not null, `config_key` varchar not null, `config_value` varchar not null, `description` varchar, `created_at` datetime, `updated_at` datetime, foreign key(`service_id`) references `services`(`id`) on delete cascade) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `service_configs`
INSERT INTO `service_configs` (`id`, `service_id`, `config_key`, `config_value`, `description`, `created_at`, `updated_at`) VALUES ('1', '3', 'auto_approval_limit', '20', 'Batas maksimal kuota suvenir yang disetujui otomatis tanpa approver (unit)', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `service_configs` (`id`, `service_id`, `config_key`, `config_value`, `description`, `created_at`, `updated_at`) VALUES ('2', '4', 'max_duration_minutes', '180', 'Batas maksimal durasi peminjaman multimedia/studio per permohonan (menit)', '2026-10-21 08:30:26', '2026-10-21 08:30:26');

-- ------------------------------------------------------------
-- Table structure for `request_multimedia_details`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `request_multimedia_details`;
CREATE TABLE `request_multimedia_details` (`id` integer primary key AUTO_INCREMENT not null, `permohonan_id` integer not null, `tanggal_pelaksanaan` date not null, `jam_mulai` time not null, `jam_selesai` time not null, `durasi_menit` integer not null, `lokasi_alat` varchar, `created_at` datetime, `updated_at` datetime, foreign key(`permohonan_id`) references `permohonans`(`id`) on delete cascade) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `request_suvenir_details`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `request_suvenir_details`;
CREATE TABLE `request_suvenir_details` (`id` integer primary key AUTO_INCREMENT not null, `permohonan_id` integer not null, `nama_item` varchar not null, `qty_diminta` integer not null, `qty_disetujui_otomatis` integer not null default '0', `qty_perlu_approval` integer not null default '0', `status_approval` varchar not null default 'Menunggu Approval', `catatan_approver` text, `approved_by` integer, `approved_at` datetime, `created_at` datetime, `updated_at` datetime, foreign key(`permohonan_id`) references `permohonans`(`id`) on delete cascade, foreign key(`approved_by`) references `users`(`id`) on delete set null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `request_attachments`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `request_attachments`;
CREATE TABLE `request_attachments` (`id` integer primary key AUTO_INCREMENT not null, `permohonan_id` integer not null, `file_name` varchar not null, `file_path` varchar not null, `file_size` integer not null, `mime_type` varchar not null, `created_at` datetime, `updated_at` datetime, foreign key(`permohonan_id`) references `permohonans`(`id`) on delete cascade) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `notifications`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (`id` integer primary key AUTO_INCREMENT not null, `user_id` integer not null, `permohonan_id` integer, `title` varchar not null, `message` text not null, `type` varchar not null default 'info', `is_read` tinyint(1) not null default '0', `read_at` datetime, `created_at` datetime, `updated_at` datetime, foreign key(`user_id`) references `users`(`id`) on delete cascade, foreign key(`permohonan_id`) references `permohonans`(`id`) on delete cascade) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `personal_access_tokens`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (`id` integer primary key AUTO_INCREMENT not null, `tokenable_type` varchar not null, `tokenable_id` integer not null, `name` text not null, `token` varchar not null, `abilities` text, `last_used_at` datetime, `expires_at` datetime, `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `inventory_items`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_items`;
CREATE TABLE `inventory_items` (`id` integer primary key AUTO_INCREMENT not null, `nama_item` varchar not null, `stok_tersedia` integer not null default '0', `satuan` varchar not null default 'unit', `deskripsi` text, `kategori` varchar not null, `kondisi` varchar not null default 'Bagus/Oke', `created_at` datetime, `updated_at` datetime) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `inventory_items`
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('1', 'Brosur S1', '500', 'lembar', 'Brosur promosi program sarjana S1 Universitas YARSI', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('2', 'Brosur S2', '300', 'lembar', 'Brosur promosi program pascasarjana S2 Universitas YARSI', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('3', 'Goodiebag', '250', 'pcs', 'Tas spunbond/kanvas resmi YARSI untuk suvenir tamu eksternal', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('4', 'Stiker YARSI', '600', 'pcs', 'Stiker vinyl logo Universitas YARSI tahan air', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('5', 'Notebook', '120', 'pcs', 'Buku catatan bersampul eksklusif Universitas YARSI', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('6', 'Pulpen', '350', 'pcs', 'Pulpen promosi berlogo Universitas YARSI', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('7', 'Kipas', '200', 'pcs', 'Kipas promosi plastik berdesain YARSI', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('8', 'Gantungan Kunci', '250', 'pcs', 'Gantungan kunci akrilik/karet logo YARSI', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('9', 'Kalender', '100', 'eksemplar', 'Kalender meja tahunan resmi Universitas YARSI', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('10', 'Majalah KABAR', '80', 'eksemplar', 'Majalah berkala KABAR YARSI edisi terkini', 'suvenir', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('11', 'Studio Podcast 1 (Lantai 2)', '1', 'ruangan', 'Studio rekaman podcast kedap suara kapasitas 4 narasumber', 'multimedia', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('12', 'Studio Podcast 2 (Lantai 3)', '1', 'ruangan', 'Studio rekaman mini podcast & live webinar', 'multimedia', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('13', 'Paket Kamera Video Sony Cinema & Wireless Mic', '2', 'paket', '1 unit kamera Sony FX3, 2 mic clip on nirkabel, tripod, dan charger baterai', 'multimedia', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('14', 'Set Lighting Studio & Green Screen', '3', 'set', '3 unit Godox LED light panel, softbox, stand, dan kain green screen', 'multimedia', 'Sedang Diperbaiki', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('15', 'Proyektor 5000 Lumens & Portable Screen', '2', 'unit', 'Proyektor resolusi Full HD dengan input HDMI/VGA dan layar lipat 100 inch', 'multimedia', 'Bagus/Oke', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('16', 'Microphone Wireless Handheld Shure SLXD', '4', 'unit', 'Mic genggam tanpa kabel untuk MC / Pembicara', 'multimedia', 'Rusak', '2026-10-21 08:30:26', '2026-10-21 08:30:26');
INSERT INTO `inventory_items` (`id`, `nama_item`, `stok_tersedia`, `satuan`, `deskripsi`, `kategori`, `kondisi`, `created_at`, `updated_at`) VALUES ('17', 'Kabel HDMI Fiber Optic 30 Meter', '1', 'buah', 'Kabel transmisi sinyal video resolusi tinggi', 'multimedia', 'Hilang', '2026-10-21 08:30:26', '2026-10-21 08:30:26');

-- ------------------------------------------------------------
-- Table structure for `inventory_logs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (`id` integer primary key AUTO_INCREMENT not null, `inventory_item_id` integer not null, `tipe` varchar not null, `jumlah` integer not null, `catatan` text, `user_id` integer, `permohonan_id` integer, `created_at` datetime, `updated_at` datetime, foreign key(`inventory_item_id`) references `inventory_items`(`id`) on delete cascade, foreign key(`user_id`) references `users`(`id`) on delete set null, foreign key(`permohonan_id`) references `permohonans`(`id`) on delete set null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `status_histories`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `status_histories`;
CREATE TABLE `status_histories` (`id` integer primary key AUTO_INCREMENT not null, `permohonan_id` integer not null, `user_id` integer, `status_sebelumnya` varchar, `status_baru` varchar not null, `catatan` text, `created_at` datetime, `updated_at` datetime, `file_name` varchar, `file_path` varchar, `file_size` integer, `mime_type` varchar, foreign key(`permohonan_id`) references permohonans(`id`) on delete cascade on update no action, foreign key(`user_id`) references `users`(`id`) on delete set null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `status_history_attachments`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `status_history_attachments`;
CREATE TABLE `status_history_attachments` (`id` integer primary key AUTO_INCREMENT not null, `status_history_id` integer not null, `file_name` varchar not null, `file_path` varchar not null, `file_size` integer not null, `mime_type` varchar not null, `created_at` datetime, `updated_at` datetime, foreign key(`status_history_id`) references `status_histories`(`id`) on delete cascade) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Table structure for `permohonans`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `permohonans`;
CREATE TABLE `permohonans` (`id` integer primary key AUTO_INCREMENT not null, `nomor_tiket` varchar not null, `user_id` integer not null, `service_id` integer not null, `kategori` varchar not null, `judul_permohonan` varchar not null, `deskripsi_kebutuhan` text not null, `tanggal_dibutuhkan` date, `status` varchar not null default ('Diajukan'), `catatan_revisi` text, `lead_time_minutes` integer, `selesai_at` datetime, `created_at` datetime, `updated_at` datetime, `form_data` text, `is_archived` tinyint(1) not null default ('0'), `archived_at` datetime, `requested_for_id` integer, foreign key(`service_id`) references services(`id`) on delete cascade on update no action, foreign key(`user_id`) references users(`id`) on delete cascade on update no action, foreign key(`requested_for_id`) references `users`(`id`) on delete set null) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
