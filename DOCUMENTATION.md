# 📚 E-Learning Platform — Dokumentasi Lengkap

## Sistem Manajemen Pembelajaran & Ujian Online Berbasis AI

---

## 📋 Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Fitur Lengkap](#4-fitur-lengkap)
5. [Struktur Database](#5-struktur-database)
6. [Struktur Folder](#6-struktur-folder)
7. [API Endpoints](#7-api-endpoints)
8. [Sistem Ujian & Soal Multi-Type](#8-sistem-ujian--soal-multi-type)
9. [AI Chatbot Assistant](#9-ai-chatbot-assistant)
10. [Sistem Autentikasi & Otorisasi](#10-sistem-autentikasi--otorisasi)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)
13. [Cara Menjalankan](#13-cara-menjalankan)

---

## 1. Ringkasan Proyek

**E-Learning Platform** adalah sistem manajemen pembelajaran (LMS) berbasis web yang dirancang khusus untuk sekolah menengah di Indonesia. Platform ini menghubungkan tiga peran utama — **Admin**, **Guru**, dan **Siswa** — dalam satu ekosistem digital yang terintegrasi.

### Keunggulan Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Ujian Online Multi-Type** | Mendukung 5 tipe soal: Pilihan Ganda, Essay, Isian Singkat, Benar/Salah, dan Pencocokan (Matching) |
| **AI-Powered Question Generator** | Chatbot AI (Claude Sonnet) yang bisa membuat ujian + soal secara otomatis dari perintah natural language |
| **Auto-Grading** | Penilaian otomatis untuk soal objektif (PG, Isian Singkat, Benar/Salah, Pencocokan) |
| **Rich Text Editor** | Editor TipTap dengan dukungan gambar, rumus matematika (KaTeX/MathJax), formatting lengkap |
| **Token-Based Exam Access** | Sistem token 6-digit yang dikontrol admin untuk mengakses ujian — mencegah kecurangan |
| **Real-time Dashboard** | Dashboard analitik untuk setiap peran dengan statistik dan grafik |
| **Multi-Platform** | Responsive design, bisa diakses dari desktop dan mobile |
| **Docker-Ready** | Siap deploy ke production dengan Docker dan Coolify |

### Target Pengguna

- **Sekolah Menengah Pertama (SMP)** dan **Sekolah Menengah Atas (SMA)** di Indonesia
- Mendukung kurikulum Indonesia dengan bahasa Indonesia sebagai bahasa utama

---

## 2. Tech Stack

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.x | Framework React full-stack dengan App Router |
| **React** | 19.x | UI library dengan React Compiler enabled |
| **TypeScript** | 5.9 | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Radix UI** | Latest | Headless UI primitives (Dialog, Dropdown, Popover, dll) |
| **Lucide React** | Latest | Icon library |
| **TipTap** | 3.x | Rich text editor (WYSIWYG) |
| **Recharts** | 2.x | Charting library untuk dashboard |
| **React Hook Form** | 7.x | Form management |
| **Zod** | 3.x | Schema validation |
| **TanStack Table** | 8.x | Data table dengan sorting, filtering, pagination |
| **TanStack Query** | 5.x | Server state management |
| **SWR** | 2.x | Data fetching & caching |
| **Zustand** | 5.x | Client state management |
| **dnd-kit** | Latest | Drag & drop untuk reorder soal |
| **Embla Carousel** | 8.x | Carousel component |
| **KaTeX / MathJax** | Latest | Rendering rumus matematika |
| **next-themes** | Latest | Dark/light mode |
| **Sonner** | 2.x | Toast notifications |
| **cmdk** | Latest | Command palette |
| **date-fns** | 3.x | Date manipulation |

### Backend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js API Routes** | 16.x | RESTful API endpoints (App Router) |
| **Prisma ORM** | 6.x | Database ORM dengan type-safe queries |
| **PostgreSQL** | Latest | Primary database |
| **iron-session** | 8.x | Encrypted cookie-based session management |
| **bcryptjs** | 3.x | Password hashing |
| **jose** | 6.x | JWT token handling |
| **Axios** | 1.x | HTTP client untuk API calls |

### AI & Cloud Services

| Teknologi | Fungsi |
|-----------|--------|
| **Anthropic Claude Sonnet 4** | AI utama untuk generate soal & chatbot assistant |
| **Groq (Llama 3.3 70B)** | AI alternatif/fallback |
| **AWS S3 / Cloudflare R2** | Object storage untuk file upload |

### DevOps & Tooling

| Teknologi | Fungsi |
|-----------|--------|
| **Docker** | Containerization (multi-stage build) |
| **Coolify** | Self-hosted deployment platform |
| **Biome** | Linter & formatter (pengganti ESLint + Prettier) |
| **Nixpacks** | Alternative build system |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Admin   │  │   Guru   │  │  Siswa   │  │  Login  │ │
│  │Dashboard │  │Dashboard │  │Dashboard │  │  Pages  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │      │
│       └──────────────┴──────────────┴──────────────┘      │
│                          │                                │
│                   React Components                        │
│              (TipTap, Recharts, dnd-kit,                  │
│               AI Chat Bubble, Data Tables)                │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┴──────────────────────────────┐
│                   NEXT.JS SERVER                         │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              API Routes (/api/*)                     │ │
│  │                                                     │ │
│  │  /api/auth/*        → Authentication & Sessions     │ │
│  │  /api/admin/*       → Admin management              │ │
│  │  /api/guru/*        → Teacher operations            │ │
│  │  /api/siswa/*       → Student operations            │ │
│  │  /api/guru/ai-chatbot → AI Chatbot endpoint         │ │
│  │  /api/upload/*      → File upload (S3/R2)           │ │
│  │  /api/word/*        → Document parsing (Claude)     │ │
│  └──────────┬──────────────────────────┬───────────────┘ │
│             │                          │                  │
│  ┌──────────┴──────────┐  ┌───────────┴────────────────┐ │
│  │    Prisma ORM       │  │    AI Service Layer        │ │
│  │  (Type-safe DB)     │  │  (Anthropic / Groq)        │ │
│  └──────────┬──────────┘  └───────────┬────────────────┘ │
└─────────────┼─────────────────────────┼─────────────────┘
              │                         │
    ┌─────────┴─────────┐    ┌─────────┴──────────┐
    │   PostgreSQL DB   │    │  Cloud AI APIs      │
    │                   │    │  - Anthropic Claude  │
    │  - Users          │    │  - Groq Llama       │
    │  - Guru/Siswa     │    └────────────────────┘
    │  - Ujian/Soal     │
    │  - Submissions    │    ┌────────────────────┐
    │  - Presensi       │    │  Object Storage    │
    │  - Materi/Tugas   │    │  (S3 / R2)         │
    └───────────────────┘    └────────────────────┘
```

### Request Flow

```
User Action → React Component → API Route → Prisma → PostgreSQL
                                    ↓
                              AI Service (jika perlu)
                                    ↓
                              Anthropic/Groq API
                                    ↓
                              Parsed Response → DB Save → Client Update
```

---

## 4. Fitur Lengkap

### 4.1 Panel Admin

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Analitik** | Statistik keseluruhan sekolah (jumlah guru, siswa, kelas, ujian) |
| **Manajemen Guru** | CRUD data guru, assign mata pelajaran & kelas |
| **Manajemen Siswa** | CRUD data siswa, assign ke kelas |
| **Manajemen Kelas** | CRUD kelas, set wali kelas |
| **Manajemen Mata Pelajaran** | CRUD mapel dengan kode unik |
| **Token Ujian** | Generate & kelola token 6-digit untuk akses ujian siswa |
| **Presensi** | Kelola presensi siswa (hadir, izin, sakit, alpha) dengan QR scan |
| **Kartu Pelajar** | Generate kartu pelajar digital dengan QR code |
| **Info Masuk/Pulang** | Konfigurasi jam masuk & pulang per hari |
| **Pengaturan Sekolah** | Informasi sekolah, logo, kepala sekolah, tahun ajaran |

### 4.2 Panel Guru

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Statistik personal (jumlah ujian, siswa, tugas, rata-rata nilai) |
| **Manajemen Ujian** | Buat, edit, hapus ujian dengan status draft/aktif/selesai |
| **Editor Soal Multi-Type** | Buat soal dengan 5 tipe berbeda menggunakan rich text editor |
| **Drag & Drop Soal** | Reorder soal dengan drag & drop (dnd-kit) |
| **AI Chatbot Assistant** | Chatbot AI floating bubble untuk generate ujian + soal otomatis |
| **Penilaian Ujian** | Lihat submission siswa, auto-grade soal objektif, manual grade essay |
| **Manajemen Tugas** | Buat tugas dengan deadline, review submission siswa |
| **Manajemen Materi** | Upload materi pembelajaran (PDF, video, gambar, link) |
| **Jadwal Mengajar** | Lihat jadwal mengajar per hari |
| **Konfigurasi Nilai** | Set bobot penilaian (PG vs Essay) |
| **Print Ujian** | Cetak ujian ke format printable |
| **Import Soal dari Word** | Parse dokumen Word/PDF menggunakan AI untuk extract soal |

### 4.3 Panel Siswa

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Statistik personal (ujian mendatang, tugas pending, rata-rata nilai) |
| **Mengerjakan Ujian** | Interface ujian online dengan timer, navigasi soal, auto-save jawaban |
| **Token Verification** | Input token 6-digit sebelum akses ujian |
| **Lihat Hasil Ujian** | Review jawaban, lihat skor, feedback guru |
| **Mengerjakan Tugas** | Submit tugas via file upload atau link |
| **Akses Materi** | Lihat dan download materi pembelajaran |
| **Raport** | Lihat rekap nilai per mata pelajaran |

### 4.4 AI Chatbot (Guru)

| Fitur | Deskripsi |
|-------|-----------|
| **Natural Language Command** | Guru bisa perintah dalam bahasa Indonesia biasa |
| **Buat Ujian Otomatis** | "Buatkan ujian MID Bahasa Indonesia tanggal 20 Maret" |
| **Generate Soal Multi-Type** | "Buatkan 25 soal: 15 PG, 4 Essay, 3 Pencocokan, 3 B/S" |
| **Buat Ujian + Soal Sekaligus** | Satu perintah untuk buat ujian dan generate semua soal |
| **Distribusi Kesulitan** | Support pembagian mudah/medium/sulit |
| **Bobot Otomatis** | Total poin otomatis dikoreksi ke 100 |
| **Context-Aware** | AI tahu mapel, kelas, dan ujian yang sudah ada |
| **Confirmation Flow** | Selalu konfirmasi sebelum eksekusi aksi |
| **Auto-Refresh** | Dashboard otomatis update setelah AI buat ujian/soal |

---

## 5. Struktur Database

### Entity Relationship

```
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

### Model Utama

| Model | Deskripsi | Fields Penting |
|-------|-----------|----------------|
| **User** | Akun login | email, password (bcrypt), role (ADMIN/GURU/SISWA) |
| **Guru** | Data guru | nipUsername, nama, email, mapel[], kelas[] |
| **Siswa** | Data siswa | nisn, nis, nama, kelasId, tanggalLahir |
| **Kelas** | Data kelas | nama (7A, 8B, dll), tingkat, waliKelasId |
| **MataPelajaran** | Mata pelajaran | nama, kode, jenis, jamPerMinggu |
| **Ujian** | Data ujian | judul, mapelId, kelas[], startUjian, endUjian, status |
| **Soal** | Soal ujian | ujianId, tipe, urutan, pertanyaan, poin, data (JSON) |
| **JawabanSoal** | Jawaban siswa | submissionId, soalId, jawaban (JSON), nilai, isCorrect |
| **UjianSubmission** | Submission ujian | ujianId, siswaId, startedAt, submittedAt, nilai, status |
| **Tugas** | Data tugas | judul, instruksi, mapelId, kelas[], deadline |
| **TugasSubmission** | Submission tugas | tugasId, siswaId, fileUrl, nilai, feedback |
| **Materi** | Materi pembelajaran | judul, mapelId, kelas[], tipe, fileUrl |
| **Presensi** | Data presensi | siswaId, tanggal, status, tipe (masuk/pulang) |
| **SekolahInfo** | Info sekolah | namaSekolah, alamat, namaKepsek, tahunAjaran |
| **UjianAccessControl** | Token ujian | isActive, currentToken, tokenExpiresAt |
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

## 6. Struktur Folder

```
e-learning/
├── prisma/
│   ├── schema.prisma          # Database schema (20+ models)
│   ├── seed.ts                # Database seeder
│   ├── seed-info-masuk.ts     # Seeder info masuk/pulang
│   └── seed-dummy-ujian.ts    # Seeder dummy ujian
│
├── public/                    # Static assets (images, icons)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (providers, fonts)
│   │   ├── page.tsx           # Landing/login page siswa
│   │   ├── globals.css        # Global styles (Tailwind)
│   │   │
│   │   ├── (main)/            # Authenticated routes
│   │   │   ├── admin/         # Admin panel
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
│   │   │   │   ├── ujian/             # Manajemen ujian
│   │   │   │   │   ├── page.tsx       # List ujian
│   │   │   │   │   ├── create/        # Buat ujian baru
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx   # Detail ujian
│   │   │   │   │       ├── edit/      # Edit ujian + soal
│   │   │   │   │       ├── nilai/     # Penilaian siswa
│   │   │   │   │       └── print/     # Cetak ujian
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
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Login, logout, session
│   │   │   ├── admin/         # Admin APIs
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
│   │   │   ├── upload/        # File upload (S3/R2)
│   │   │   ├── word/          # Document parsing (Claude AI)
│   │   │   ├── whatsapp/      # WhatsApp notifications
│   │   │   └── cron/          # Scheduled tasks
│   │   │
│   │   └── login/             # Admin/Guru login page
│   │
│   ├── components/
│   │   ├── ai-chatbot/        # AI chatbot floating bubble
│   │   │   └── chat-bubble.tsx
│   │   ├── soal/              # Soal form components
│   │   │   ├── PilihanGandaForm.tsx
│   │   │   ├── EssayForm.tsx
│   │   │   ├── IsianSingkatForm.tsx
│   │   │   ├── BenarSalahForm.tsx
│   │   │   ├── PencocokanForm.tsx
│   │   │   ├── SoalItem.tsx
│   │   │   └── AddSoalDropdown.tsx
│   │   ├── tiptap/            # Rich text editor
│   │   ├── data-table/        # Reusable data table
│   │   └── ui/                # 60+ UI components (Radix-based)
│   │
│   ├── lib/
│   │   ├── ai-chatbot.ts      # AI service (Anthropic + Groq)
│   │   ├── api-client.ts      # Axios API client
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── session.ts         # iron-session config
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

## 7. API Endpoints

### Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login admin/guru |
| POST | `/api/auth/siswa-login` | Login siswa (NISN) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/session` | Get current session |

### Admin

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET/POST | `/api/admin/guru` | List & create guru |
| GET/PUT/DELETE | `/api/admin/guru/[id]` | CRUD guru by ID |
| GET/POST | `/api/admin/siswa` | List & create siswa |
| GET | `/api/kelas` | List kelas |
| GET | `/api/mapel` | List mata pelajaran |
| GET/POST | `/api/presensi` | Presensi management |
| GET/POST | `/api/info-masuk` | Info masuk/pulang |

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
| GET/POST | `/api/guru/materi` | CRUD materi |
| GET | `/api/guru/jadwal` | Jadwal mengajar |
| GET | `/api/guru/submissions` | Review submissions |

### Siswa

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/siswa` | Get siswa profile |
| GET | `/api/siswa/dashboard` | Dashboard statistics |
| GET | `/api/siswa/ujian` | List ujian tersedia |
| GET | `/api/siswa/ujian/[id]` | Get ujian detail + soal |
| POST | `/api/siswa/ujian/[id]/save-answer` | Auto-save jawaban |
| POST | `/api/siswa/ujian/[id]/submit` | Submit ujian |
| POST | `/api/siswa/ujian/[id]/submit-enhanced` | Enhanced submit |
| GET | `/api/siswa/ujian/[id]/time-remaining` | Sisa waktu ujian |
| GET | `/api/siswa/ujian/[id]/hasil` | Hasil ujian |
| POST | `/api/siswa/ujian/validate-token` | Validasi token ujian |
| GET/POST | `/api/siswa/tugas` | List & submit tugas |
| GET | `/api/siswa/materi` | List materi |
| GET | `/api/siswa/raport` | Data raport |

### Utility

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/upload/s3` | Upload file ke S3/R2 |
| POST | `/api/word/parse-claude` | Parse dokumen dengan AI |
| POST | `/api/whatsapp` | Kirim notifikasi WhatsApp |

---

## 8. Sistem Ujian & Soal Multi-Type

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

## 9. AI Chatbot Assistant

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

## 10. Sistem Autentikasi & Otorisasi

### Mekanisme

```
Login Request → bcrypt verify → iron-session cookie → Role-based routing
```

| Aspek | Detail |
|-------|--------|
| **Session** | Encrypted cookie via `iron-session` |
| **Password** | Hashed dengan `bcryptjs` |
| **Roles** | `ADMIN`, `GURU`, `SISWA` |
| **Login Admin/Guru** | Email + Password → `/login` |
| **Login Siswa** | NISN only → `/` (landing page) |
| **Route Protection** | Server-side session check di setiap API route |
| **Token Ujian** | 6-digit code, expires 2 menit, generated by admin |

### Role-Based Access

| Resource | Admin | Guru | Siswa |
|----------|-------|------|-------|
| Manajemen User | ✅ | ❌ | ❌ |
| Manajemen Kelas/Mapel | ✅ | ❌ | ❌ |
| Token Ujian | ✅ | ❌ | ❌ |
| Buat Ujian | ❌ | ✅ | ❌ |
| Buat Soal | ❌ | ✅ | ❌ |
| AI Chatbot | ❌ | ✅ | ❌ |
| Grade Submission | ❌ | ✅ | ❌ |
| Kerjakan Ujian | ❌ | ❌ | ✅ |
| Submit Tugas | ❌ | ❌ | ✅ |
| Lihat Raport | ❌ | ❌ | ✅ |

---

## 11. Deployment

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

## 12. Environment Variables

| Variable | Required | Deskripsi |
|----------|----------|-----------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | ✅ | PostgreSQL direct connection (untuk migrations) |
| `SESSION_SECRET` | ✅ | Secret key untuk iron-session encryption |
| `ANTHROPIC_API_KEY` | ⚠️ | API key Anthropic Claude (untuk AI chatbot) |
| `GROQ_API_KEY` | ⚠️ | API key Groq (fallback AI provider) |
| `R2_ACCESS_KEY_ID` | ⚠️ | Cloudflare R2 access key (file upload) |
| `R2_SECRET_ACCESS_KEY` | ⚠️ | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | ⚠️ | R2 bucket name |
| `R2_ENDPOINT` | ⚠️ | R2 endpoint URL |
| `R2_PUBLIC_URL` | ⚠️ | R2 public URL untuk akses file |
| `NEXT_PUBLIC_APP_URL` | ❌ | Base URL aplikasi |

> ⚠️ = Diperlukan untuk fitur tertentu (AI chatbot, file upload)

---

## 13. Cara Menjalankan

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+
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

# 6. Seed database (optional)
npx prisma db seed

# 7. Run development server
npm run dev
```

### Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Start development server |
| `npm run build` | Build production (prisma generate + next build) |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Format code with Biome |
| `npm run check` | Run Biome check |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |
| `npx prisma db push` | Push schema to database |
| `npx prisma db seed` | Seed database |

---

## 📊 Statistik Proyek

| Metrik | Jumlah |
|--------|--------|
| **Total Files** | 440+ source files |
| **UI Components** | 60+ reusable components |
| **API Endpoints** | 50+ REST endpoints |
| **Database Models** | 20 models |
| **Custom Hooks** | 14 hooks |
| **Tipe Soal** | 5 tipe |
| **User Roles** | 3 roles |
| **AI Providers** | 2 providers |

---

## 🏗️ Dibangun Dengan

Next.js 16 • React 19 • TypeScript 5.9 • Tailwind CSS 4 • Prisma 6 • PostgreSQL • Anthropic Claude Sonnet 4 • TipTap 3 • Radix UI • TanStack • Zustand • Docker

---

*Dokumentasi ini dibuat untuk menjelaskan arsitektur, fitur, dan detail teknis dari platform E-Learning secara komprehensif.*
