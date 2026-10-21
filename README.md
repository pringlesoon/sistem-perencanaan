# Sistem Layanan Marketing (SLM) & Permohonan Terpusat (SAPT) - Universitas YARSI

Aplikasi web modern berbasis **Laravel 11 + Inertia/React (Vite)** untuk pengelolaan layanan terpadu Humas & Marketing Universitas YARSI:
1. **Layanan Desain Grafis (D)**
2. **Layanan Publikasi Website & Social Media (P)**
3. **Layanan Permohonan Alat Promosi & Suvenir (S)**
4. **Layanan Multimedia, Dokumentasi & Live Streaming (M)**
5. **Layanan Peliputan Berita (L)**

---

## 🚀 Fitur Unggulan Sistem
- **Autentikasi LDAP / SSO Kampus**: Terhubung langsung dengan direktori akun civitas akademika (Dosen, Tendik, Mahasiswa).
- **Fitur "On Behalf Of" (Mewakili Pemohon)**: Khusus role **Tata Usaha (TU)** dan **PIC** untuk mengajukan layanan atas nama pengguna lain. Tiket otomatis terhubung ke akun pemohon asli.
- **Role-Based Access Control (RBAC)**:
  - `SuperAdmin`: Pengelolaan akun pengguna, status aktif/nonaktif, konfigurasi parameter layanan, analitik global.
  - `Tata Usaha`: Mengajukan layanan eksklusif (Multimedia & Alat Promosi) mewakili civitas unit kerja.
  - `PIC Layanan`: Verifikasi ketersediaan kuota, pengelolaan timeline produksi, conflict checking jadwal multimedia, approval suvenir.
  - `User`: Pengajuan layanan mandiri dan pelacakan status tiket secara realtime.
- **Logistik & Inventaris Realtime**: Penyesuaian stok otomatis, approval workflow suvenir, dan booking slot multimedia.
- **Pelacakan Tiket Terpadu**: Datatable dengan filter layanan, export Excel/CSV bertingkat, dan notifikasi in-app.

---

## 📦 Pilihan Setup Database

Sistem telah dilengkapi database **bersih (clean state)** yang hanya memuat data master resmi (layanan, SOP, business config, akun default, dan inventaris awal tanpa data transaksi uji coba).

### Opsi A: Menggunakan SQLite (Rekomendasi Cepat / Siap Pakai)
File database SQLite bersih telah disertakan langsung di repository:
```
database/database.sqlite
```
Pada file `.env`:
```env
DB_CONNECTION=sqlite
```

### Opsi B: Menggunakan MySQL / MariaDB (Server Hosting / cPanel)
Jika server produksi menggunakan MySQL:
1. Buat database baru di cPanel / phpMyAdmin (misal: `sistem_perencanaan_db`).
2. Import file dump SQL bersih yang telah disediakan:
   ```
   database/sistem_perencanaan_clean.sql
   ```
   Atau jalankan migrasi segar melalui terminal server:
   ```bash
   php artisan migrate:fresh --seed
   ```
3. Sesuaikan file `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sistem_perencanaan_db
   DB_USERNAME=nama_user_db
   DB_PASSWORD=password_db
   ```

---

## 🔐 Konfigurasi LDAP Kampus (Universitas YARSI)

Aplikasi mendukung mode pengujian lokal (**Mock**) dan koneksi nyata ke **Active Directory / OpenLDAP Kampus**:

### Mode Produksi (Koneksi LDAP Real):
Ubah parameter berikut pada file `.env` di server hosting:
```env
LDAP_MOCK=false
LDAP_LOGGING=true
LDAP_CONNECTION=default
LDAP_HOST=ldap.yarsi.ac.id
LDAP_PORT=389
LDAP_USERNAME="cn=read-user,dc=yarsi,dc=ac,dc=id"
LDAP_PASSWORD="password_service_account"
LDAP_BASE_DN="dc=yarsi,dc=ac,dc=id"
LDAP_TIMEOUT=5
LDAP_TLS=false
LDAP_STARTTLS=false
```

> **Catatan Teknis LDAP**:
> - Pencarian pengguna mendukung pencarian multi-atribut (`uid`, `sAMAccountName`, `cn`) sehingga civitas dapat login menggunakan NIP, NPM, maupun username email.
> - Saat login pertama kali berhasil via LDAP, sistem akan otomatis melakukan **auto-provisioning** akun ke database lokal dengan role default `User`.
> - SuperAdmin dapat mengubah role pengguna menjadi `Tata Usaha` atau `PIC Layanan` melalui menu **Kelola User**.

---

## 👥 Akun Default & Persona untuk Uji Coba

Semua akun default menggunakan password: `password`

| Role | Username | Nama | Keterangan |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | `superadmin` | Rini Andriani | Akses penuh, kelola user, konfigurasi sistem |
| **Tata Usaha** | `sari` | Sari Indah | Akses fitur On Behalf Of (Mewakili Pemohon) |
| **PIC Desain (D)** | `ahmad` | Ahmad Fauzi | PIC Layanan Desain Grafis |
| **PIC Publikasi (P)** | `nurhaliza` | Nurhaliza Putri | PIC Layanan Publikasi Sosmed/Web |
| **PIC Suvenir (S)** | `bagas` | Bagas Wicaksono | PIC Layanan Permohonan Alat Promosi |
| **PIC Multimedia (M)** | `dewi` | Dewi Rahayu | PIC Layanan Multimedia & Studio |
| **PIC Liputan (L)** | `rizky` | Rizky Pratama | PIC Layanan Peliputan Berita |
| **User Biasa** | `andi` | Andi Saputra | Pemohon umum |
| **User Biasa** | `fajar` | Fajar Setiawan | Pemohon FK |
| **User Biasa** | `maya` | Maya Anggraini | Pemohon FTI |

---

## 🛠️ Langkah Instalasi di Server Baru

```bash
# 1. Clone repository
git clone https://github.com/pringlesoon/sistem-perencanaan.git
cd sistem-perencanaan

# 2. Install dependensi backend
composer install --optimize-autoloader --no-dev

# 3. Konfigurasi Environment
cp .env.example .env
php artisan key:generate

# 4. Storage link & permission
php artisan storage:link
chmod -R 775 storage bootstrap/cache

# 5. Build aset frontend
npm install
npm run build

# 6. Optimize cache produksi
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🧪 Menjalankan Pengujian (Test Suite)

Untuk memvalidasi integritas seluruh modul:
```bash
php artisan test
```
Seluruh 28 skenario pengujian unit & fitur (126 assertions) siap dan teruji lolos (`PASS`).
