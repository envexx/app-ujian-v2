# E-Learning Management System

> Platform Manajemen Pembelajaran (LMS) & Ujian Online berbasis AI untuk sekolah — Multi-Tenant SaaS dibangun dengan Next.js 16, React 19, TypeScript, Prisma 6, dan PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![AI Powered](https://img.shields.io/badge/AI-Claude%20Sonnet%204-blueviolet)](https://www.anthropic.com/)

---

## Tentang

E-Learning Management System adalah platform pembelajaran digital **multi-tenant** yang dirancang untuk sekolah menengah di Indonesia. Sistem ini mengintegrasikan manajemen ujian online (CBT), tugas, penilaian otomatis, presensi, AI chatbot, dan administrasi sekolah dalam satu platform terpadu.

Platform ini mendukung **4 level portal**: **SuperAdmin** (platform-level), **Admin** (sekolah), **Guru**, dan **Siswa** — dengan arsitektur multi-tenancy yang memastikan isolasi data antar sekolah.

---

## Arsitektur Multi-Tenancy

```
┌─────────────────────────────────────────────────────────┐
│                    SUPERADMIN PORTAL                      │
│  (Platform-level: kelola sekolah, tier, notifikasi)      │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Sekolah A│  │ Sekolah B│  │ Sekolah C│   ← Tenant (School)
  │          │  │          │  │          │
  │ • Admin  │  │ • Admin  │  │ • Admin  │
  │ • Guru   │  │ • Guru   │  │ • Guru   │
  │ • Siswa  │  │ • Siswa  │  │ • Siswa  │
  └──────────┘  └──────────┘  └──────────┘
```

Setiap sekolah (tenant) memiliki data yang **terisolasi penuh** — semua query database difilter berdasarkan `schoolId` untuk menjamin keamanan data antar sekolah.

---

## Fitur Utama

### Sistem Ujian Online (CBT)

| Fitur | Deskripsi |
|-------|-----------|
| **5 Tipe Soal** | Pilihan Ganda, Essay, Isian Singkat, Benar/Salah, Pencocokan (Matching) |
| **Auto-Grading** | Penilaian otomatis untuk PG, Isian Singkat, Benar/Salah, dan Pencocokan (partial scoring) |
| **Manual Grading** | Penilaian manual oleh guru untuk soal Essay dengan feedback |
| **Poin-Based Scoring** | Total poin per ujian = 100, guru mengatur distribusi poin per soal |
| **Token Ujian** | Sistem keamanan akses ujian dengan token 6-digit (expires 2 menit) |
| **Auto-Save** | Jawaban tersimpan otomatis selama pengerjaan |
| **Timer & Countdown** | Timer real-time dengan sisa waktu yang disinkronkan server |
| **Shuffle Questions** | Acak urutan soal per siswa untuk mencegah kecurangan |
| **Print PDF** | Cetak soal ujian ke PDF format A4 dengan/tanpa kunci jawaban |
| **Visual Matching** | Garis penghubung SVG bezier curve pada soal Pencocokan (8 warna) |
| **Drag & Drop Soal** | Reorder soal dengan drag & drop (dnd-kit) |
| **Rich Text Editor** | TipTap 3 dengan gambar, rumus matematika (KaTeX/MathJax), formatting lengkap |
| **Import Soal dari Word** | Parse dokumen Word/PDF menggunakan AI Claude untuk extract soal |

### AI Chatbot Assistant (Guru)

| Fitur | Deskripsi |
|-------|-----------|
| **Natural Language** | Guru bisa perintah dalam bahasa Indonesia biasa |
| **Buat Ujian Otomatis** | "Buatkan ujian MID Bahasa Indonesia tanggal 20 Maret" |
| **Generate Soal Multi-Type** | "Buatkan 25 soal: 15 PG, 4 Essay, 3 Pencocokan, 3 B/S" |
| **One-Step Creation** | Buat ujian + generate semua soal dalam satu perintah |
| **Dual AI Provider** | Anthropic Claude Sonnet 4 (utama) + Groq Llama 3.3 70B (fallback) |
| **Context-Aware** | AI tahu mapel, kelas, dan ujian yang sudah ada |
| **Point Validation** | Total poin otomatis dikoreksi ke 100 |
| **Floating Bubble UI** | Chat bubble Sendbird-style yang mengambang di pojok layar |

### Portal SuperAdmin (Platform-Level)

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Statistik** | Overview seluruh platform: total sekolah, user, guru, siswa |
| **Kelola Sekolah** | CRUD sekolah (tenant), aktivasi/deaktivasi, assign tier |
| **Kelola Tier/Paket** | Buat paket langganan (Trial, Starter, Basic, Professional, Enterprise) |
| **Limit per Tier** | Batasi jumlah siswa, guru, kelas, mapel, ujian, dan storage per tier |
| **Platform Notifikasi** | Kirim notifikasi ke semua sekolah atau sekolah tertentu |
| **Broadcast Email** | Kirim email massal ke sekolah (via SMTP yang dikonfigurasi) |
| **Konfigurasi SMTP** | Setup SMTP server untuk pengiriman email platform |
| **Landing Media** | Kelola gambar dan video untuk halaman landing page |
| **Pengaturan Platform** | Konfigurasi umum platform |

### Portal Admin (Per Sekolah)

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Analitik** | Statistik sekolah: jumlah guru, siswa, kelas, ujian, aktivitas terbaru |
| **Manajemen Guru** | CRUD data guru, assign mapel & kelas, import Excel |
| **Manajemen Siswa** | CRUD data siswa, import Excel (email opsional, auto-generate dari NIS) |
| **Manajemen Kelas** | Kelola kelas dan wali kelas per tahun ajaran |
| **Mata Pelajaran** | Setup mapel dengan kode unik, jenis (wajib/peminatan), jam per minggu |
| **Token Ujian** | Generate & kelola token 6-digit untuk akses ujian siswa |
| **Presensi** | Sistem presensi dengan QR Code scan (masuk & pulang) |
| **Auto-Alpha** | Cron job otomatis menandai siswa yang tidak presensi sebagai Alpha |
| **Kartu Pelajar** | Generate kartu pelajar digital dengan QR code |
| **Info Masuk/Pulang** | Konfigurasi jam masuk & pulang per hari |
| **Pengaturan Sekolah** | Logo, nama, alamat, kepala sekolah, tahun ajaran, semester |

### Portal Guru

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Statistik personal: jumlah ujian, siswa, tugas, rata-rata nilai |
| **Manajemen Ujian** | Buat, edit, hapus ujian dengan status draft/aktif/selesai |
| **Editor Soal Multi-Type** | Buat soal dengan 5 tipe berbeda menggunakan rich text editor TipTap |
| **AI Chatbot Assistant** | Floating bubble AI untuk generate ujian + soal otomatis |
| **Penilaian Ujian** | Auto-grade soal objektif + manual grade essay dengan feedback |
| **Recalculate Nilai** | Hitung ulang nilai seluruh submission jika ada perubahan soal |
| **Print Soal** | Cetak ujian format A4 profesional dengan header sekolah |
| **Manajemen Tugas** | Buat tugas dengan deadline, lampiran file, review submission |
| **Manajemen Materi** | Upload materi pembelajaran (PDF, video, gambar, link) |
| **Jadwal Mengajar** | Lihat jadwal mengajar per hari dan kelas |
| **Konfigurasi Nilai** | Set bobot penilaian (PG vs Essay) per guru |
| **Import Soal dari Word** | Parse dokumen Word/PDF menggunakan AI untuk extract soal |

### Portal Siswa

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Statistik personal: ujian mendatang, tugas pending, rata-rata nilai |
| **Mengerjakan Ujian** | Interface ujian online dengan timer, navigasi soal, auto-save |
| **Token Verification** | Input token 6-digit sebelum akses ujian |
| **Lihat Hasil Ujian** | Review jawaban, lihat skor per soal, feedback guru |
| **Mengerjakan Tugas** | Submit tugas via file upload atau link |
| **Akses Materi** | Lihat dan download materi pembelajaran |
| **Raport Digital** | Rekap nilai per mata pelajaran per semester |
| **Login Fleksibel** | Masuk menggunakan NIS atau NISN (tanpa email) |

### Fitur Platform

| Fitur | Deskripsi |
|-------|-----------|
| **Landing Page** | Halaman marketing dengan fitur, harga, testimonial, FAQ |
| **Sistem Notifikasi** | Notification bell real-time dengan polling 15 detik |
| **Password Reset** | Forgot password + reset via email token |
| **Profile Photo** | Upload & crop foto profil (image cropper) |
| **Dark/Light Mode** | Tema dengan preset warna (Neutral, Tangerine, Neo Brutalism, Soft Pop) |
| **Responsive Design** | Mobile-friendly, bisa diakses dari desktop dan mobile |
| **WhatsApp Notification** | Kirim notifikasi via WhatsApp (queue-based) |
| **Rate Limiting** | API rate limiting untuk mencegah abuse |
| **Tenant Isolation** | Semua query difilter `schoolId` untuk keamanan data |

---

## Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.x | Framework React full-stack (App Router) |
| **React** | 19.x | UI library dengan React Compiler enabled |
| **TypeScript** | 5.9 | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Radix UI** | Latest | Headless UI primitives (60+ komponen) |
| **TipTap** | 3.x | Rich text editor (WYSIWYG) |
| **Recharts** | 2.x | Charting library untuk dashboard |
| **TanStack Table** | 8.x | Data table dengan sorting, filtering, pagination |
| **TanStack Query** | 5.x | Server state management |
| **SWR** | 2.x | Data fetching & caching |
| **Zustand** | 5.x | Client state management |
| **dnd-kit** | Latest | Drag & drop untuk reorder soal |
| **React Hook Form** | 7.x | Form management |
| **Zod** | 3.x | Schema validation |
| **KaTeX / MathJax** | Latest | Rendering rumus matematika |
| **Lucide React** | Latest | Icon library |
| **Sonner** | 2.x | Toast notifications |
| **next-themes** | Latest | Dark/light mode |
| **cmdk** | Latest | Command palette |
| **date-fns** | 3.x | Date manipulation |
| **Embla Carousel** | 8.x | Carousel component |

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js API Routes** | 16.x | RESTful API endpoints (App Router) |
| **Prisma ORM** | 6.x | Database ORM dengan type-safe queries |
| **PostgreSQL** | Latest | Primary database |
| **iron-session** | 8.x | Encrypted cookie-based session (rolling 8 jam) |
| **bcryptjs** | 3.x | Password hashing |
| **jose** | 6.x | JWT token handling |
| **Nodemailer** | 8.x | Email sending (SMTP) |
| **Axios** | 1.x | HTTP client |

### AI & Cloud Services

| Teknologi | Fungsi |
|-----------|--------|
| **Anthropic Claude Sonnet 4** | AI utama untuk generate soal & chatbot assistant |
| **Groq (Llama 3.3 70B)** | AI alternatif/fallback |
| **Cloudflare R2 / AWS S3** | Object storage untuk file upload |

### DevOps & Tooling

| Teknologi | Fungsi |
|-----------|--------|
| **Docker** | Containerization (multi-stage build) |
| **Coolify** | Self-hosted deployment platform |
| **Vercel** | Cloud deployment |
| **Biome** | Linter & formatter (pengganti ESLint + Prettier) |
| **Nixpacks** | Alternative build system |

---

## Cara Memulai

### Prasyarat

- **Node.js** 20+
- **PostgreSQL** 15+
- **npm**

### Instalasi

```bash
# 1. Clone repository
git clone https://github.com/envexx/LMS---Learning-Management-School.git
cd LMS---Learning-Management-School

# 2. Install dependencies
npm install

# 3. Buat file .env (lihat konfigurasi di bawah)

# 4. Setup database
npx prisma generate
npx prisma db push
npx prisma db seed
npx tsx prisma/seed-sekolah.ts

# 5. Jalankan development server
npm run dev
```

Aplikasi berjalan di [http://localhost:3000](http://localhost:3000)

### Konfigurasi Environment

Buat file `.env` di root project:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/elearning_db"
DIRECT_URL="postgresql://user:password@localhost:5432/elearning_db"

# Session Secret (Required - min 32 karakter)
SESSION_SECRET="your-secret-key-min-32-characters-long"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Chatbot (Opsional - untuk fitur AI)
ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."

# Cloudflare R2 / S3 (Opsional - untuk file upload)
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_ENDPOINT="..."
R2_PUBLIC_URL="..."
```

### Akun Default

Setelah seeding, gunakan kredensial berikut:

| Role | Email / NIS | Password |
|------|-------------|----------|
| **SuperAdmin** | `superadmin@platform.com` | `superadmin123` |
| **Admin** | `admin@sekolah.com` | `admin123` |
| **Guru** | `budi.hartono@sekolah.com` | `guru123` |
| **Siswa** | NIS atau NISN siswa | `siswa123` |

---

## Struktur Project

```
e-learning/
├── prisma/
│   ├── schema.prisma              # Database schema (25+ models)
│   ├── seed.ts                    # Seed data utama
│   ├── seed-sekolah.ts            # Seed data sekolah
│   ├── seed-admin-only.ts         # Seed admin saja
│   ├── seed-info-masuk.ts         # Seed info masuk/pulang
│   └── seed-dummy-ujian.ts        # Seed ujian dummy
│
├── public/                        # Static assets
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (providers, fonts)
│   │   ├── page.tsx               # Landing/login page siswa
│   │   ├── globals.css            # Global styles (Tailwind v4)
│   │   │
│   │   ├── landing/               # Landing page marketing
│   │   │   └── page.tsx           # Fitur, harga, testimonial, FAQ
│   │   │
│   │   ├── superadmin/            # SuperAdmin portal
│   │   │   ├── page.tsx           # Dashboard statistik platform
│   │   │   ├── schools/           # Kelola sekolah (tenant)
│   │   │   ├── tiers/             # Kelola tier/paket langganan
│   │   │   ├── notifications/     # Platform notifikasi
│   │   │   ├── broadcast/         # Broadcast email
│   │   │   ├── landing-media/     # Kelola media landing page
│   │   │   ├── settings/          # Pengaturan platform
│   │   │   └── login/             # Login superadmin
│   │   │
│   │   ├── (main)/                # Authenticated routes (tenant)
│   │   │   ├── admin/             # Admin panel
│   │   │   │   ├── page.tsx       # Dashboard admin
│   │   │   │   ├── guru/          # Manajemen guru
│   │   │   │   ├── siswa/         # Manajemen siswa
│   │   │   │   ├── kelas/         # Manajemen kelas
│   │   │   │   ├── mapel/         # Manajemen mapel
│   │   │   │   ├── presensi/      # Presensi + QR scan
│   │   │   │   ├── kartu-pelajar/ # Kartu pelajar digital
│   │   │   │   ├── token-ujian/   # Token ujian management
│   │   │   │   ├── info-masuk/    # Jam masuk/pulang
│   │   │   │   └── settings/      # Pengaturan sekolah
│   │   │   │
│   │   │   ├── guru/              # Guru panel
│   │   │   │   ├── page.tsx       # Dashboard guru
│   │   │   │   ├── ujian/         # Manajemen ujian
│   │   │   │   │   ├── create/    # Buat ujian baru
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── edit/  # Edit ujian + soal
│   │   │   │   │       ├── nilai/ # Penilaian siswa
│   │   │   │   │       └── print/ # Cetak ujian PDF
│   │   │   │   ├── tugas/         # Manajemen tugas
│   │   │   │   ├── materi/        # Manajemen materi
│   │   │   │   ├── jadwal/        # Jadwal mengajar
│   │   │   │   ├── nilai/         # Rekap nilai
│   │   │   │   └── settings/      # Pengaturan guru
│   │   │   │
│   │   │   ├── siswa/             # Siswa panel
│   │   │   │   ├── page.tsx       # Dashboard siswa
│   │   │   │   ├── ujian/         # Ujian siswa
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── hasil/ # Hasil ujian
│   │   │   │   ├── tugas/         # Tugas siswa
│   │   │   │   ├── materi/        # Materi siswa
│   │   │   │   └── raport/        # Raport siswa
│   │   │   │
│   │   │   ├── auth/              # Halaman login (v1, v2)
│   │   │   └── dashboard/         # Multi-layout dashboard
│   │   │
│   │   ├── login/                 # Admin/Guru login page
│   │   ├── siswa-login/           # Siswa login page
│   │   ├── reset-password/        # Reset password page
│   │   │
│   │   └── api/                   # API Routes (50+)
│   │       ├── auth/              # Login, logout, session, password reset
│   │       ├── superadmin/        # SuperAdmin APIs
│   │       ├── admin/             # Admin APIs
│   │       ├── guru/              # Guru APIs
│   │       │   └── ai-chatbot/    # AI chatbot endpoint
│   │       ├── siswa/             # Siswa APIs
│   │       ├── upload/            # File upload (R2/S3)
│   │       ├── word/              # Document parsing (Claude AI)
│   │       ├── notifications/     # Platform notifications
│   │       ├── whatsapp/          # WhatsApp notifications
│   │       ├── cron/              # Scheduled tasks (daily-alpha)
│   │       └── public/            # Public APIs (landing, tiers)
│   │
│   ├── components/
│   │   ├── ai-chatbot/            # AI chatbot floating bubble
│   │   ├── soal/                  # Soal form components (5 tipe)
│   │   ├── tiptap/                # Rich text editor
│   │   ├── tiptap-ui/             # TipTap UI components (39 items)
│   │   ├── tiptap-node/           # TipTap custom nodes (12 items)
│   │   ├── data-table/            # Reusable data table
│   │   ├── notification-bell.tsx  # Notification bell component
│   │   ├── profile-photo-cropper.tsx # Profile photo upload & crop
│   │   └── ui/                    # 64 UI components (Radix-based)
│   │
│   ├── lib/
│   │   ├── ai-chatbot.ts          # AI service (Anthropic + Groq)
│   │   ├── api-client.ts          # Axios API client
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── session.ts             # iron-session config (rolling 8h)
│   │   ├── email.ts               # Nodemailer email service
│   │   ├── tier-limits.ts         # Tier limit checking
│   │   ├── exam-queue.ts          # Exam processing queue
│   │   ├── rate-limit.ts          # API rate limiting
│   │   ├── redis.ts               # Redis client
│   │   ├── whatsapp-queue.ts      # WhatsApp notification queue
│   │   ├── wordParser.ts          # Word document parser
│   │   ├── tiptap-utils.ts        # TipTap editor utilities
│   │   ├── schoolSettings.ts      # School settings helper
│   │   ├── query-helpers.ts       # Database query helpers
│   │   ├── swr-config.ts          # SWR configuration
│   │   └── utils.ts               # General utilities
│   │
│   ├── hooks/                     # 14 custom React hooks
│   ├── contexts/                  # React contexts (auth)
│   ├── stores/                    # Zustand stores (preferences)
│   └── types/                     # TypeScript type definitions
│
├── Dockerfile                     # Multi-stage Docker build
├── nixpacks.toml                  # Nixpacks config
├── vercel.json                    # Vercel config
├── biome.json                     # Biome linter config
└── package.json                   # Dependencies & scripts
```

---

## Sistem Penilaian

### Konsep Poin

Setiap ujian memiliki **total poin = 100**. Guru bebas mengatur distribusi poin per soal.

```
Contoh distribusi:
  4 soal PG      × 10 poin = 40 poin
  2 soal Isian   × 10 poin = 20 poin
  2 soal B/S     ×  5 poin = 10 poin
  1 soal Cocok   × 10 poin = 10 poin
  1 soal Essay   × 20 poin = 20 poin
  ─────────────────────────────────
  Total                     = 100 poin
```

### Perhitungan Nilai

| Tipe Soal | Penilaian | Rumus |
|-----------|-----------|-------|
| **Pilihan Ganda** | Otomatis | Benar = poin penuh, Salah = 0 |
| **Isian Singkat** | Otomatis | Cocok dengan kunci (case-insensitive) = poin penuh |
| **Benar/Salah** | Otomatis | Benar = poin penuh, Salah = 0 |
| **Pencocokan** | Otomatis (partial) | (pasangan benar / total pasangan) × poin |
| **Essay** | Manual oleh guru | Guru memberi nilai 0 s.d. poin soal |

**Nilai akhir = jumlah semua poin yang didapat** (tanpa rumus persentase).

---

## Autentikasi & Otorisasi

Sistem menggunakan **Iron Session** (encrypted cookie-based) dengan rolling session 8 jam:

```
Login Request → bcrypt verify → iron-session cookie → Role-based routing
```

### 4 Level Role

| Role | Akses |
|------|-------|
| **SuperAdmin** | Platform-level — kelola sekolah, tier, notifikasi, broadcast, SMTP |
| **Admin** | Per sekolah — kelola guru, siswa, kelas, mapel, token, presensi |
| **Guru** | Per sekolah — kelola ujian, tugas, penilaian, materi, jadwal, AI chatbot |
| **Siswa** | Per sekolah — kerjakan ujian & tugas, lihat nilai & raport, akses materi |

### Metode Login

| Role | Metode | Halaman |
|------|--------|---------|
| **SuperAdmin** | Email + Password | `/superadmin/login` |
| **Admin/Guru** | Email + Password | `/login` |
| **Siswa** | NIS atau NISN | `/` (landing) atau `/siswa-login` |

### Fitur Keamanan

- **Password hashing** dengan bcryptjs
- **Encrypted cookie** via iron-session
- **Rolling session** — auto-refresh setiap aktivitas (TTL 8 jam)
- **Tenant isolation** — semua query difilter `schoolId`
- **Token ujian** — 6-digit, expires 2 menit, generated by admin
- **Rate limiting** — mencegah brute force dan abuse API
- **Password reset** — via email token (forgot password flow)

---

## Database Schema

### Model (25+ tabel — PostgreSQL + Prisma 6)

#### Platform-Level

| Model | Deskripsi |
|-------|-----------|
| `School` | Tenant utama — data sekolah, NPSN, jenjang, status aktif |
| `SuperAdmin` | Akun superadmin platform |
| `Tier` | Paket langganan (Trial, Starter, Basic, Professional, Enterprise) |
| `SmtpConfig` | Konfigurasi SMTP untuk email platform |
| `PlatformNotification` | Notifikasi dari superadmin ke sekolah |
| `NotificationRead` | Tracking notifikasi yang sudah dibaca |
| `BroadcastEmail` | Email massal ke sekolah |
| `PasswordResetToken` | Token reset password (expires) |
| `LandingMedia` | Media (gambar/video) untuk landing page |

#### Tenant-Level (Per Sekolah)

| Model | Deskripsi |
|-------|-----------|
| `User` | Akun login (admin, guru, siswa) — terikat ke `schoolId` |
| `Guru` | Data guru + relasi ke mapel dan kelas |
| `Siswa` | Data siswa + relasi ke kelas |
| `Kelas` | Data kelas + wali kelas + tahun ajaran |
| `MataPelajaran` | Mata pelajaran + kode unik per sekolah |
| `GuruMapel` | Relasi many-to-many guru ↔ mapel |
| `GuruKelas` | Relasi many-to-many guru ↔ kelas |
| `Jadwal` | Jadwal mengajar (hari, jam, ruangan) |
| `SekolahInfo` | Informasi branding sekolah |
| `InfoMasuk` | Jam masuk/pulang per hari |

#### Ujian & Penilaian

| Model | Deskripsi |
|-------|-----------|
| `Ujian` | Data ujian (jadwal, kelas, status, shuffle) |
| `Soal` | Soal ujian — unified model, data JSON per tipe |
| `UjianSubmission` | Submission ujian siswa (status, nilai) |
| `JawabanSoal` | Jawaban per soal (nilai, isCorrect, feedback) |
| `UjianAccessControl` | Token akses ujian (6-digit, expires) |
| `GradeConfig` | Konfigurasi bobot penilaian per guru |

#### Tugas, Materi & Presensi

| Model | Deskripsi |
|-------|-----------|
| `Tugas` | Data tugas dari guru (deadline, lampiran) |
| `TugasSubmission` | Submission tugas siswa (file/link, nilai, feedback) |
| `Materi` | Materi pembelajaran (PDF, video, gambar, link) |
| `Presensi` | Data presensi siswa (hadir, izin, sakit, alpha) |
| `KartuPelajar` | Kartu pelajar digital (status, kadaluarsa) |
| `FailedNotification` | Log notifikasi WhatsApp yang gagal |

---

## API Endpoints

### Autentikasi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login admin/guru |
| `POST` | `/api/auth/siswa-login` | Login siswa (NIS/NISN) |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/session` | Cek session aktif |
| `POST` | `/api/auth/forgot-password` | Request reset password |
| `POST` | `/api/auth/reset-password` | Reset password dengan token |
| `POST` | `/api/auth/change-password` | Ganti password |
| `POST` | `/api/auth/profile-photo` | Upload foto profil |

### SuperAdmin

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/superadmin/stats` | Statistik platform |
| `GET/POST` | `/api/superadmin/schools` | List & create sekolah |
| `GET/PUT/DELETE` | `/api/superadmin/schools/[id]` | CRUD sekolah by ID |
| `GET/POST` | `/api/superadmin/tiers` | List & create tier |
| `GET/POST` | `/api/superadmin/notifications` | Kelola notifikasi platform |
| `POST` | `/api/superadmin/broadcast` | Kirim broadcast email |
| `GET/POST` | `/api/superadmin/smtp` | Konfigurasi SMTP |
| `GET/POST` | `/api/superadmin/landing-media` | Kelola media landing page |
| `POST` | `/api/superadmin/auth/login` | Login superadmin |
| `GET` | `/api/superadmin/auth/session` | Session superadmin |

### Admin

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET/POST` | `/api/guru` | List & create guru |
| `GET/PUT/DELETE` | `/api/guru/[id]` | CRUD guru by ID |
| `GET/POST` | `/api/siswa` | List & create siswa |
| `POST` | `/api/admin/siswa/import` | Import siswa dari Excel |
| `GET/POST` | `/api/kelas` | List & create kelas |
| `GET/POST` | `/api/mapel` | List & create mapel |
| `GET/POST` | `/api/admin/ujian-access` | Kelola token ujian |
| `GET/POST` | `/api/presensi` | Manajemen presensi |
| `POST` | `/api/presensi/scan` | Scan QR presensi |
| `GET` | `/api/kartu-pelajar` | Data kartu pelajar |
| `GET/PUT` | `/api/info-masuk` | Info jam masuk/pulang |
| `GET/PUT` | `/api/sekolah-info` | Info & pengaturan sekolah |
| `GET` | `/api/dashboard/stats` | Statistik dashboard admin |
| `GET` | `/api/dashboard/activities` | Aktivitas terbaru |

### Guru

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/guru/dashboard` | Dashboard statistik guru |
| `GET/POST` | `/api/guru/ujian` | List & create ujian |
| `GET/PUT/DELETE` | `/api/guru/ujian/[id]` | CRUD ujian by ID |
| `GET/POST` | `/api/guru/ujian/[id]/soal` | List & create soal |
| `PUT/DELETE` | `/api/guru/ujian/[id]/soal/[soalId]` | Update/delete soal |
| `GET` | `/api/guru/ujian/[id]/nilai` | Lihat nilai submission |
| `PUT` | `/api/guru/ujian/[id]/nilai/[submissionId]` | Grade submission |
| `POST` | `/api/guru/ujian/[id]/nilai/recalculate` | Hitung ulang nilai |
| `POST` | `/api/guru/ai-chatbot` | AI chatbot interaction |
| `GET/POST` | `/api/guru/tugas` | CRUD tugas |
| `GET/PUT/DELETE` | `/api/guru/tugas/[id]` | CRUD tugas by ID |
| `POST` | `/api/guru/submissions/grade` | Nilai tugas siswa |
| `GET/POST` | `/api/guru/materi` | CRUD materi |
| `GET` | `/api/guru/jadwal` | Jadwal mengajar |
| `GET/PUT` | `/api/guru/nilai` | Rekap nilai siswa |
| `GET/PUT` | `/api/guru/settings/grade-config` | Konfigurasi bobot nilai |

### Siswa

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/siswa/dashboard` | Dashboard statistik siswa |
| `GET` | `/api/siswa/ujian` | List ujian tersedia |
| `GET` | `/api/siswa/ujian/[id]` | Detail ujian + soal |
| `POST` | `/api/siswa/ujian/[id]/save-answer` | Auto-save jawaban |
| `POST` | `/api/siswa/ujian/[id]/submit` | Submit ujian |
| `POST` | `/api/siswa/ujian/[id]/submit-enhanced` | Enhanced submit |
| `GET` | `/api/siswa/ujian/[id]/time-remaining` | Sisa waktu ujian |
| `GET` | `/api/siswa/ujian/[id]/hasil` | Hasil ujian |
| `POST` | `/api/siswa/ujian/validate-token` | Validasi token ujian |
| `GET/POST` | `/api/siswa/tugas` | List & submit tugas |
| `GET/POST` | `/api/siswa/tugas/[id]` | Detail & submit tugas |
| `GET` | `/api/siswa/materi` | List materi |
| `GET` | `/api/siswa/raport` | Data raport |

### Utility

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/upload` | Upload file (local) |
| `POST` | `/api/upload/r2` | Upload file ke Cloudflare R2/S3 |
| `POST` | `/api/word/parse-claude` | Parse dokumen Word dengan AI Claude |
| `POST` | `/api/word/parse-mammoth` | Parse dokumen Word dengan Mammoth |
| `POST` | `/api/word/extract-math` | Extract rumus matematika dari dokumen |
| `GET` | `/api/notifications` | Get notifikasi platform untuk user |
| `POST` | `/api/whatsapp` | Kirim notifikasi WhatsApp |
| `POST` | `/api/cron/daily-alpha` | Cron: auto-alpha presensi harian |
| `GET` | `/api/school/info` | Info sekolah (tenant) |
| `GET` | `/api/school/tier` | Info tier sekolah |
| `GET` | `/api/public/tiers` | List tier publik (landing page) |
| `GET` | `/api/public/landing-media` | Media landing page |

---

## Sistem Tier / Langganan

Platform mendukung sistem tier untuk membatasi resource per sekolah:

| Tier | Max Siswa | Max Guru | Max Kelas | Max Mapel | Max Ujian/bln | Storage |
|------|-----------|----------|-----------|-----------|---------------|---------|
| **Trial** | 50 | 5 | 5 | 10 | 10 | 500 MB |
| **Starter** | 100 | 10 | 10 | 20 | 25 | 1 GB |
| **Basic** | 300 | 25 | 20 | 30 | 50 | 2 GB |
| **Professional** | 1000 | 50 | 50 | 50 | Unlimited | 5 GB |
| **Enterprise** | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited | 10 GB |

Setiap tier juga memiliki **feature flags** (JSON) untuk mengontrol fitur seperti AI chatbot, export PDF, dll.

---

## Scripts

```bash
# Development
npm run dev                          # Start dev server (port 3000)
npm run build                        # Build production (prisma generate + next build)
npm run start                        # Start production server

# Database
npx prisma generate                  # Generate Prisma Client
npx prisma db push                   # Push schema ke database
npx prisma migrate dev               # Jalankan migrasi
npx prisma db seed                   # Seed data awal
npx prisma studio                    # Buka Prisma Studio (GUI)

# Seed tambahan
npm run seed:info-masuk              # Seed info masuk/pulang
npm run seed:dummy-ujian             # Seed ujian dummy

# Code Quality
npm run lint                         # Biome linter
npm run format                       # Biome formatter
npm run check                        # Biome check
npx @biomejs/biome check --write     # Auto-fix lint & format
```

---

## Deployment

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

Platform sudah dikonfigurasi untuk deploy ke Coolify:
- `Dockerfile` multi-stage build (deps → builder → runner)
- `nixpacks.toml` sebagai alternatif build
- Environment variables diinject saat runtime
- Standalone output untuk ukuran image minimal

### Vercel

```bash
vercel deploy
```

Konfigurasi di `vercel.json` sudah tersedia.

---

## Environment Variables

| Variable | Required | Deskripsi |
|----------|----------|-----------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection (untuk migrations) |
| `SESSION_SECRET` | ✅ | Secret key untuk iron-session (min 32 chars) |
| `ANTHROPIC_API_KEY` | ⚠️ | API key Anthropic Claude (AI chatbot) |
| `GROQ_API_KEY` | ⚠️ | API key Groq (fallback AI) |
| `R2_ACCESS_KEY_ID` | ⚠️ | Cloudflare R2 access key (file upload) |
| `R2_SECRET_ACCESS_KEY` | ⚠️ | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | ⚠️ | R2 bucket name |
| `R2_ENDPOINT` | ⚠️ | R2 endpoint URL |
| `R2_PUBLIC_URL` | ⚠️ | R2 public URL untuk akses file |
| `NEXT_PUBLIC_APP_URL` | ❌ | Base URL aplikasi |

> ✅ = Wajib | ⚠️ = Diperlukan untuk fitur tertentu | ❌ = Opsional

---

## Statistik Proyek

| Metrik | Jumlah |
|--------|--------|
| **Total Source Files** | 480+ files |
| **UI Components** | 64 reusable components |
| **TipTap UI Components** | 39 components |
| **TipTap Custom Nodes** | 12 nodes |
| **API Endpoints** | 60+ REST endpoints |
| **Database Models** | 25+ models |
| **Custom Hooks** | 14 hooks |
| **Tipe Soal** | 5 tipe |
| **User Roles** | 4 roles (SuperAdmin, Admin, Guru, Siswa) |
| **AI Providers** | 2 providers (Anthropic, Groq) |
| **Prisma Migrations** | 16 migrations |

---

## Changelog

Lihat [CHANGELOG.md](./CHANGELOG.md) untuk daftar lengkap perubahan.

Lihat [DOCUMENTATION.md](./DOCUMENTATION.md) untuk dokumentasi teknis lengkap.

---

## Lisensi

&copy; 2025 **PT Core Solution Digital**. All rights reserved.

## Pengembang

Dikembangkan oleh **PT Core Solution Digital** untuk dunia pendidikan Indonesia.
