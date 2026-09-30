# Product Requirements Document (PRD)
# Sistem Aplikasi Permohonan Terpusat — Divisi Marketing/Humas

---

## 1. Meta Informasi Proyek

| Atribut | Detail |
|---|---|
| **Nama Proyek** | Sistem Aplikasi Permohonan Terpusat (SAPT) — Divisi Marketing/Humas |
| **Kode Proyek** | SAPT-MKT-2026 |
| **Versi Dokumen** | 1.0 (MVP) |
| **Status** | Draft — Ready for Development |
| **Fase** | MVP (Minimum Viable Product) |
| **Target Rilis** | 2 (dua) minggu sejak tanggal *kickoff* development |
| **Pemilik Produk (Product Owner)** | Kepala Divisi Marketing/Humas |
| **Penyusun Dokumen** | Senior Product Manager & System Analyst |
| **Target Pengguna Awal** | Internal karyawan/mahasiswa dengan akun LDAP aktif |
| **Sponsor** | Divisi Marketing/Humas |

### Timeline Ringkas (2 Minggu)

| Hari | Fokus |
|---|---|
| H1–H2 | Setup infrastruktur, skema database, integrasi LDAP dasar |
| H3–H5 | Pengembangan Dasbor Utama, Autentikasi, Split-Screen Form Layer (D, P, L) |
| H6–H8 | Modul Multimedia (Conflict Checking) & Modul Suvenir (Auto-Approval Limit) |
| H9–H10 | Modul Tracking/Workflow, Notifikasi, Dasbor Analitik |
| H11–H12 | Fitur Ekspor CSV/Excel, integrasi menyeluruh, bugfix |
| H13–H14 | UAT (User Acceptance Test), hardening, deployment MVP |

---

## 2. Latar Belakang & Tujuan (Objective)

### 2.1 Latar Belakang
Saat ini, proses pengajuan permohonan layanan ke Divisi Marketing/Humas (Desain, Publikasi, Suvenir, Multimedia, Liputan) dilakukan secara manual/tersebar (email, chat, form fisik, atau spreadsheet terpisah). Kondisi ini menyebabkan:
- Tidak adanya standar Aturan Main (Syarat & Ketentuan) yang konsisten per jenis layanan.
- Tidak ada mekanisme validasi otomatis (misalnya bentrok jadwal peminjaman Multimedia, atau batas kuota Suvenir).
- Sulitnya melacak status dan **Lead Time** (waktu tunggu) setiap permohonan.
- Tidak ada data agregat untuk mengukur beban kerja tiap layanan.

### 2.2 Tujuan (Objective)
1. Menyediakan **satu pintu masuk (single entry point)** terpusat untuk seluruh permohonan ke Divisi Marketing/Humas.
2. Menstandarkan proses pengajuan melalui **Split-Screen UI** yang menyandingkan Aturan Main dan Formulir dalam satu layar.
3. Mengotomasi validasi bisnis kritikal: **Conflict Checking** jadwal Multimedia dan **Auto-Approval Limit** Suvenir.
4. Memberikan visibilitas status *end-to-end* melalui **Workflow Tracking** dan **Lead Time Measurement**.
5. Menyediakan **Dasbor Analitik** sebagai dasar pengambilan keputusan operasional divisi.
6. Menjamin keamanan akses melalui **integrasi LDAP/SSO internal**, bukan sistem akun independen.

### 2.3 Success Metrics (MVP)
| Metrik | Target |
|---|---|
| Waktu rata-rata pengajuan permohonan baru | < 3 menit |
| Akurasi Conflict Checking Multimedia | 0% jadwal bentrok lolos ke database |
| Akurasi Auto-Approval Suvenir | 100% sesuai formula limit |
| Adopsi (user login via LDAP berhasil) | ≥ 95% percobaan login sukses |
| Ketersediaan riwayat status (timestamp) | 100% permohonan tercatat lengkap |

---

## 3. Ruang Lingkup (Scope)

### 3.1 In-Scope (MVP — 2 Minggu)
- Autentikasi via LDAP/SSO (Single Sign-On internal).
- Dasbor Utama dengan 5 kartu/menu layanan: **[D] Desain, [P] Publikasi, [S] Suvenir, [M] Multimedia, [L] Liputan**.
- Formulir pengajuan dengan layout **Split-Screen** (Kiri: Aturan Main, Kanan: Form + Upload) untuk seluruh 5 layanan.
- Logika bisnis khusus:
  - **[M] Multimedia**: Date/Time Picker, Conflict Checking, batas durasi maksimal.
  - **[S] Suvenir**: Auto-Approval Limit berbasis kuantitas.
- Modul Tracking (Datatable) dengan riwayat status & timestamp (Diajukan → Diproses → Direvisi → Selesai).
- Notifikasi in-app dan email saat status berubah.
- Dasbor Analitik dasar (total request, request selesai, beban per layanan).
- Ekspor data tabel ke CSV/Excel.
- 3 role: User (Pemohon), Admin/Pelaksana, Approver.

### 3.2 Out-of-Scope (Fase Berikutnya / Non-MVP)
- Aplikasi mobile native (Android/iOS).
- Payment gateway / anggaran biaya otomatis.
- Integrasi kalender eksternal (Google Calendar/Outlook sync dua arah).
- Multi-level approval workflow (lebih dari 1 tingkat Approver).
- Chat/komentar real-time antar user-admin dalam sistem.
- Digital signature / e-materai pada dokumen hasil.
- Manajemen inventaris fisik Suvenir (stok gudang).
- Custom role builder (role bersifat fixed: User, Admin, Approver).

---

## 4. Arsitektur & Tech Stack

### 4.1 Overview Arsitektur
Sistem menggunakan arsitektur **3-tier**: Front-End (SPA React) berkomunikasi dengan Back-End melalui **RESTful API**, Back-End menangani logika bisnis dan autentikasi terhadap **LDAP Server**, serta menyimpan data pada **Relational Database**.

```
┌──────────────────────┐        REST API (JSON)        ┌──────────────────────┐
│   FRONT-END (React)  │ ─────────────────────────────▶ │   BACK-END API       │
│  - SPA + React Router│ ◀───────────────────────────── │  (Laravel/Node.js)   │
│  - Hooks + Context/   │        JWT Bearer Token         │  - Auth Middleware   │
│    Redux/Zustand      │                                │  - Business Logic   │
└──────────────────────┘                                └──────┬───────┬───────┘
                                                                 │       │
                                                     LDAP Bind   │       │  ORM (Eloquent/
                                                                 ▼       ▼  Prisma/Sequelize)
                                                    ┌────────────────┐ ┌──────────────────┐
                                                    │  LDAP SERVER   │ │  RDBMS            │
                                                    │  (Autentikasi) │ │  (MySQL/Postgre/  │
                                                    └────────────────┘ │   SQLite)          │
                                                                       └──────────────────┘
```

### 4.2 Front-End
- **Framework**: React JS (versi 18+), berbasis **Functional Component + Hooks** (`useState`, `useEffect`, `useMemo`, `useCallback`, custom hooks).
- **State Management**: Context API untuk state global ringan (session user, notifikasi); direkomendasikan **Zustand/Redux Toolkit** untuk state form kompleks (Multimedia scheduling, Suvenir quantity) jika kompleksitas meningkat.
- **Routing**: React Router v6 (Protected Route berbasis role).
- **Styling**: Component-based styling (TailwindCSS/CSS Modules) — konsisten dengan design system internal.
- **Komponen Kunci yang Wajib Reusable**:
  - `<ServiceCard />` — kartu menu dasbor (D/P/S/M/L).
  - `<SplitScreenLayout />` — layout dua kolom (rules vs form).
  - `<DateTimePicker />` — khusus modul Multimedia, dengan indikator slot terisi.
  - `<StatusTimeline />` — riwayat status/timestamp permohonan.
  - `<DataTable />` — tabel tracking dengan sort, filter, pagination, export.
  - `<FileUploader />` — unggah lampiran (drag & drop + validasi tipe/size).
- **HTTP Client**: Axios dengan interceptor untuk JWT token & auto-refresh/handle 401.

### 4.3 Back-End & API
- **Bahasa/Framework**: Laravel (PHP) *atau* Node.js (Express/NestJS) — dipilih sesuai kesiapan tim, arsitektur harus tetap **RESTful, stateless, berbasis JWT**.
- **Autentikasi**: Integrasi **LDAP** (contoh: `ldapjs` untuk Node.js, atau `LdapRecord`/`Adldap2` untuk Laravel) melakukan **bind** ke Directory Server perusahaan/kampus, lalu Back-End menerbitkan **JWT token** untuk sesi aplikasi (LDAP tidak dipanggil ulang di setiap request).
- **Struktur API**: Versioned REST endpoints (`/api/v1/...`), response format JSON konsisten (`{status, message, data}`).
- **Job/Queue (opsional MVP)**: Untuk pengiriman email notifikasi asinkron (mencegah blocking request utama).

### 4.4 Database
- **Jenis**: Relasional — **MySQL / PostgreSQL** (produksi), **SQLite** dapat digunakan untuk lingkungan development/demo cepat.
- **Prinsip Desain**: Normalisasi hingga 3NF untuk data master; tabel `request_status_history` didesain **append-only** (setiap perubahan status = baris baru, bukan overwrite) agar Lead Time terukur akurat.

#### 4.4.1 Skema Tabel Inti (Ringkasan)

| Tabel | Deskripsi Singkat |
|---|---|
| `users` | Cache profil user hasil sinkronisasi LDAP (username, nama, email, unit kerja, role_id) |
| `roles` | Master role: `user`, `admin`, `approver` |
| `services` | Master 5 layanan: Desain, Publikasi, Suvenir, Multimedia, Liputan (kode, nama, deskripsi, rules_text) |
| `requests` | Data inti permohonan (id, user_id, service_id, status, created_at, dst.) |
| `request_status_history` | Riwayat status + timestamp (request_id, status_from, status_to, changed_by, changed_at, catatan) |
| `request_attachments` | Lampiran file per permohonan |
| `request_multimedia_detail` | Detail khusus Multimedia (tanggal, jam_mulai, jam_selesai, lokasi/alat, durasi) |
| `request_suvenir_detail` | Detail khusus Suvenir (item, qty_diminta, qty_disetujui_otomatis, qty_perlu_approval) |
| `notifications` | Log notifikasi in-app/email (user_id, request_id, tipe, is_read, sent_at) |

---

## 5. User Personas & Roles

### 5.1 Persona 1 — "Andi", Karyawan Pemohon (User)
- **Role**: User (Pemohon)
- **Latar**: Staf divisi lain yang butuh materi desain/publikasi rutin.
- **Kebutuhan**: Form pengajuan cepat, jelas syarat & ketentuannya, bisa memantau status tanpa perlu bertanya manual ke admin.
- **Pain Point Saat Ini**: Tidak tahu status permohonan, sering bentrok jadwal ruang/alat multimedia.

### 5.2 Persona 2 — "Sari", Admin/Pelaksana
- **Role**: Admin/Pelaksana
- **Latar**: Staf Marketing/Humas yang mengeksekusi tiap permohonan (desain, cetak, dokumentasi, dll).
- **Kebutuhan**: Melihat antrean kerja terpusat, mengubah status pekerjaan, melihat detail teknis tiap request.
- **Pain Point Saat Ini**: Permohonan datang dari banyak kanal (WA, email) sehingga sulit diprioritaskan.

### 5.3 Persona 3 — "Pak Budi", Approver (Kepala Divisi)
- **Role**: Approver
- **Latar**: Kepala Divisi Marketing/Humas, penanggung jawab akhir kuota Suvenir & kebijakan layanan.
- **Kebutuhan**: Approval cepat untuk permohonan yang melewati batas otomatis, visibilitas dasbor beban kerja tim.
- **Pain Point Saat Ini**: Tidak ada data agregat untuk keputusan strategis (mana layanan paling padat).

### 5.4 Matriks Hak Akses (Role Access Matrix)

| Fitur | User | Admin/Pelaksana | Approver |
|---|:---:|:---:|:---:|
| Login via LDAP | ✅ | ✅ | ✅ |
| Ajukan permohonan (5 layanan) | ✅ | ❌ | ❌ |
| Lihat status permohonan sendiri | ✅ | ✅ (semua) | ✅ (semua) |
| Ubah status permohonan (Diproses/Selesai) | ❌ | ✅ | ❌ |
| Approve permohonan Suvenir > limit | ❌ | ❌ | ✅ |
| Lihat Dasbor Analitik | ❌ | ✅ | ✅ |
| Ekspor data ke CSV/Excel | ❌ | ✅ | ✅ |
| Kelola master Aturan Main per layanan | ❌ | ✅ (opsional) | ❌ |

---

## 6. User Stories

### 6.1 Autentikasi
- **US-01**: Sebagai **User**, saya ingin **login menggunakan akun LDAP saya (SSO)**, sehingga **saya tidak perlu membuat akun baru dan bisa langsung mengakses sistem dengan kredensial yang sudah familiar**.
- **US-02**: Sebagai **sistem**, saya ingin **menolak login jika bind LDAP gagal**, sehingga **hanya user terverifikasi yang dapat mengakses aplikasi**.

### 6.2 Dasbor & Navigasi
- **US-03**: Sebagai **User**, saya ingin **melihat 5 kartu menu layanan (D/P/S/M/L) di dasbor utama**, sehingga **saya bisa langsung memilih jenis permohonan yang saya butuhkan**.
- **US-04**: Sebagai **Admin**, saya ingin **melihat seluruh permohonan masuk dalam satu tabel tracking**, sehingga **saya bisa memprioritaskan pekerjaan tanpa mengecek banyak kanal**.

### 6.3 Formulir Split-Screen
- **US-05**: Sebagai **User**, saya ingin **melihat Aturan Main/Syarat & Ketentuan di sisi kiri layar saat mengisi formulir**, sehingga **saya memahami ketentuan layanan sebelum mengajukan**.
- **US-06**: Sebagai **User**, saya ingin **mengunggah lampiran pendukung di sisi kanan formulir**, sehingga **permohonan saya lengkap sejak awal diajukan**.

### 6.4 Multimedia
- **US-07**: Sebagai **User**, saya ingin **memilih tanggal dan jam menggunakan Date/Time Picker saat mengajukan layanan Multimedia**, sehingga **saya bisa menentukan jadwal kebutuhan saya secara presisi**.
- **US-08**: Sebagai **User**, saya ingin **sistem otomatis menolak/menyembunyikan slot jam yang sudah dipesan orang lain**, sehingga **saya tidak mengajukan jadwal yang berpotensi bentrok**.
- **US-09**: Sebagai **sistem**, saya ingin **membatasi durasi maksimal peminjaman per permohonan**, sehingga **tidak ada satu user yang memonopoli jadwal (misalnya booking pagi-sore penuh)**.

### 6.5 Suvenir
- **US-10**: Sebagai **User**, saya ingin **mengajukan jumlah suvenir yang saya butuhkan**, sehingga **kebutuhan acara/keperluan saya terpenuhi**.
- **US-11**: Sebagai **sistem**, saya ingin **menyetujui otomatis jumlah suvenir hingga batas limit tertentu**, sehingga **proses berjalan cepat tanpa menunggu approval manual untuk permintaan wajar**.
- **US-12**: Sebagai **Approver**, saya ingin **menerima notifikasi & antrean approval untuk sisa jumlah suvenir di atas limit otomatis**, sehingga **saya bisa mengontrol pengeluaran/stok secara manual**.

### 6.6 Tracking & Workflow
- **US-13**: Sebagai **User**, saya ingin **melihat riwayat status permohonan saya (Diajukan → Diproses → Direvisi → Selesai) lengkap dengan timestamp**, sehingga **saya tahu progres dan estimasi waktu penyelesaian**.
- **US-14**: Sebagai **Admin**, saya ingin **mengubah status permohonan dan menambahkan catatan revisi**, sehingga **user mendapat informasi jika ada perbaikan yang diperlukan**.

### 6.7 Notifikasi & Analitik
- **US-15**: Sebagai **User**, saya ingin **menerima notifikasi in-app/email saat status permohonan saya berubah**, sehingga **saya tidak perlu mengecek sistem secara manual berulang kali**.
- **US-16**: Sebagai **Approver**, saya ingin **melihat dasbor analitik (total request, request selesai, beban per layanan)**, sehingga **saya dapat mengevaluasi kinerja tim dan distribusi beban kerja**.
- **US-17**: Sebagai **Admin**, saya ingin **mengekspor data tabel permohonan ke CSV/Excel**, sehingga **saya dapat membuat laporan offline atau presentasi ke pimpinan**.

---

## 7. Functional Requirements

### 7.1 FR-Auth — Autentikasi LDAP/SSO
| ID | Requirement |
|---|---|
| FR-AUTH-01 | Sistem menyediakan halaman login dengan input `username` dan `password` yang divalidasi melalui **LDAP bind** ke server direktori internal. |
| FR-AUTH-02 | Jika bind LDAP berhasil, Back-End membuat/memperbarui record di tabel `users` (sinkronisasi atribut: nama, email, unit kerja) dan menerbitkan **JWT token** (access token + refresh token). |
| FR-AUTH-03 | Role (`user`/`admin`/`approver`) ditentukan berdasarkan mapping grup LDAP **atau** tabel assignment role manual di database (fallback jika grup LDAP tidak granular). |
| FR-AUTH-04 | Token JWT memiliki masa berlaku (expiry) dan didukung mekanisme refresh token; percobaan akses dengan token kedaluwarsa akan di-redirect ke halaman login. |
| FR-AUTH-05 | Sistem mencatat log percobaan login gagal (audit trail dasar). |

### 7.2 FR-Dashboard — Dasbor Utama
| ID | Requirement |
|---|---|
| FR-DASH-01 | Dasbor utama menampilkan **5 kartu/tombol layanan**: Desain [D], Publikasi [P], Suvenir [S], Multimedia [M], Liputan [L], masing-masing dengan ikon, nama, dan deskripsi singkat. |
| FR-DASH-02 | Klik pada kartu layanan akan mengarahkan (routing) ke halaman formulir Split-Screen sesuai layanan yang dipilih (`/request/{service_code}`). |
| FR-DASH-03 | Dasbor menampilkan ringkasan status permohonan milik user yang login (jumlah aktif, selesai) di area terpisah dari 5 kartu utama. |

### 7.3 FR-Form — Formulir Split-Screen
| ID | Requirement |
|---|---|
| FR-FORM-01 | Halaman formulir wajib menggunakan layout **dua kolom**: **Kolom Kiri** = Aturan Main/Syarat & Ketentuan (teks statis/rich-text dari master `services.rules_text`, read-only); **Kolom Kanan** = Formulir isian dinamis + tombol unggah lampiran. |
| FR-FORM-02 | Kolom kanan wajib memiliki field umum: Judul Permohonan, Deskripsi/Keperluan, Tanggal Dibutuhkan, Unit/Divisi Pemohon (auto-fill dari profil LDAP), dan field spesifik sesuai jenis layanan. |
| FR-FORM-03 | Komponen unggah lampiran (`<FileUploader />`) mendukung multi-file, validasi tipe file (PDF, JPG, PNG, DOCX) dan validasi ukuran maksimal (misal 10MB/file). |
| FR-FORM-04 | Pada layar mobile/tablet (responsive breakpoint < 768px), Split-Screen berubah menjadi **stacked layout** (Aturan Main collapsible di atas, Form di bawah) — bukan dihilangkan. |
| FR-FORM-05 | Submit form melakukan validasi client-side (React) **dan** server-side (Back-End) sebelum data disimpan. |

### 7.4 FR-Multimedia — Logika Khusus Layanan [M]
| ID | Requirement | Detail Teknis |
|---|---|---|
| FR-MM-01 | Form Multimedia wajib menyertakan **Date Picker** dan **Time Picker** (jam mulai & jam selesai) sebagai field wajib. | Komponen `<DateTimePicker />`, granularitas minimal 30 menit. |
| FR-MM-02 | Sistem melakukan **Conflict Checking** real-time: slot jam yang sudah memiliki permohonan berstatus `Diajukan`/`Diproses`/`Selesai` pada tanggal & rentang jam yang sama **tidak dapat dipilih ulang**. | Query overlap: `(new.jam_mulai < existing.jam_selesai) AND (new.jam_selesai > existing.jam_mulai)` pada tabel `request_multimedia_detail`, dieksekusi baik di sisi UI (disable slot) maupun API (validasi final, mencegah race condition). |
| FR-MM-03 | UI Date/Time Picker menampilkan indikator visual (misal warna abu-abu/disabled) untuk slot yang sudah terisi pada tanggal terpilih. | Endpoint `GET /api/v1/multimedia/availability?date=YYYY-MM-DD` mengembalikan daftar slot terisi. |
| FR-MM-04 | Sistem membatasi **durasi maksimal per permohonan** (contoh: maksimal 3 jam per booking) sehingga user tidak dapat memesan rentang waktu penuh satu hari (misal 08:00–17:00). | Validasi: `(jam_selesai - jam_mulai) <= MAX_DURATION_MINUTES` (nilai `MAX_DURATION_MINUTES` dikonfigurasi sebagai parameter sistem, bukan hardcode). |
| FR-MM-05 | Jika terjadi percobaan submit bersamaan (race condition) pada slot yang sama, API menggunakan **database transaction + row locking** (atau unique constraint komposit `tanggal + jam_mulai + jam_selesai + resource_id`) untuk memastikan hanya satu permohonan yang berhasil disimpan. | Response API mengembalikan HTTP 409 Conflict jika terjadi bentrok saat submit. |
| FR-MM-06 | Sistem menampilkan pesan error yang jelas ("Jadwal ini sudah dipesan / melebihi durasi maksimal X jam") saat validasi gagal. | Ditampilkan inline di bawah field Date/Time Picker. |

### 7.5 FR-Suvenir — Logika Khusus Layanan [S]
| ID | Requirement | Detail Teknis |
|---|---|---|
| FR-SV-01 | Form Suvenir wajib menyertakan field **Nama Item** dan **Kuantitas (qty) yang diminta**. | Field numerik, validasi `qty > 0`. |
| FR-SV-02 | Sistem memiliki parameter **Auto-Approval Limit** (misal: 20 unit) yang dapat dikonfigurasi Admin, disimpan pada tabel konfigurasi (bukan hardcode di kode program). | Tabel `service_config` (service_id, config_key=`auto_approval_limit`, config_value). |
| FR-SV-03 | Saat submit, sistem menghitung: <br>`qty_disetujui_otomatis = MIN(qty_diminta, auto_approval_limit)` <br>`qty_perlu_approval = MAX(qty_diminta - auto_approval_limit, 0)` | Contoh kasus: user minta 50, limit 20 → `qty_disetujui_otomatis = 20` (langsung berstatus "Disetujui Sebagian/Diproses"), `qty_perlu_approval = 30` (masuk antrean Approver). |
| FR-SV-04 | Jika `qty_perlu_approval > 0`, sistem otomatis membuat entri antrean approval dan mengirim notifikasi ke role **Approver**. | Status permohonan menjadi `Menunggu Approval Sebagian` hingga Approver memutuskan (Setuju/Tolak/Setuju Sebagian) untuk sisa qty. |
| FR-SV-05 | Jika `qty_diminta <= auto_approval_limit`, permohonan langsung berstatus `Diproses` tanpa menunggu Approver. | — |
| FR-SV-06 | Approver dapat melihat detail breakdown (`qty_diminta`, `qty_disetujui_otomatis`, `qty_perlu_approval`) sebelum memutuskan. | Ditampilkan di halaman detail permohonan khusus role Approver. |

### 7.6 FR-Tracking — Workflow & Riwayat Status
| ID | Requirement |
|---|---|
| FR-TRK-01 | Setiap permohonan memiliki status baku: `Diajukan` → `Diproses` → `Direvisi` (opsional, dapat kembali ke `Diproses`) → `Selesai`. Status tambahan: `Ditolak`, `Menunggu Approval Sebagian` (khusus Suvenir). |
| FR-TRK-02 | Setiap perubahan status **wajib** membuat baris baru di `request_status_history` (append-only) berisi: status sebelumnya, status baru, user/admin yang mengubah, timestamp, dan catatan opsional. |
| FR-TRK-03 | Halaman Tracking menampilkan **Datatable** dengan kolom minimal: ID Permohonan, Jenis Layanan, Pemohon, Status Saat Ini, Tanggal Diajukan, Lead Time (dihitung otomatis: `timestamp_status_terakhir - timestamp_diajukan`). |
| FR-TRK-04 | Datatable mendukung: sorting per kolom, filter (by status, by layanan, by rentang tanggal), pencarian teks bebas, dan pagination. |
| FR-TRK-05 | User (Pemohon) hanya dapat melihat baris permohonan miliknya sendiri; Admin dan Approver dapat melihat seluruh baris. |
| FR-TRK-06 | Klik pada baris tabel membuka halaman/modal detail permohonan lengkap dengan komponen `<StatusTimeline />` (visualisasi kronologis riwayat status). |

### 7.7 FR-Notif — Notifikasi
| ID | Requirement |
|---|---|
| FR-NOTIF-01 | Sistem mengirim notifikasi **in-app** (ikon lonceng + badge unread count) setiap kali status permohonan berubah. |
| FR-NOTIF-02 | Sistem mengirim notifikasi **email** (async, via queue/job) dengan ringkasan perubahan status dan tautan langsung ke detail permohonan. |
| FR-NOTIF-03 | User dapat menandai notifikasi sebagai sudah dibaca (`is_read = true`). |

### 7.8 FR-Analytics — Dasbor Analitik
| ID | Requirement |
|---|---|
| FR-AN-01 | Dasbor Analitik (akses Admin & Approver) menampilkan: Total Request (keseluruhan/periode), Request Selesai, Request Aktif/Pending, dan Rata-rata Lead Time. |
| FR-AN-02 | Dasbor menampilkan **beban per layanan** (jumlah request per kategori D/P/S/M/L) dalam bentuk chart (bar/pie chart). |
| FR-AN-03 | Dasbor mendukung filter rentang tanggal (harian/mingguan/bulanan). |

### 7.9 FR-Export — Ekspor Data
| ID | Requirement |
|---|---|
| FR-EXP-01 | Tombol "Export" pada halaman Tracking menghasilkan file **CSV** dan **Excel (.xlsx)** berisi data sesuai filter yang sedang aktif di Datatable. |
| FR-EXP-02 | Proses ekspor dilakukan di sisi Back-End (bukan hanya dump tabel HTML di Front-End) untuk memastikan konsistensi format dan mendukung dataset besar. |

---

## 8. Non-Functional Requirements

### 8.1 Keamanan
| ID | Requirement |
|---|---|
| NFR-SEC-01 | Seluruh autentikasi wajib melalui LDAP; **tidak ada** mekanisme pembuatan akun lokal independen di MVP ini. |
| NFR-SEC-02 | Password pengguna **tidak pernah disimpan** di database aplikasi — hanya diteruskan sekali ke proses bind LDAP lalu dibuang dari memori. |
| NFR-SEC-03 | Seluruh komunikasi Front-End ↔ Back-End menggunakan **HTTPS/TLS**. |
| NFR-SEC-04 | Otorisasi berbasis role diterapkan **di sisi Back-End (API level)**, bukan hanya disembunyikan di UI React — mencegah bypass melalui manipulasi request langsung. |
| NFR-SEC-05 | Validasi file upload mencakup pengecekan MIME-type asli (bukan hanya ekstensi) untuk mencegah upload file berbahaya. |
| NFR-SEC-06 | JWT token disimpan menggunakan metode aman (HttpOnly cookie direkomendasikan, atau in-memory storage; hindari `localStorage` untuk token sensitif jika memungkinkan). |
| NFR-SEC-07 | Rate limiting diterapkan pada endpoint login untuk mencegah brute-force terhadap LDAP. |

### 8.2 Performa
| ID | Requirement |
|---|---|
| NFR-PERF-01 | Waktu render awal (First Contentful Paint) halaman React ≤ 2 detik pada koneksi jaringan internal standar. |
| NFR-PERF-02 | Endpoint Conflict Checking Multimedia (`availability`) merespons ≤ 500ms untuk mendukung interaksi UI real-time. |
| NFR-PERF-03 | Datatable Tracking mendukung minimal 5.000 baris data tanpa degradasi signifikan — implementasi **server-side pagination**, bukan load seluruh data ke Front-End. |
| NFR-PERF-04 | Komponen React kritikal (Date/Time Picker, DataTable) menggunakan optimisasi (`useMemo`, `useCallback`, lazy loading/code-splitting per route) untuk mencegah re-render berlebihan. |

### 8.3 Reliabilitas & Skalabilitas
| ID | Requirement |
|---|---|
| NFR-REL-01 | Sistem memiliki mekanisme fallback jika LDAP Server tidak dapat diakses (menampilkan pesan error yang jelas, bukan crash aplikasi). |
| NFR-REL-02 | Database menggunakan transaksi (ACID) pada operasi kritikal (submit Multimedia, submit Suvenir) untuk mencegah data korup akibat concurrent request. |
| NFR-REL-03 | Arsitektur API bersifat stateless (JWT-based) sehingga siap untuk horizontal scaling di fase berikutnya. |

### 8.4 Usability & Aksesibilitas
| ID | Requirement |
|---|---|
| NFR-UX-01 | Antarmuka React responsif (mobile, tablet, desktop) mengikuti prinsip *mobile-first* untuk Dasbor dan Tracking. |
| NFR-UX-02 | Pesan error/validasi ditampilkan dalam Bahasa Indonesia yang jelas dan actionable (bukan pesan error teknis mentah). |
| NFR-UX-03 | Komponen form mendukung navigasi keyboard dasar dan label ARIA untuk aksesibilitas. |

### 8.5 Maintainability
| ID | Requirement |
|---|---|
| NFR-MAINT-01 | Kode Front-End React mengikuti struktur folder modular (`components/`, `pages/`, `hooks/`, `services/`, `context/`) agar mudah dikembangkan di fase berikutnya. |
| NFR-MAINT-02 | Parameter bisnis (Auto-Approval Limit Suvenir, Durasi Maksimal Multimedia) disimpan sebagai **konfigurasi di database**, bukan hardcoded, agar dapat diubah Admin tanpa deployment ulang. |

---

## 9. Panduan UI/UX

### 9.1 Konsep Dasbor Utama
Dasbor utama adalah landing page pasca-login, menampilkan **5 kartu layanan** dalam grid responsif (misal 5 kolom di desktop, 2 kolom di mobile). Setiap kartu memiliki:
- Ikon representatif layanan.
- Label kode + nama lengkap (contoh: **[M] Multimedia**).
- Deskripsi singkat 1 baris.
- Indikator jumlah permohonan aktif milik user pada layanan tersebut (opsional, badge angka).

Di atas grid kartu, terdapat ringkasan singkat ("Anda memiliki X permohonan aktif") dan akses cepat ke halaman Tracking.

### 9.2 Konsep Split-Screen Form
Halaman formulir dibagi dua kolom dengan rasio disarankan **40:60** (Kiri:Kanan) di desktop:

```
┌───────────────────────────┬──────────────────────────────────┐
│  KIRI (40%)                │  KANAN (60%)                     │
│  ATURAN MAIN               │  FORMULIR PERMOHONAN              │
│  - Syarat & Ketentuan      │  - Field umum (judul, deskripsi)  │
│  - Estimasi waktu proses   │  - Field spesifik per layanan     │
│  - Dokumen yang wajib      │    (mis. Date/Time Picker utk M,  │
│    dilampirkan             │     Qty utk S)                    │
│  - Kontak PIC (opsional)   │  - Tombol Upload Lampiran          │
│                             │  - Tombol "Ajukan Permohonan"     │
└───────────────────────────┴──────────────────────────────────┘
```
- Pada layar **mobile (<768px)**, kolom Kiri berubah menjadi panel **collapsible/accordion** di atas Formulir (default: collapsed, dengan tombol "Lihat Aturan Main") agar Formulir tetap menjadi fokus utama tanpa kehilangan akses informasi.
- Kolom Kiri bersifat **read-only**, kontennya diambil dari master data `services.rules_text` (dapat berupa rich-text/markdown yang dirender).

### 9.3 Konsep Halaman Tracking
- Datatable dengan **filter bar** di atas (dropdown Status, dropdown Layanan, date-range picker) dan tombol **Export** di kanan atas.
- Setiap baris menampilkan badge warna sesuai status (contoh: kuning = Diajukan, biru = Diproses, oranye = Direvisi, hijau = Selesai, merah = Ditolak).
- Klik baris membuka **Detail Drawer/Modal** berisi seluruh informasi permohonan + komponen `<StatusTimeline />` bergaya vertikal step-indicator menampilkan histori status dengan timestamp.

### 9.4 Konsep Dasbor Analitik
- Bagian atas: 4 **KPI Card** (Total Request, Request Selesai, Request Aktif, Rata-rata Lead Time).
- Bagian bawah: **Bar Chart** perbandingan beban per layanan (D/P/S/M/L) dan **Line Chart** tren jumlah request per periode waktu.

### 9.5 Prinsip Desain Umum
- Konsistensi warna status di seluruh modul (Dasbor, Tracking, Notifikasi, Analitik).
- Feedback instan untuk aksi async (loading spinner saat submit, toast notification untuk sukses/gagal).
- Empty state yang informatif (contoh: "Belum ada permohonan Multimedia yang diajukan" lengkap dengan CTA).

---

## 10. Kriteria Penerimaan (Acceptance Criteria / UAT)

### 10.1 AC — Autentikasi
- [ ] **AC-01**: User dengan kredensial LDAP valid berhasil login dan diarahkan ke Dasbor Utama.
- [ ] **AC-02**: User dengan kredensial LDAP tidak valid menerima pesan error yang jelas dan tetap berada di halaman login.
- [ ] **AC-03**: Role user (User/Admin/Approver) yang login termapping dengan benar dan membatasi akses menu sesuai Matriks Hak Akses (Bagian 5.4).

### 10.2 AC — Dasbor & Formulir
- [ ] **AC-04**: Dasbor Utama menampilkan tepat 5 kartu layanan (D, P, S, M, L) dan seluruhnya dapat diklik menuju formulir masing-masing.
- [ ] **AC-05**: Halaman formulir seluruh layanan menampilkan layout Split-Screen (Aturan Main di kiri, Form di kanan) sesuai desain di Bagian 9.2.
- [ ] **AC-06**: Upload lampiran berhasil menyimpan file dan menolak file dengan tipe/ukuran tidak sesuai ketentuan.

### 10.3 AC — Multimedia
- [ ] **AC-07**: User tidak dapat memilih/submit jam yang bentrok dengan permohonan Multimedia lain yang sudah ada (baik dicegah di UI maupun ditolak di API dengan HTTP 409).
- [ ] **AC-08**: User tidak dapat submit permohonan Multimedia dengan durasi melebihi batas maksimal yang dikonfigurasi sistem.
- [ ] **AC-09**: Dua user yang submit slot jam sama secara bersamaan (simulasi race condition) menghasilkan hanya **satu** permohonan tersimpan; permohonan kedua ditolak dengan pesan error.

### 10.4 AC — Suvenir
- [ ] **AC-10**: User mengajukan qty 50 dengan limit sistem 20 → sistem otomatis menyetujui 20 unit dan mengirim 30 unit sisanya ke antrean Approver, sesuai FR-SV-03.
- [ ] **AC-11**: User mengajukan qty di bawah/sama dengan limit → permohonan langsung berstatus `Diproses` tanpa perlu approval manual.
- [ ] **AC-12**: Approver dapat melihat breakdown qty diminta/disetujui-otomatis/perlu-approval dan dapat mengambil keputusan (setuju/tolak) untuk sisa qty.

### 10.5 AC — Tracking & Workflow
- [ ] **AC-13**: Setiap perubahan status permohonan (oleh Admin) tercatat sebagai entri baru pada riwayat status dengan timestamp yang akurat.
- [ ] **AC-14**: Datatable Tracking menampilkan Lead Time yang terhitung otomatis dan konsisten dengan selisih timestamp riwayat status.
- [ ] **AC-15**: User hanya dapat melihat permohonan miliknya sendiri di halaman Tracking; Admin/Approver dapat melihat seluruh data.

### 10.6 AC — Notifikasi, Analitik, Export
- [ ] **AC-16**: Notifikasi in-app dan email terkirim maksimal dalam 1 menit setelah status permohonan berubah.
- [ ] **AC-17**: Dasbor Analitik menampilkan angka Total Request, Request Selesai, dan grafik beban per layanan yang konsisten dengan data di database (diverifikasi lintas query manual).
- [ ] **AC-18**: File hasil ekspor CSV/Excel dapat dibuka tanpa error dan datanya sesuai dengan filter Datatable yang aktif saat tombol Export ditekan.

### 10.7 Definisi "Selesai" (Definition of Done — MVP)
Fase MVP dinyatakan **selesai dan siap rilis** apabila:
1. Seluruh item AC-01 s.d. AC-18 lolos pengujian UAT tanpa *blocker/critical bug*.
2. Integrasi LDAP tervalidasi pada environment staging dengan minimal 3 akun uji lintas role.
3. Tidak ada kerentanan keamanan kritikal (OWASP Top 10 dasar) pada modul Autentikasi dan Upload File.
4. Dokumentasi API (endpoint list minimal) tersedia untuk keperluan maintenance pasca-rilis.

---

*Dokumen ini adalah PRD versi 1.0 untuk Fase MVP (2 minggu). Fitur pada Bagian 3.2 (Out-of-Scope) akan dievaluasi kembali untuk roadmap Fase 2 berdasarkan hasil evaluasi MVP dan feedback pengguna.*
