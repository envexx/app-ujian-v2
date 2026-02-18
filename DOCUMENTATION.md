# E-Learning Platform — Dokumentasi Teknis Lengkap

## Platform Manajemen Pembelajaran & Ujian Online Berbasis AI — Multi-Tenant SaaS

---

## Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Arsitektur Multi-Tenancy](#4-arsitektur-multi-tenancy)
5. [Fitur Lengkap](#5-fitur-lengkap)
6. [Struktur Database](#6-struktur-database)
7. [Struktur Folder](#7-struktur-folder)
8. [API Endpoints](#8-api-endpoints)
9. [Sistem Ujian & Soal Multi-Type](#9-sistem-ujian--soal-multi-type)
10. [AI Chatbot Assistant](#10-ai-chatbot-assistant)
11. [Sistem Autentikasi & Otorisasi](#11-sistem-autentikasi--otorisasi)
12. [Sistem Tier & Langganan](#12-sistem-tier--langganan)
13. [Sistem Notifikasi](#13-sistem-notifikasi)
14. [Fitur Platform](#14-fitur-platform)
15. [Deployment](#15-deployment)
16. [Environment Variables](#16-environment-variables)
17. [Cara Menjalankan](#17-cara-menjalankan)

---

## 1. Ringkasan Proyek

**E-Learning Platform** adalah sistem manajemen pembelajaran (LMS) berbasis web **multi-tenant** yang dirancang khusus untuk sekolah menengah di Indonesia. Platform ini menghubungkan empat peran utama — **SuperAdmin** (platform), **Admin** (sekolah), **Guru**, dan **Siswa** — dalam satu ekosistem digital yang terintegrasi dengan arsitektur SaaS.

### Keunggulan Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Multi-Tenant SaaS** | Arsitektur multi-tenancy dengan isolasi data penuh per sekolah, dikelola oleh SuperAdmin |
| **Sistem Tier/Langganan** | Paket langganan (Trial → Enterprise) dengan limit resource per tier |
| **Ujian Online Multi-Type (CBT)** | 5 tipe soal: Pilihan Ganda, Essay, Isian Singkat, Benar/Salah, Pencocokan (Matching) |
| **AI-Powered Assistant** | Chatbot AI (Claude Sonnet 4) untuk generate ujian + soal otomatis dari natural language |
| **Auto-Grading** | Penilaian otomatis untuk soal objektif (PG, Isian Singkat, Benar/Salah, Pencocokan partial) |
| **Rich Text Editor** | TipTap 3 dengan gambar, rumus matematika (KaTeX/MathJax), formatting lengkap |
| **Token-Based Exam Access** | Token 6-digit (expires 2 menit) yang dikontrol admin untuk akses ujian |
| **Platform Notifikasi** | Notification bell real-time + broadcast email dari SuperAdmin ke sekolah |
| **Password Reset** | Forgot password flow via email token (SMTP) |
| **Landing Page** | Halaman marketing dengan fitur, harga, testimonial, FAQ |
| **Real-time Dashboard** | Dashboard analitik untuk setiap peran dengan statistik dan grafik |
| **Responsive Design** | Mobile-friendly, bisa diakses dari desktop dan mobile |
| **Docker-Ready** | Siap deploy ke production dengan Docker, Coolify, atau Vercel |

### Target Pengguna

- **Sekolah Menengah Pertama (SMP)** dan **Sekolah Menengah Atas (SMA)** di Indonesia
- Mendukung kurikulum Indonesia dengan bahasa Indonesia sebagai bahasa utama
- Model bisnis SaaS — satu platform melayani banyak sekolah

---

## 2. Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.x | Framework React full-stack dengan App Router |
| **React** | 19.x | UI library dengan React Compiler enabled |
| **TypeScript** | 5.9 | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Radix UI** | Latest | Headless UI primitives (60+ komponen) |
| **Lucide React** | Latest | Icon library |
| **TipTap** | 3.x | Rich text editor (WYSIWYG) dengan 39 UI components dan 12 custom nodes |
| **Recharts** | 2.x | Charting library untuk dashboard |
| **React Hook Form** | 7.x | Form management |
| **Zod** | 3.x | Schema validation |
| **TanStack Table** | 8.x | Data table dengan sorting, filtering, pagination |
| **TanStack Query** | 5.x | Server state management |
| **SWR** | 2.x | Data fetching & caching |
| **Zustand** | 5.x | Client state management (preferences store) |
| **dnd-kit** | Latest | Drag & drop untuk reorder soal |
| **Embla Carousel** | 8.x | Carousel component |
| **KaTeX / MathJax** | Latest | Rendering rumus matematika |
| **next-themes** | Latest | Dark/light mode |
| **Sonner** | 2.x | Toast notifications |
| **cmdk** | Latest | Command palette |
| **date-fns** | 3.x | Date manipulation & timezone |
| **react-image-crop** | 11.x | Image cropping untuk profile photo |
| **react-webcam** | 7.x | Webcam capture |
| **html-to-image** | Latest | HTML to image conversion |
| **jsQR** | Latest | QR code scanning |
| **qrcode** | Latest | QR code generation |
| **xlsx** | Latest | Excel file parsing (import siswa/guru) |

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js API Routes** | 16.x | RESTful API endpoints (App Router) |
| **Prisma ORM** | 6.x | Database ORM dengan type-safe queries + driver adapters |
| **PostgreSQL** | Latest | Primary database |
| **Neon Database** | Latest | Serverless PostgreSQL adapter |
| **iron-session** | 8.x | Encrypted cookie-based session (rolling 8 jam) |
| **bcryptjs** | 3.x | Password hashing |
| **jose** | 6.x | JWT token handling |
| **Nodemailer** | 8.x | Email sending via SMTP (password reset, broadcast) |
| **Axios** | 1.x | HTTP client untuk API calls |
| **Mammoth** | Latest | Word document parser |
| **JSZip** | Latest | ZIP file handling |

### AI & Cloud Services

| Teknologi | Fungsi |
|-----------|--------|
| **Anthropic Claude Sonnet 4** | AI utama untuk generate soal, chatbot assistant, dan document parsing |
| **Groq (Llama 3.3 70B)** | AI alternatif/fallback |
| **Cloudflare R2 / AWS S3** | Object storage untuk file upload (materi, tugas, foto) |

### DevOps & Tooling

| Teknologi | Fungsi |
|-----------|--------|
| **Docker** | Containerization (multi-stage build) |
| **Coolify** | Self-hosted deployment platform |
| **Vercel** | Cloud deployment |
| **Biome** | Linter & formatter (pengganti ESLint + Prettier) |
| **Nixpacks** | Alternative build system |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│                                                              │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │SuperAdmin │ │  Admin   │ │   Guru   │ │  Siswa   │      │
│  │ Portal    │ │Dashboard │ │Dashboard │ │Dashboard │      │
│  └─────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│        │             │             │             │            │
│  ┌─────┴─────────────┴─────────────┴─────────────┘           │
│  │                                                           │
│  │  Landing Page │ Login Pages │ Reset Password              │
│  │  Notification Bell │ AI Chat Bubble │ Profile Photo       │
│  │  TipTap Editor │ Recharts │ dnd-kit │ Data Tables         │
│  └───────────────────────────┬───────────────────────────────┘
└──────────────────────────────┼───────────────────────────────┘
                               │ HTTP/REST
┌──────────────────────────────┴───────────────────────────────┐
│                       NEXT.JS SERVER                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                 API Routes (/api/*)                       │ │
│  │                                                          │ │
│  │  /api/auth/*           → Authentication & Sessions       │ │
│  │  /api/superadmin/*     → Platform management             │ │
│  │  /api/admin/*          → School admin operations         │ │
│  │  /api/guru/*           → Teacher operations              │ │
│  │  /api/siswa/*          → Student operations              │ │
│  │  /api/guru/ai-chatbot  → AI Chatbot endpoint             │ │
│  │  /api/upload/*         → File upload (R2/S3)             │ │
│  │  /api/word/*           → Document parsing (Claude/Mammoth)│ │
│  │  /api/notifications/*  → Platform notifications          │ │
│  │  /api/whatsapp/*       → WhatsApp notifications          │ │
│  │  /api/cron/*           → Scheduled tasks                 │ │
│  │  /api/public/*         → Public APIs (landing, tiers)    │ │
│  └───────────┬──────────────────────────┬───────────────────┘ │
│              │                          │                     │
│  ┌───────────┴──────────┐  ┌───────────┴──────────────────┐  │
│  │    Prisma ORM        │  │    Service Layer             │  │
│  │  (Type-safe DB)      │  │  ├─ AI Service (Anthropic)   │  │
│  │  + Tenant Isolation  │  │  ├─ Email Service (SMTP)     │  │
│  │  (schoolId filter)   │  │  ├─ Tier Limits Checker      │  │
│  │                      │  │  ├─ Rate Limiter             │  │
│  └───────────┬──────────┘  │  └─ WhatsApp Queue           │  │
│              │             └───────────┬──────────────────┘  │
└──────────────┼─────────────────────────┼─────────────────────┘
               │                         │
     ┌─────────┴─────────┐    ┌─────────┴──────────┐
     │   PostgreSQL DB   │    │  External Services  │
     │                   │    │                     │
     │  Platform-level:  │    │  • Anthropic Claude │
     │  - Schools        │    │  • Groq Llama       │
     │  - SuperAdmins    │    │  • SMTP Server      │
     │  - Tiers          │    │  • WhatsApp API     │
     │  - Notifications  │    └─────────────────────┘
     │  - SMTP Config    │
     │                   │    ┌─────────────────────┐
     │  Tenant-level:    │    │  Object Storage     │
     │  - Users          │    │  (Cloudflare R2     │
     │  - Guru/Siswa     │    │   / AWS S3)         │
     │  - Ujian/Soal     │    └─────────────────────┘
     │  - Submissions    │
     │  - Presensi       │
     │  - Materi/Tugas   │
     └───────────────────┘
```

### Request Flow

```
User Action → React Component → API Route → Session Check → Tenant Filter (schoolId)
                                                 ↓
                                           Prisma Query → PostgreSQL
                                                 ↓
                                           AI Service (jika perlu) → Anthropic/Groq API
                                                 ↓
                                           Response → Client Update (SWR revalidate)
```

---

## 4. Arsitektur Multi-Tenancy

### Konsep

Platform menggunakan **shared database, shared schema** multi-tenancy. Setiap sekolah (tenant) diidentifikasi oleh `schoolId` yang ada di hampir semua tabel.

```
┌─────────────────────────────────────────────────────────┐
│                    SUPERADMIN PORTAL                      │
│  (Platform-level: kelola sekolah, tier, notifikasi)      │
└─────────────────────┬───────────────────────────────────┘
                      │ manages
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ School A │  │ School B │  │ School C │   ← Tenant
  │ Tier:Pro │  │Tier:Basic│  │Tier:Trial│
  │          │  │          │  │          │
  │ • Admin  │  │ • Admin  │  │ • Admin  │
  │ • 50 Guru│  │ • 25 Guru│  │ • 5 Guru │
  │ • 1000   │  │ • 300    │  │ • 50     │
  │   Siswa  │  │   Siswa  │  │   Siswa  │
  └──────────┘  └──────────┘  └──────────┘
       ↑              ↑              ↑
       └──────────────┴──────────────┘
              Data terisolasi penuh
              (schoolId filter)
```

### Tenant Isolation

Semua query database pada tenant-level difilter berdasarkan `schoolId` dari session:

```typescript
// Contoh: GET /api/siswa
const session = await getSession();
const siswa = await prisma.siswa.findMany({
  where: { schoolId: session.schoolId }, // ← Tenant filter
});
```

**46 API route files** telah diaudit dan dipastikan memiliki filter `schoolId` yang benar.

### Model yang Terikat Tenant (schoolId)

`User`, `Guru`, `Siswa`, `Kelas`, `MataPelajaran`, `Jadwal`, `InfoMasuk`, `Ujian`, `Tugas`, `Materi`, `UjianAccessControl`, `SekolahInfo`

### Model Platform-Level (tanpa schoolId)

`School`, `SuperAdmin`, `Tier`, `SmtpConfig`, `PlatformNotification`, `BroadcastEmail`, `PasswordResetToken`, `LandingMedia`

---

## 5. Fitur Lengkap

### 5.0 Portal SuperAdmin (Platform-Level)

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Platform** | Statistik total sekolah, user, guru, siswa di seluruh platform |
| **Kelola Sekolah** | CRUD sekolah (tenant), assign tier, aktivasi/nonaktifkan |
| **Kelola Tier** | CRUD paket langganan dengan limit resource dan feature flags |
| **Notifikasi Platform** | Kirim notifikasi ke sekolah tertentu atau semua sekolah |
| **Broadcast Email** | Kirim email massal ke sekolah via SMTP |
| **Landing Media** | Kelola gambar/media untuk halaman landing page |
| **Pengaturan SMTP** | Konfigurasi SMTP server untuk email (host, port, user, pass) |

### 5.1 Panel Admin (School-Level)

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Analitik** | Statistik sekolah (jumlah guru, siswa, kelas, ujian) dengan grafik |
| **Manajemen Guru** | CRUD data guru, assign mata pelajaran & kelas, import dari Excel |
| **Manajemen Siswa** | CRUD data siswa, assign ke kelas, import dari Excel |
| **Manajemen Kelas** | CRUD kelas, set wali kelas, tingkat |
| **Manajemen Mata Pelajaran** | CRUD mapel dengan kode unik, jenis, jam per minggu |
| **Token Ujian** | Generate & kelola token 6-digit (expires 2 menit) untuk akses ujian |
| **Presensi** | Kelola presensi siswa (hadir, izin, sakit, alpha) dengan QR scan |
| **Kartu Pelajar** | Generate kartu pelajar digital dengan QR code |
| **Info Masuk/Pulang** | Konfigurasi jam masuk & pulang per hari |
| **Pengaturan Sekolah** | Informasi sekolah, logo, kepala sekolah, tahun ajaran |
| **Notification Bell** | Terima notifikasi dari SuperAdmin (info, warning, update, maintenance, promo) |
| **Profile Photo** | Upload dan crop foto profil |

### 5.2 Panel Guru

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Statistik personal (jumlah ujian, siswa, tugas, rata-rata nilai) |
| **Manajemen Ujian** | Buat, edit, hapus ujian dengan status draft/aktif/selesai |
| **Editor Soal Multi-Type** | Buat soal dengan 5 tipe berbeda menggunakan rich text editor (TipTap 3) |
| **Drag & Drop Soal** | Reorder soal dengan drag & drop (dnd-kit) |
| **AI Chatbot Assistant** | Chatbot AI floating bubble (Claude Sonnet 4) untuk generate ujian + soal otomatis |
| **Penilaian Ujian** | Lihat submission siswa, auto-grade soal objektif, manual grade essay |
| **Manajemen Tugas** | Buat tugas dengan deadline, review submission siswa |
| **Manajemen Materi** | Upload materi pembelajaran (PDF, video, gambar, link) ke R2/S3 |
| **Jadwal Mengajar** | Lihat jadwal mengajar per hari |
| **Konfigurasi Nilai** | Set bobot penilaian (PG vs Essay), konfigurasi per guru |
| **Print Ujian PDF** | Cetak ujian ke format PDF printable |
| **Import Soal dari Word/PDF** | Parse dokumen Word/PDF menggunakan AI (Claude) untuk extract soal |
| **Connecting Lines (Pencocokan)** | Visual connecting lines untuk soal pencocokan |
| **Notification Bell** | Terima notifikasi platform |
| **Profile Photo** | Upload dan crop foto profil |

### 5.3 Panel Siswa

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Statistik personal (ujian mendatang, tugas pending, rata-rata nilai) |
| **Mengerjakan Ujian (CBT)** | Interface ujian online dengan timer, navigasi soal, auto-save jawaban |
| **Token Verification** | Input token 6-digit sebelum akses ujian |
| **Lihat Hasil Ujian** | Review jawaban, lihat skor per soal, feedback guru |
| **Mengerjakan Tugas** | Submit tugas via file upload atau link |
| **Akses Materi** | Lihat dan download materi pembelajaran |
| **Raport** | Lihat rekap nilai per mata pelajaran |
| **Notification Bell** | Terima notifikasi platform |

### 5.4 AI Chatbot (Guru Only)

| Fitur | Deskripsi |
|-------|-----------|
| **Natural Language Command** | Guru bisa perintah dalam bahasa Indonesia biasa |
| **Buat Ujian Otomatis** | "Buatkan ujian MID Bahasa Indonesia tanggal 20 Maret" |
| **Generate Soal Multi-Type** | "Buatkan 25 soal: 15 PG, 4 Essay, 3 Pencocokan, 3 B/S" |
| **Buat Ujian + Soal Sekaligus** | Satu perintah untuk buat ujian dan generate semua soal (CREATE_EXAM_WITH_QUESTIONS) |
| **Distribusi Kesulitan** | Support pembagian mudah/medium/sulit |
| **Bobot Otomatis** | Total poin otomatis dikoreksi ke 100 (`validateAndFixSoalPoin()`) |
| **Context-Aware** | AI tahu mapel, kelas, dan ujian yang sudah ada |
| **Confirmation Flow** | Selalu konfirmasi sebelum eksekusi aksi |
| **Auto-Refresh** | Dashboard otomatis update setelah AI buat ujian/soal |
| **Dual Provider** | Anthropic Claude Sonnet 4 (utama) + Groq Llama 3.3 70B (fallback) |

### 5.5 Landing Page (Public)

| Fitur | Deskripsi |
|-------|-----------|
| **Hero Section** | Headline, deskripsi, CTA buttons |
| **Fitur Showcase** | Tampilkan fitur utama platform (AI, presensi, analitik) |
| **Pricing/Tier** | Tampilkan paket langganan dari API `/api/public/tiers` |
| **Testimonial** | Testimonial pengguna |
| **FAQ** | Pertanyaan yang sering diajukan |
| **Contact** | WhatsApp link untuk kontak |
| **Dynamic Media** | Gambar/media dikelola oleh SuperAdmin via Landing Media |

### 5.6 Fitur Platform-Wide

| Fitur | Deskripsi |
|-------|-----------|
| **Password Reset** | Forgot password → email token → reset password page |
| **Profile Photo** | Upload, crop (react-image-crop), simpan ke R2/S3 |
| **Dark/Light Mode** | Toggle tema via next-themes |
| **Responsive Design** | Mobile-friendly layout |
| **Notification Bell** | Real-time notification bell dengan badge count, tipe & prioritas |
| **Cron Jobs** | Auto-alpha presensi, scheduled tasks via `/api/cron/*` |

---

## 6. Struktur Database

### Entity Relationship

```
── Platform Level ──
SuperAdmin (standalone)
School (1) ──── (1) Tier
School (1) ──── (N) User
School (1) ──── (N) PlatformNotification [target]
SmtpConfig (standalone, platform-wide)
BroadcastEmail (standalone)
LandingMedia (standalone)
PasswordResetToken (standalone)

── Tenant Level (per School) ──
User (1) ──── (0..1) Guru
User (1) ──── (0..1) Siswa

Guru (M) ──── (N) MataPelajaran    [via GuruMapel]
Guru (M) ──── (N) Kelas            [via GuruKelas]
Guru (1) ──── (N) Ujian
Guru (1) ──── (N) Tugas
Guru (1) ──── (N) Materi
Guru (1) ──── (0..1) GradeConfig

Kelas (1) ──── (N) Siswa
Kelas (0..1) ── (1) Guru             [Wali Kelas]

Ujian (1) ──── (N) Soal
Ujian (1) ──── (N) UjianSubmission
Ujian (M) ──── (1) MataPelajaran

Soal (1) ──── (N) JawabanSoal

UjianSubmission (1) ──── (N) JawabanSoal
UjianSubmission (M) ──── (1) Siswa

Tugas (1) ──── (N) TugasSubmission
TugasSubmission (M) ──── (1) Siswa

Siswa (1) ──── (N) Presensi
Siswa (1) ──── (0..1) KartuPelajar
```

### Model Platform-Level

| Model | Deskripsi | Fields Penting |
|-------|-----------|----------------|
| **SuperAdmin** | Akun platform admin | email, password (bcrypt), name |
| **School** | Tenant (sekolah) | name, domain, isActive, tierId, createdAt |
| **Tier** | Paket langganan | name, maxSiswa, maxGuru, maxKelas, maxMapel, maxUjian, maxStorage, features (JSON) |
| **SmtpConfig** | Konfigurasi SMTP | host, port, user, pass, fromEmail, fromName |
| **PlatformNotification** | Notifikasi platform | title, message, type, priority, targetSchoolId (null = semua) |
| **BroadcastEmail** | Email massal | subject, body, targetSchoolIds, status, sentAt |
| **PasswordResetToken** | Token reset password | email, token, expiresAt, used |
| **LandingMedia** | Media landing page | title, imageUrl, description, order |
| **FailedNotification** | Log notifikasi gagal | notificationId, schoolId, error |

### Model Tenant-Level

| Model | Deskripsi | Fields Penting |
|-------|-----------|----------------|
| **User** | Akun login | email, password (bcrypt), role (ADMIN/GURU/SISWA), schoolId, profilePhoto |
| **Guru** | Data guru | nipUsername, nama, email, mapel[], kelas[], schoolId |
| **Siswa** | Data siswa | nisn, nis, nama, kelasId, tanggalLahir, schoolId |
| **Kelas** | Data kelas | nama (7A, 8B, dll), tingkat, waliKelasId, schoolId |
| **MataPelajaran** | Mata pelajaran | nama, kode, jenis, jamPerMinggu, schoolId |
| **Ujian** | Data ujian | judul, mapelId, kelas[], startUjian, endUjian, status, schoolId |
| **Soal** | Soal ujian | ujianId, tipe, urutan, pertanyaan, poin, data (JSON) |
| **JawabanSoal** | Jawaban siswa | submissionId, soalId, jawaban (JSON), nilai, isCorrect |
| **UjianSubmission** | Submission ujian | ujianId, siswaId, startedAt, submittedAt, nilai, status |
| **Tugas** | Data tugas | judul, instruksi, mapelId, kelas[], deadline, schoolId |
| **TugasSubmission** | Submission tugas | tugasId, siswaId, fileUrl, nilai, feedback |
| **Materi** | Materi pembelajaran | judul, mapelId, kelas[], tipe, fileUrl, schoolId |
| **Presensi** | Data presensi | siswaId, tanggal, status, tipe (masuk/pulang) |
| **SekolahInfo** | Info sekolah | namaSekolah, alamat, namaKepsek, tahunAjaran, schoolId |
| **UjianAccessControl** | Token ujian | isActive, currentToken, tokenExpiresAt, schoolId |
| **GradeConfig** | Konfigurasi nilai | bobotPG, bobotEssay, activePG, activeEssay |

### Soal Data Structure (JSON)

Setiap soal menyimpan data spesifik per tipe dalam field `data` (PostgreSQL JSONB):

**Pilihan Ganda:**
```json
{
  "opsi": [
    {"label": "A", "text": "Jawaban A"},
    {"label": "B", "text": "Jawaban B"},
    {"label": "C", "text": "Jawaban C"},
    {"label": "D", "text": "Jawaban D"}
  ],
  "kunciJawaban": "A"
}
```

**Essay:**
```json
{
  "kunciJawaban": "Jawaban referensi untuk essay",
  "minKata": 50,
  "maxKata": 200
}
```

**Isian Singkat:**
```json
{
  "kunciJawaban": ["jawaban1", "jawaban2"],
  "caseSensitive": false
}
```

**Benar/Salah:**
```json
{
  "kunciJawaban": true
}
```

**Pencocokan:**
```json
{
  "itemKiri": [{"id": "k1", "text": "Item kiri 1"}],
  "itemKanan": [{"id": "n1", "text": "Item kanan 1"}],
  "jawaban": {"k1": "n1"}
}
```

---

## 7. Struktur Folder

```
e-learning/
├── prisma/
│   ├── schema.prisma          # Database schema (25+ models)
│   ├── seed.ts                # Database seeder (school, admin, guru, siswa, superadmin)
│   ├── seed-info-masuk.ts     # Seeder info masuk/pulang
│   └── seed-dummy-ujian.ts    # Seeder dummy ujian
│
├── public/                    # Static assets (images, icons)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (providers, fonts)
│   │   ├── page.tsx           # Siswa login page
│   │   ├── globals.css        # Global styles (Tailwind)
│   │   │
│   │   ├── landing/           # Public landing page
│   │   │   └── page.tsx       # Marketing page (fitur, harga, FAQ)
│   │   │
│   │   ├── login/             # Admin/Guru login page
│   │   │
│   │   ├── superadmin/        # SuperAdmin portal
│   │   │   ├── page.tsx       # SuperAdmin dashboard
│   │   │   ├── layout.tsx     # SuperAdmin layout + navigation
│   │   │   ├── login/         # SuperAdmin login
│   │   │   ├── schools/       # Kelola sekolah (CRUD tenant)
│   │   │   ├── tiers/         # Kelola tier/langganan
│   │   │   ├── notifications/ # Kirim notifikasi platform
│   │   │   ├── broadcast/     # Broadcast email
│   │   │   ├── landing-media/ # Kelola media landing page
│   │   │   └── settings/      # Pengaturan platform (SMTP)
│   │   │
│   │   ├── forgot-password/   # Forgot password page
│   │   │   └── page.tsx
│   │   │
│   │   ├── reset-password/    # Reset password page (via token)
│   │   │   └── page.tsx
│   │   │
│   │   ├── (main)/            # Authenticated routes (tenant-scoped)
│   │   │   ├── admin/         # Admin panel (school-level)
│   │   │   │   ├── page.tsx           # Admin dashboard
│   │   │   │   ├── guru/              # Manajemen guru
│   │   │   │   ├── siswa/             # Manajemen siswa
│   │   │   │   ├── kelas/             # Manajemen kelas
│   │   │   │   ├── mapel/             # Manajemen mapel
│   │   │   │   ├── presensi/          # Presensi + QR scan
│   │   │   │   ├── kartu-pelajar/     # Kartu pelajar digital
│   │   │   │   ├── token-ujian/       # Token ujian management
│   │   │   │   ├── info-masuk/        # Jam masuk/pulang
│   │   │   │   └── settings/          # Pengaturan sekolah
│   │   │   │
│   │   │   ├── guru/          # Guru panel
│   │   │   │   ├── page.tsx           # Guru dashboard
│   │   │   │   ├── layout.tsx         # Guru layout (+ AI Chat Bubble)
│   │   │   │   ├── ujian/             # Manajemen ujian
│   │   │   │   │   ├── page.tsx       # List ujian
│   │   │   │   │   ├── create/        # Buat ujian baru
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx   # Detail ujian
│   │   │   │   │       ├── edit/      # Edit ujian + soal
│   │   │   │   │       ├── nilai/     # Penilaian siswa
│   │   │   │   │       └── print/     # Cetak ujian (PDF)
│   │   │   │   ├── tugas/             # Manajemen tugas
│   │   │   │   ├── materi/            # Manajemen materi
│   │   │   │   ├── jadwal/            # Jadwal mengajar
│   │   │   │   ├── nilai/             # Rekap nilai
│   │   │   │   └── settings/          # Pengaturan guru
│   │   │   │
│   │   │   ├── siswa/         # Siswa panel
│   │   │   │   ├── page.tsx           # Siswa dashboard
│   │   │   │   ├── ujian/             # Ujian siswa
│   │   │   │   │   ├── page.tsx       # List ujian
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx   # Mengerjakan ujian
│   │   │   │   │       └── hasil/     # Hasil ujian
│   │   │   │   ├── tugas/             # Tugas siswa
│   │   │   │   ├── materi/            # Materi siswa
│   │   │   │   └── raport/            # Raport siswa
│   │   │   │
│   │   │   └── dashboard/     # Multi-layout dashboard
│   │   │
│   │   ├── api/               # API Routes (50+)
│   │   │   ├── auth/          # Login, logout, session
│   │   │   ├── superadmin/    # SuperAdmin APIs
│   │   │   │   ├── schools/       # CRUD sekolah
│   │   │   │   ├── tiers/         # CRUD tier
│   │   │   │   ├── notifications/ # Platform notifications
│   │   │   │   ├── broadcast/     # Broadcast email
│   │   │   │   ├── landing-media/ # Landing media CRUD
│   │   │   │   ├── smtp/          # SMTP config
│   │   │   │   └── stats/         # Platform statistics
│   │   │   ├── admin/         # Admin APIs (school-scoped)
│   │   │   ├── guru/          # Guru APIs
│   │   │   │   ├── ai-chatbot/    # AI chatbot endpoint
│   │   │   │   ├── ujian/         # CRUD ujian + soal
│   │   │   │   ├── tugas/         # CRUD tugas
│   │   │   │   ├── materi/        # CRUD materi
│   │   │   │   ├── nilai/         # Penilaian
│   │   │   │   ├── jadwal/        # Jadwal
│   │   │   │   └── submissions/   # Review submissions
│   │   │   ├── siswa/         # Siswa APIs
│   │   │   │   ├── ujian/         # Akses ujian
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── save-answer/     # Auto-save jawaban
│   │   │   │   │       ├── submit/          # Submit ujian
│   │   │   │   │       ├── submit-enhanced/ # Enhanced submit
│   │   │   │   │       ├── time-remaining/  # Sisa waktu
│   │   │   │   │       └── hasil/           # Hasil ujian
│   │   │   │   ├── tugas/         # Submit tugas
│   │   │   │   ├── raport/        # Data raport
│   │   │   │   └── dashboard/     # Dashboard data
│   │   │   ├── notifications/ # Notification APIs (fetch, mark read)
│   │   │   ├── password-reset/# Password reset APIs
│   │   │   ├── upload/        # File upload (S3/R2)
│   │   │   ├── profile-photo/ # Profile photo upload
│   │   │   ├── public/        # Public APIs (tiers, landing)
│   │   │   ├── word/          # Document parsing (Claude AI)
│   │   │   ├── whatsapp/      # WhatsApp notifications
│   │   │   └── cron/          # Scheduled tasks (auto-alpha, etc)
│   │   │
│   │   └── login/             # Admin/Guru login page
│   │
│   ├── components/
│   │   ├── ai-chatbot/        # AI chatbot floating bubble
│   │   │   └── chat-bubble.tsx
│   │   ├── notification-bell.tsx  # Notification bell component
│   │   ├── soal/              # Soal form components
│   │   │   ├── PilihanGandaForm.tsx
│   │   │   ├── EssayForm.tsx
│   │   │   ├── IsianSingkatForm.tsx
│   │   │   ├── BenarSalahForm.tsx
│   │   │   ├── PencocokanForm.tsx
│   │   │   ├── SoalItem.tsx
│   │   │   └── AddSoalDropdown.tsx
│   │   ├── tiptap/            # Rich text editor (39 UI + 12 nodes)
│   │   ├── data-table/        # Reusable data table
│   │   └── ui/                # 60+ UI components (Radix-based)
│   │
│   ├── lib/
│   │   ├── ai-chatbot.ts      # AI service (Anthropic + Groq)
│   │   ├── api-client.ts      # Axios API client
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── session.ts         # iron-session config (rolling 8h)
│   │   ├── email.ts           # SMTP email service (Nodemailer)
│   │   ├── tier-limits.ts     # Tier limit checker per school
│   │   ├── exam-queue.ts      # Exam processing queue
│   │   ├── rate-limit.ts      # API rate limiting
│   │   ├── redis.ts           # Redis client
│   │   ├── whatsapp-queue.ts  # WhatsApp notification queue
│   │   ├── wordParser.ts      # Word document parser
│   │   ├── tiptap-utils.ts    # TipTap editor utilities
│   │   ├── date-utils.ts      # Date helpers
│   │   └── utils.ts           # General utilities (cn, etc)
│   │
│   ├── hooks/                 # 14 custom React hooks
│   │   ├── useAuth.ts         # Authentication hook
│   │   ├── useSWR.ts          # SWR data fetching hooks
│   │   ├── use-mobile.ts      # Mobile detection
│   │   ├── use-tiptap-editor.ts
│   │   └── ...
│   │
│   ├── contexts/
│   │   └── auth-context.tsx   # Auth context provider
│   │
│   ├── stores/                # Zustand stores
│   ├── types/
│   │   └── soal.ts            # Soal type definitions
│   └── styles/                # Additional styles
│
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Docker Compose config
├── nixpacks.toml              # Nixpacks config
├── vercel.json                # Vercel config
├── biome.json                 # Biome linter config
├── tsconfig.json              # TypeScript config
├── next.config.mjs            # Next.js config
└── package.json               # Dependencies & scripts
```

---

## 8. API Endpoints

### Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login admin/guru (email + password) |
| POST | `/api/auth/siswa-login` | Login siswa (NISN + password) |
| POST | `/api/auth/logout` | Logout (destroy session) |
| GET | `/api/auth/session` | Get current session data |
| POST | `/api/auth/superadmin-login` | Login SuperAdmin |

### SuperAdmin (Platform-Level)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/superadmin/stats` | Platform statistics (total schools, users, etc.) |
| GET/POST | `/api/superadmin/schools` | List & create sekolah (tenant) |
| GET/PUT/DELETE | `/api/superadmin/schools/[id]` | CRUD sekolah by ID |
| GET/POST | `/api/superadmin/tiers` | List & create tier/langganan |
| GET/PUT/DELETE | `/api/superadmin/tiers/[id]` | CRUD tier by ID |
| GET/POST | `/api/superadmin/notifications` | List & create platform notifications |
| POST | `/api/superadmin/broadcast` | Send broadcast email |
| GET | `/api/superadmin/broadcast` | List broadcast history |
| GET/POST | `/api/superadmin/landing-media` | CRUD landing page media |
| GET/PUT | `/api/superadmin/smtp` | Get & update SMTP configuration |

### Admin (School-Level)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET/POST | `/api/admin/guru` | List & create guru |
| GET/PUT/DELETE | `/api/admin/guru/[id]` | CRUD guru by ID |
| GET/POST | `/api/admin/siswa` | List & create siswa |
| POST | `/api/admin/siswa/import` | Import siswa dari Excel |
| GET/PUT | `/api/admin/ujian-access` | Token ujian management |
| GET | `/api/kelas` | List kelas (schoolId filtered) |
| GET | `/api/mapel` | List mata pelajaran (schoolId filtered) |
| GET/POST | `/api/presensi` | Presensi management |
| POST | `/api/presensi/scan` | QR scan presensi |
| GET/POST | `/api/info-masuk` | Info masuk/pulang |
| GET/PUT | `/api/sekolah-info` | Info sekolah |
| GET | `/api/school/info` | School info public |

### Guru

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/guru` | Get guru profile |
| GET | `/api/guru/dashboard` | Dashboard statistics |
| GET/POST | `/api/guru/ujian` | List & create ujian |
| GET/PUT/DELETE | `/api/guru/ujian/[id]` | CRUD ujian by ID |
| GET/POST | `/api/guru/ujian/[id]/soal` | List & create soal |
| PUT/DELETE | `/api/guru/ujian/[id]/soal/[soalId]` | Update/delete soal |
| GET | `/api/guru/ujian/[id]/nilai` | Lihat nilai submission |
| PUT | `/api/guru/ujian/[id]/nilai/[submissionId]` | Grade submission |
| POST | `/api/guru/ai-chatbot` | AI chatbot interaction |
| GET/POST | `/api/guru/tugas` | CRUD tugas |
| GET/PUT/DELETE | `/api/guru/tugas/[id]` | CRUD tugas by ID |
| GET/POST | `/api/guru/materi` | CRUD materi |
| GET | `/api/guru/jadwal` | Jadwal mengajar |
| GET | `/api/guru/submissions` | Review submissions |
| GET/PUT | `/api/guru/settings/grade-config` | Konfigurasi nilai |

### Siswa

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/siswa` | Get siswa profile |
| GET | `/api/siswa/dashboard` | Dashboard statistics |
| GET | `/api/siswa/ujian` | List ujian tersedia (schoolId filtered) |
| GET | `/api/siswa/ujian/[id]` | Get ujian detail + soal |
| POST | `/api/siswa/ujian/[id]/save-answer` | Auto-save jawaban |
| POST | `/api/siswa/ujian/[id]/submit` | Submit ujian |
| POST | `/api/siswa/ujian/[id]/submit-enhanced` | Enhanced submit (with grading) |
| GET | `/api/siswa/ujian/[id]/time-remaining` | Sisa waktu ujian |
| GET | `/api/siswa/ujian/[id]/hasil` | Hasil ujian |
| POST | `/api/siswa/ujian/validate-token` | Validasi token ujian |
| GET | `/api/siswa/tugas` | List tugas (schoolId filtered) |
| GET/POST | `/api/siswa/tugas/[id]` | Detail & submit tugas |
| GET | `/api/siswa/materi` | List materi (schoolId filtered) |
| GET | `/api/siswa/raport` | Data raport |

### Notifications & Platform

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/notifications` | Get notifications for current user's school |
| PUT | `/api/notifications/[id]/read` | Mark notification as read |
| POST | `/api/password-reset/request` | Request password reset (send email) |
| POST | `/api/password-reset/reset` | Reset password with token |
| POST | `/api/profile-photo` | Upload profile photo |
| GET | `/api/public/tiers` | Get public tier/pricing info |
| GET | `/api/public/landing-media` | Get landing page media |

### Utility

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/upload/s3` | Upload file ke R2/S3 |
| POST | `/api/word/parse-claude` | Parse dokumen dengan AI |
| POST | `/api/whatsapp` | Kirim notifikasi WhatsApp |
| POST | `/api/cron/auto-alpha` | Cron: auto-alpha presensi (per school) |

---

## 9. Sistem Ujian & Soal Multi-Type

### Alur Ujian (End-to-End)

```
GURU                                    ADMIN                    SISWA
 │                                        │                        │
 ├─ Buat Ujian (draft)                    │                        │
 ├─ Tambah Soal (5 tipe)                 │                        │
 │   atau AI Generate Soal                │                        │
 ├─ Review & Edit Soal                    │                        │
 ├─ Aktifkan Ujian                        │                        │
 │                                        │                        │
 │                                  ├─ Generate Token 6-digit      │
 │                                  ├─ Bagikan Token ke Siswa      │
 │                                        │                        │
 │                                        │                  ├─ Input Token
 │                                        │                  ├─ Mulai Ujian
 │                                        │                  ├─ Jawab Soal
 │                                        │                  │   (auto-save)
 │                                        │                  ├─ Submit Ujian
 │                                        │                        │
 ├─ Auto-Grade (PG, Isian,               │                        │
 │   Benar/Salah, Pencocokan)             │                        │
 ├─ Manual Grade (Essay)                  │                        │
 ├─ Berikan Feedback                      │                        │
 │                                        │                  ├─ Lihat Hasil
 │                                        │                  ├─ Lihat Feedback
```

### 5 Tipe Soal

| Tipe | Auto-Grade | Deskripsi |
|------|------------|-----------|
| **PILIHAN_GANDA** | ✅ Ya | 4 opsi (A-D), 1 jawaban benar |
| **ESSAY** | ❌ Manual | Jawaban panjang, guru grade manual |
| **ISIAN_SINGKAT** | ✅ Ya | Multiple acceptable answers, case-insensitive |
| **BENAR_SALAH** | ✅ Ya | True/False |
| **PENCOCOKAN** | ✅ Ya | Matching items kiri-kanan dengan drag & drop |

### Fitur Ujian

- **Shuffle Questions** — Acak urutan soal per siswa
- **Timer** — Countdown timer berdasarkan durasi ujian
- **Auto-Save** — Jawaban otomatis tersimpan setiap perubahan
- **Navigation Panel** — Navigasi soal dengan indikator sudah/belum dijawab
- **Token Access** — Siswa harus input token 6-digit dari admin
- **Rich Text** — Soal mendukung gambar, rumus matematika, formatting
- **Drag & Drop Reorder** — Guru bisa reorder soal dengan drag & drop

---

## 10. AI Chatbot Assistant

### Arsitektur

```
┌──────────────────────────────────────────────┐
│           FLOATING CHAT BUBBLE (UI)          │
│  ┌────────────────────────────────────────┐  │
│  │  Chat Messages (markdown rendered)     │  │
│  │  Confirmation Buttons                  │  │
│  │  Action Result Badges                  │  │
│  │  Auto-growing Textarea Input           │  │
│  └──────────────┬─────────────────────────┘  │
└─────────────────┼────────────────────────────┘
                  │ POST /api/guru/ai-chatbot
┌─────────────────┼────────────────────────────┐
│           API ROUTE HANDLER                   │
│                 │                              │
│  ┌──────────────┴─────────────────────────┐  │
│  │  Action Router                         │  │
│  │  ├─ CONFIRM_CREATE_EXAM                │  │
│  │  ├─ CONFIRM_CREATE_EXAM_WITH_QUESTIONS │  │
│  │  └─ CONFIRM_ADD_QUESTIONS              │  │
│  └──────────────┬─────────────────────────┘  │
│                 │                              │
│  ┌──────────────┴─────────────────────────┐  │
│  │  AI Service (chatWithAI)               │  │
│  │  ├─ Context Builder (guru, mapel,      │  │
│  │  │   kelas, existing exams)            │  │
│  │  ├─ Provider Selection                 │  │
│  │  │   ├─ Anthropic (Claude Sonnet 4)    │  │
│  │  │   └─ Groq (Llama 3.3 70B)          │  │
│  │  ├─ JSON Response Parser               │  │
│  │  │   ├─ Full parse                     │  │
│  │  │   └─ Truncated JSON recovery        │  │
│  │  └─ Post-Processing                    │  │
│  │      └─ validateAndFixSoalPoin()       │  │
│  │          (ensures total = 100)         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Intent Detection

| Intent | Trigger | Aksi |
|--------|---------|------|
| `CREATE_EXAM` | "Buatkan ujian..." | Buat draft ujian |
| `CREATE_EXAM_WITH_QUESTIONS` | "Buatkan ujian + 25 soal..." | Buat ujian + soal sekaligus |
| `GENERATE_QUESTIONS` | "Buatkan 10 soal PG..." | Generate soal saja |
| `ADD_QUESTIONS_TO_EXAM` | "Tambahkan soal ke ujian..." | Tambah soal ke ujian existing |
| `GENERAL_CHAT` | Pertanyaan umum | Jawab pertanyaan |
| `HELP` | "Bantuan", "Apa yang bisa kamu lakukan?" | Tampilkan kemampuan |

### Fitur AI

- **Dual Provider** — Anthropic Claude Sonnet 4 (utama) + Groq Llama 3.3 70B (fallback)
- **Context-Aware** — AI tahu nama guru, mapel yang diajar, kelas, ujian yang sudah ada
- **Strict JSON Output** — Response selalu dalam format JSON yang terstruktur
- **Truncated JSON Recovery** — Jika response terpotong, parser bisa extract soal yang valid
- **Point Validation** — `validateAndFixSoalPoin()` memastikan total poin = 100
- **Confirmation Flow** — Selalu minta konfirmasi sebelum eksekusi (buat ujian/tambah soal)
- **Auto-Refresh** — `router.refresh()` setelah aksi berhasil
- **Internal Navigation** — Link dari AI menggunakan `router.push()`, bukan buka tab baru

---

## 11. Sistem Autentikasi & Otorisasi

### Mekanisme

```
Login Request → bcrypt verify → iron-session cookie → Role-based routing
```

| Aspek | Detail |
|-------|--------|
| **Session** | Encrypted cookie via `iron-session` (rolling, TTL 8 jam) |
| **Session Data** | `userId`, `email`, `role`, `schoolId`, `isLoggedIn` |
| **Password** | Hashed dengan `bcryptjs` (salt rounds: 10) |
| **Roles** | `SUPERADMIN`, `ADMIN`, `GURU`, `SISWA` |
| **Login SuperAdmin** | Email + Password → `/superadmin/login` |
| **Login Admin/Guru** | Email + Password → `/login` |
| **Login Siswa** | NISN + Password → `/` (siswa login page) |
| **Route Protection** | Server-side session check di setiap API route |
| **Token Ujian** | 6-digit code, expires 2 menit, generated by admin |
| **Password Reset** | Email token → `/reset-password?token=xxx` (expires 1 jam) |
| **SESSION_SECRET** | Minimal 32 karakter, digunakan untuk enkripsi cookie |

### Password Reset Flow

```
User → /forgot-password → Input email
  → API: POST /api/password-reset/request
  → Cari user di DB → Generate token → Simpan PasswordResetToken
  → Kirim email via SMTP (SmtpConfig dari DB)
  → User klik link di email → /reset-password?token=xxx
  → API: POST /api/password-reset/reset
  → Validasi token (belum expired, belum dipakai)
  → Update password (bcrypt hash) → Mark token as used
```

### Role-Based Access

| Resource | SuperAdmin | Admin | Guru | Siswa |
|----------|-----------|-------|------|-------|
| Kelola Sekolah/Tenant | ✅ | ❌ | ❌ | ❌ |
| Kelola Tier | ✅ | ❌ | ❌ | ❌ |
| Platform Notifications | ✅ | ❌ | ❌ | ❌ |
| Broadcast Email | ✅ | ❌ | ❌ | ❌ |
| SMTP Config | ✅ | ❌ | ❌ | ❌ |
| Landing Media | ✅ | ❌ | ❌ | ❌ |
| Manajemen User | ❌ | ✅ | ❌ | ❌ |
| Manajemen Kelas/Mapel | ❌ | ✅ | ❌ | ❌ |
| Token Ujian | ❌ | ✅ | ❌ | ❌ |
| Presensi | ❌ | ✅ | ❌ | ❌ |
| Buat Ujian | ❌ | ❌ | ✅ | ❌ |
| Buat Soal | ❌ | ❌ | ✅ | ❌ |
| AI Chatbot | ❌ | ❌ | ✅ | ❌ |
| Grade Submission | ❌ | ❌ | ✅ | ❌ |
| Kerjakan Ujian | ❌ | ❌ | ❌ | ✅ |
| Submit Tugas | ❌ | ❌ | ❌ | ✅ |
| Lihat Raport | ❌ | ❌ | ❌ | ✅ |

---

## 12. Sistem Tier & Langganan

### Tier Levels

| Tier | Max Siswa | Max Guru | Max Kelas | Max Mapel | Max Ujian | Storage |
|------|-----------|----------|-----------|-----------|-----------|---------|
| **Trial** | 50 | 5 | 3 | 5 | 10 | 100 MB |
| **Starter** | 200 | 15 | 10 | 15 | 50 | 500 MB |
| **Basic** | 500 | 30 | 20 | 30 | 100 | 2 GB |
| **Professional** | 1000 | 50 | 40 | 50 | Unlimited | 5 GB |
| **Enterprise** | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited | 20 GB |

### Tier Limit Enforcement

Tier limits dicek di `src/lib/tier-limits.ts` sebelum operasi create:

```typescript
// Contoh: cek limit sebelum tambah siswa
const school = await prisma.school.findUnique({
  where: { id: schoolId },
  include: { tier: true }
});
const currentCount = await prisma.siswa.count({ where: { schoolId } });
if (currentCount >= school.tier.maxSiswa) {
  throw new Error("Limit siswa tercapai untuk tier ini");
}
```

### Feature Flags

Setiap tier memiliki `features` (JSON) yang mengontrol fitur tambahan:
- `aiChatbot` — Akses AI chatbot assistant
- `documentParsing` — Import soal dari Word/PDF
- `advancedAnalytics` — Dashboard analitik lanjutan
- `whatsappNotification` — Notifikasi WhatsApp
- `customBranding` — Custom logo & branding sekolah

---

## 13. Sistem Notifikasi

### Platform Notifications

SuperAdmin dapat mengirim notifikasi ke sekolah tertentu atau semua sekolah:

```
SuperAdmin → Create Notification (title, message, type, priority, targetSchoolId)
  → Simpan ke PlatformNotification
  → Jika gagal kirim → Log ke FailedNotification
  → User di sekolah target → Notification Bell menampilkan notifikasi
```

### Notification Types & Priority

| Type | Deskripsi |
|------|-----------|
| `info` | Informasi umum |
| `warning` | Peringatan |
| `update` | Update platform |
| `maintenance` | Jadwal maintenance |
| `promo` | Promosi/penawaran |

| Priority | Deskripsi |
|----------|-----------|
| `urgent` | Sangat penting, tampil di atas |
| `high` | Penting |
| `normal` | Normal |
| `low` | Rendah |

### Notification Bell Component

Komponen `notification-bell.tsx` menampilkan:
- Badge count untuk notifikasi belum dibaca
- Dropdown list notifikasi dengan tipe & prioritas
- Mark as read per notifikasi
- Fetch dari `/api/notifications` (filtered by schoolId dari session)

### Broadcast Email

SuperAdmin dapat mengirim email massal:
- Pilih sekolah target (atau semua)
- Subject + body (HTML)
- Dikirim via SMTP (Nodemailer) menggunakan `SmtpConfig` dari database
- History tersimpan di model `BroadcastEmail`

---

## 14. Fitur Platform

### Profile Photo

- Upload foto profil dari file atau webcam
- Crop menggunakan `react-image-crop`
- Simpan ke Cloudflare R2 / AWS S3
- URL disimpan di field `profilePhoto` pada model `User`

### Landing Page

- Halaman marketing publik di `/landing`
- Menampilkan fitur, harga (dari API `/api/public/tiers`), testimonial, FAQ
- Media gambar dikelola oleh SuperAdmin via Landing Media
- Responsive design

### Cron Jobs

| Endpoint | Fungsi |
|----------|--------|
| `/api/cron/auto-alpha` | Otomatis set status "alpha" untuk siswa yang tidak presensi, dijalankan per sekolah |

### SMTP Configuration

- Konfigurasi SMTP disimpan di database (model `SmtpConfig`)
- Digunakan oleh Nodemailer untuk mengirim email
- Dikelola oleh SuperAdmin via `/superadmin/settings`
- Fields: `host`, `port`, `user`, `pass`, `fromEmail`, `fromName`

---

## 15. Deployment

### Docker (Recommended)

```bash
# Build image
docker build -t e-learning .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="..." \
  -e ANTHROPIC_API_KEY="..." \
  e-learning
```

### Coolify (Self-Hosted)

Platform ini sudah dikonfigurasi untuk deploy ke Coolify:
- `Dockerfile` multi-stage build (deps → builder → runner)
- `nixpacks.toml` sebagai alternatif build
- Environment variables diinject saat runtime (bukan build time)
- Standalone output untuk ukuran image minimal

### Vercel

```bash
vercel deploy
```

Konfigurasi di `vercel.json` sudah tersedia.

---

## 16. Environment Variables

| Variable | Required | Deskripsi |
|----------|----------|-----------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled/Neon) |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection (untuk migrations) |
| `SESSION_SECRET` | ✅ | Secret key untuk iron-session encryption (min 32 chars) |
| `ANTHROPIC_API_KEY` | ⚠️ | API key Anthropic Claude (untuk AI chatbot & document parsing) |
| `GROQ_API_KEY` | ⚠️ | API key Groq (fallback AI provider) |
| `R2_ACCESS_KEY_ID` | ⚠️ | Cloudflare R2 access key (file upload) |
| `R2_SECRET_ACCESS_KEY` | ⚠️ | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | ⚠️ | R2 bucket name |
| `R2_ENDPOINT` | ⚠️ | R2 endpoint URL |
| `R2_PUBLIC_URL` | ⚠️ | R2 public URL untuk akses file |
| `NEXT_PUBLIC_APP_URL` | ⚠️ | Base URL aplikasi (untuk link di email reset password) |
| `CRON_SECRET` | ⚠️ | Secret untuk autentikasi cron job endpoints |

> ✅ = Wajib untuk menjalankan aplikasi
> ⚠️ = Diperlukan untuk fitur tertentu (AI chatbot, file upload, email, cron)

**Catatan:** Konfigurasi SMTP (host, port, user, pass) disimpan di database melalui model `SmtpConfig`, bukan di environment variables. Dikelola via SuperAdmin portal.

---

## 17. Cara Menjalankan

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+ (atau Neon serverless)
- **npm** atau **pnpm**

### Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd e-learning

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi database dan API keys

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma db push

# 6. Seed database (creates school, superadmin, admin, guru, siswa)
npx prisma db seed

# 7. Run development server
npm run dev
```

### Default Credentials (Setelah Seed)

| Role | Email | Password |
|------|-------|----------|
| **SuperAdmin** | `superadmin@platform.com` | `superadmin123` |
| **Admin** | `admin@sekolah.com` | `admin123` |
| **Guru** | `budi.hartono@sekolah.com` | `guru123` |
| **Siswa** | *(login via NISN)* | `siswa123` |

### Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Start development server (turbopack) |
| `npm run build` | Build production (prisma generate + next build) |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format code with Biome |
| `npm run check` | Run Biome check |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |
| `npx prisma db push` | Push schema to database |
| `npx prisma db seed` | Seed database |

### URL Routes

| URL | Deskripsi |
|-----|-----------|
| `/` | Siswa login page |
| `/login` | Admin/Guru login page |
| `/superadmin/login` | SuperAdmin login page |
| `/landing` | Public landing page |
| `/forgot-password` | Forgot password page |
| `/reset-password?token=xxx` | Reset password page |

---

## Statistik Proyek

| Metrik | Jumlah |
|--------|--------|
| **Total Files** | 440+ source files |
| **UI Components** | 60+ reusable components |
| **API Endpoints** | 60+ REST endpoints |
| **Database Models** | 25+ models |
| **Custom Hooks** | 14 hooks |
| **Tipe Soal** | 5 tipe |
| **User Roles** | 4 roles (SuperAdmin, Admin, Guru, Siswa) |
| **AI Providers** | 2 providers (Anthropic, Groq) |
| **Tier Levels** | 5 tiers (Trial → Enterprise) |

---

## Dibangun Dengan

Next.js 16 • React 19 • TypeScript 5.9 • Tailwind CSS 4 • Prisma 6 • PostgreSQL • Anthropic Claude Sonnet 4 • Groq Llama 3.3 • TipTap 3 • Radix UI • TanStack • Zustand • Nodemailer • iron-session • Docker • Coolify • Vercel

---

*Dokumentasi ini menjelaskan arsitektur, fitur, dan detail teknis dari platform E-Learning Multi-Tenant SaaS secara komprehensif. Terakhir diperbarui sesuai dengan versi terbaru aplikasi.*
