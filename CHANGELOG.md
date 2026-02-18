# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/).

---

## [3.0.0] - 2025-06-XX

### Arsitektur Baru — Multi-Tenant SaaS

#### Multi-Tenancy
- Arsitektur **shared database, shared schema** multi-tenancy
- Setiap sekolah (tenant) diidentifikasi oleh `schoolId` di semua tabel tenant-level
- Model `School` sebagai entitas tenant utama dengan relasi ke `Tier`
- Semua query database pada tenant-level difilter berdasarkan `schoolId` dari session
- **46 API route files** diaudit dan dipastikan memiliki filter `schoolId` yang benar (~25 route diperbaiki)

#### Portal SuperAdmin (Platform-Level)
- Login terpisah di `/superadmin/login` dengan model `SuperAdmin`
- **Dashboard Platform** — statistik total sekolah, user, guru, siswa di seluruh platform
- **Kelola Sekolah** — CRUD sekolah (tenant), assign tier, aktivasi/nonaktifkan
- **Kelola Tier** — CRUD paket langganan dengan limit resource dan feature flags
- **Notifikasi Platform** — kirim notifikasi ke sekolah tertentu atau semua sekolah
- **Broadcast Email** — kirim email massal ke sekolah via SMTP
- **Landing Media** — kelola gambar/media untuk halaman landing page
- **Pengaturan SMTP** — konfigurasi SMTP server untuk email (host, port, user, pass)
- Layout dan navigasi SuperAdmin terpisah dari tenant

#### Sistem Tier / Langganan
- 5 tier: Trial, Starter, Basic, Professional, Enterprise
- Limit resource per tier: maxSiswa, maxGuru, maxKelas, maxMapel, maxUjian, maxStorage
- Feature flags per tier (JSON): aiChatbot, documentParsing, advancedAnalytics, dll
- Tier limit enforcement di `src/lib/tier-limits.ts`
- Public API `/api/public/tiers` untuk halaman pricing

#### Landing Page
- Halaman marketing publik di `/landing`
- Hero section, fitur showcase, pricing/tier, testimonial, FAQ, contact (WhatsApp)
- Media gambar dinamis dikelola oleh SuperAdmin via Landing Media
- Responsive design

### Fitur Baru

#### Sistem Notifikasi Platform
- Model `PlatformNotification` dengan type (info, warning, update, maintenance, promo) dan priority (urgent, high, normal, low)
- Komponen `notification-bell.tsx` — real-time notification bell dengan badge count
- Dropdown list notifikasi dengan tipe & prioritas
- Mark as read per notifikasi
- Model `FailedNotification` untuk logging notifikasi gagal
- API endpoints: GET `/api/notifications`, PUT `/api/notifications/[id]/read`

#### Broadcast Email
- SuperAdmin dapat mengirim email massal ke sekolah tertentu atau semua sekolah
- Subject + body (HTML) via SMTP (Nodemailer)
- Konfigurasi SMTP dari database (model `SmtpConfig`)
- History tersimpan di model `BroadcastEmail`

#### Password Reset Flow
- Halaman `/forgot-password` untuk input email
- API: POST `/api/password-reset/request` — generate token, kirim email
- Model `PasswordResetToken` dengan expiry (1 jam) dan status used
- Halaman `/reset-password?token=xxx` untuk input password baru
- API: POST `/api/password-reset/reset` — validasi token, update password
- Email dikirim via SMTP menggunakan `SmtpConfig` dari database

#### Profile Photo
- Upload foto profil dari file atau webcam
- Crop menggunakan `react-image-crop`
- Simpan ke Cloudflare R2 / AWS S3
- Field `profilePhoto` pada model `User`
- API endpoint: POST `/api/profile-photo`

#### Cron Jobs
- `/api/cron/auto-alpha` — otomatis set status "alpha" untuk siswa yang tidak presensi
- Dijalankan per sekolah (multi-tenant aware)
- Autentikasi via `CRON_SECRET`

### Perbaikan

#### Tenant Isolation Audit
- Audit komprehensif terhadap 46 API route files
- ~25 route diperbaiki dengan penambahan filter `schoolId` di WHERE clause
- Route yang diperbaiki termasuk: siswa, guru, kelas, mapel, dashboard stats/activities, presensi, materi, kartu-pelajar, sekolah-info, info-masuk, admin/ujian-access, admin/siswa/import, guru/nilai, guru/tugas/[id], guru/ujian/[id]/nilai, presensi/scan, presensi/auto-alpha, siswa/ujian, siswa/tugas, siswa/materi
- Route yang sudah benar (menggunakan guruId/siswaId dari session): guru/ujian, guru/tugas, guru/materi, guru/jadwal, guru/dashboard, siswa/raport

### Database

#### Model Baru
- `School` — tenant (sekolah) dengan name, domain, isActive, tierId
- `SuperAdmin` — akun platform admin
- `Tier` — paket langganan dengan limit resource dan feature flags
- `SmtpConfig` — konfigurasi SMTP server
- `PlatformNotification` — notifikasi platform dengan type dan priority
- `BroadcastEmail` — email massal dengan subject, body, targetSchoolIds
- `PasswordResetToken` — token reset password dengan expiry
- `LandingMedia` — media landing page dengan title, imageUrl, order
- `FailedNotification` — log notifikasi gagal

#### Perubahan Model
- `User` — ditambahkan field `schoolId` (tenant isolation) dan `profilePhoto`
- `Guru`, `Siswa`, `Kelas`, `MataPelajaran`, `Ujian`, `Tugas`, `Materi` — ditambahkan field `schoolId`
- `UjianAccessControl`, `SekolahInfo`, `InfoMasuk`, `Jadwal` — ditambahkan field `schoolId`
- Session data ditambahkan `schoolId` untuk tenant filtering

---

## [2.3.0] - 2025-02-13

### Fitur Baru

#### Print PDF Soal Ujian
- Halaman print khusus di `/guru/ujian/[id]/print` untuk mencetak soal ujian
- Layout A4 profesional dengan header sekolah, info ujian, dan kolom identitas siswa
- Opsi toggle: tampilkan/sembunyikan kunci jawaban
- Opsi toggle: tampilkan/sembunyikan header & info
- Soal dikelompokkan berdasarkan tipe (PG, Essay, Isian Singkat, Pencocokan, Benar/Salah)
- Mendukung semua 5 tipe soal dengan format cetak yang sesuai
- Tombol "Print" ditambahkan di halaman detail ujian guru

#### Connecting Lines pada Soal Pencocokan
- Garis SVG melengkung (bezier curve) menghubungkan pasangan yang sudah dicocokkan
- 8 warna berbeda untuk setiap pasangan agar mudah dibedakan
- Efek glow dan titik (dot) di ujung garis
- Border dan background item berubah sesuai warna pasangannya
- Responsif — garis dihitung ulang otomatis saat window di-resize

### Perbaikan

#### Sistem Penilaian (Scoring)
- **Penilaian Essay**: Range nilai berubah dari 0-100 menjadi 0-{poin soal}
  - Jika soal essay poinnya 20, guru memberi nilai 0-20 (bukan 0-100)
  - Nilai yang diberikan langsung menjadi poin yang didapat
- **Perhitungan Total Nilai**: Dihapus rumus persentase `(earned/total)*100`
  - Total poin per ujian = 100 (guru yang mengatur distribusi)
  - Nilai akhir = jumlah langsung semua poin yang didapat
  - Contoh: auto 80 + essay 15 = **95** (bukan persentase)
- **Validasi 100 Poin**: Ujian tidak bisa dipublikasikan jika total poin ≠ 100
  - Indikator visual merah/hijau di halaman edit soal
  - Pesan error saat publish jika total poin belum tepat 100
- File yang diperbaiki:
  - `api/guru/ujian/[id]/nilai/route.ts` — calculateScore
  - `api/guru/ujian/[id]/nilai/recalculate/route.ts` — recalculate
  - `api/siswa/ujian/[id]/submit/route.ts` — finalScore
  - `api/siswa/ujian/[id]/submit-enhanced/route.ts` — finalScore
  - `guru/ujian/[id]/nilai/page.tsx` — input range essay
  - `guru/ujian/[id]/edit/page.tsx` — validasi 100 poin
  - `siswa/ujian/[id]/hasil/page.tsx` — tampilan nilai essay X/poin

#### Manajemen Siswa
- **Unique Constraint NIS**: Ditambahkan pengecekan duplikat NIS/NISN sebelum create
- **Simplifikasi Form**: Email dihapus dari form siswa (auto-generate dari NIS)
- **Field Opsional**: `email`, `alamat`, `namaWali`, `noTelpWali`, `tanggalLahir` menjadi optional
- **Login Fleksibel**: Siswa bisa login menggunakan NISN atau NIS
- **Import Excel**: Email tidak lagi wajib di file Excel, auto-generate dari NIS

#### Penilaian Essay (Bug Fix)
- Fix double-wrapping jawaban essay di submit route
- Fix tampilan jawaban essay kosong di halaman hasil
- Handle legacy data format `{ jawaban: { jawaban: "text" } }`

## [2.2.0] - Sebelumnya

### Fitur
- Sistem ujian online dengan 5 tipe soal
- Auto-grading untuk PG, Isian Singkat, Benar/Salah, Pencocokan
- Manual grading untuk Essay
- Token ujian untuk keamanan akses
- Dashboard interaktif untuk Admin, Guru, dan Siswa
- Manajemen tugas dengan upload file
- Raport digital per semester
- Presensi dengan QR Code
- Kartu pelajar digital
- Tema light/dark mode
