# E-Learning Management System

> Sistem Manajemen Pembelajaran (LMS) berbasis web untuk sekolah — dibangun dengan Next.js 15, TypeScript, Prisma ORM, dan PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## Tentang

E-Learning Management System adalah platform pembelajaran digital yang dirancang untuk sekolah menengah. Sistem ini mengintegrasikan manajemen ujian, tugas, penilaian, presensi, dan administrasi sekolah dalam satu platform terpadu dengan tiga portal: **Admin**, **Guru**, dan **Siswa**.

## Fitur Utama

### Sistem Ujian Online

| Fitur | Deskripsi |
|-------|-----------|
| **5 Tipe Soal** | Pilihan Ganda, Essay, Isian Singkat, Benar/Salah, Pencocokan |
| **Auto-Grading** | Penilaian otomatis untuk PG, Isian Singkat, Benar/Salah, dan Pencocokan (partial scoring) |
| **Manual Grading** | Penilaian manual oleh guru untuk soal Essay |
| **Poin-Based Scoring** | Total poin per ujian = 100, guru mengatur distribusi poin per soal |
| **Token Ujian** | Sistem keamanan akses ujian dengan token unik |
| **Auto-Save** | Jawaban tersimpan otomatis selama pengerjaan |
| **Print PDF** | Cetak soal ujian ke PDF untuk keperluan administrasi |
| **Visual Matching** | Garis penghubung SVG pada soal Pencocokan |

### Portal Siswa
- **Dashboard** — Ringkasan tugas, ujian mendatang, dan nilai terbaru
- **Ujian Online** — Kerjakan ujian dengan timer, auto-save, dan navigasi soal
- **Hasil Ujian** — Lihat skor, jawaban benar/salah, dan feedback guru
- **Tugas** — Lihat, download lampiran, dan submit tugas
- **Raport Digital** — Akses nilai per semester
- **Materi** — Akses materi pembelajaran dari guru
- **Login** — Masuk menggunakan NIS atau NISN

### Portal Guru
- **Dashboard** — Overview kelas, tugas, dan aktivitas terbaru
- **Manajemen Ujian** — Buat ujian dengan 5 tipe soal, atur poin, preview soal
- **Penilaian** — Auto-grade + manual grading essay, rekap nilai per siswa
- **Print Soal** — Cetak soal ujian dengan/tanpa kunci jawaban (format A4)
- **Manajemen Tugas** — Buat tugas, lampirkan file, nilai submission siswa
- **Jadwal Mengajar** — Kelola jadwal per kelas dan mata pelajaran
- **Upload Materi** — Bagikan materi pembelajaran ke siswa

### Portal Admin
- **Dashboard** — Statistik sekolah: jumlah guru, siswa, kelas
- **Manajemen Guru** — CRUD data guru dengan import Excel
- **Manajemen Siswa** — CRUD data siswa dengan import Excel (tanpa email wajib)
- **Manajemen Kelas** — Kelola kelas dan wali kelas
- **Mata Pelajaran** — Setup mapel dan guru pengampu
- **Token Ujian** — Generate dan kelola token akses ujian
- **Presensi** — Sistem presensi dengan QR Code
- **Kartu Pelajar** — Generate kartu pelajar digital
- **Pengaturan Sekolah** — Logo, nama, dan informasi sekolah

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **Icons** | Phosphor Icons, Lucide React |
| **State** | SWR (Stale-While-Revalidate) |
| **Auth** | Iron Session (cookie-based) |
| **Deployment** | Vercel |
| **Linting** | Biome |

## Cara Memulai

### Prasyarat

- Node.js 18+
- PostgreSQL 14+
- npm

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
npx prisma migrate dev
npm run seed
npx tsx prisma/seed-sekolah.ts

# 5. Jalankan development server
npm run dev
```

Aplikasi berjalan di [http://localhost:3000](http://localhost:3000)

### Konfigurasi Environment

Buat file `.env` di root project:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/elearning_db"

# Session Secret (gunakan random string yang kuat)
SESSION_SECRET="your-secret-key-min-32-characters"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Akun Default

Setelah seeding, gunakan kredensial berikut:

| Role | Email / NIS | Password |
|------|-------------|----------|
| **Admin** | `admin@sekolah.com` | `admin123` |
| **Guru** | `budi.hartono@sekolah.com` | `guru123` |
| **Siswa** | NIS atau NISN siswa | `siswa123` |

## Struktur Project

```
e-learning/
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Seed data utama
│   └── seed-sekolah.ts          # Seed data sekolah
├── public/
│   ├── uploads/                 # File uploads (tugas, materi)
│   └── avatars/                 # Foto profil
├── src/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── admin/           # Halaman admin
│   │   │   ├── guru/            # Halaman guru
│   │   │   │   └── ujian/
│   │   │   │       └── [id]/
│   │   │   │           ├── edit/    # Edit soal ujian
│   │   │   │           ├── nilai/   # Penilaian siswa
│   │   │   │           └── print/   # Print soal PDF
│   │   │   └── siswa/           # Halaman siswa
│   │   │       └── ujian/
│   │   │           └── [id]/
│   │   │               └── hasil/   # Hasil ujian
│   │   ├── api/                 # API routes
│   │   └── auth/                # Halaman login
│   ├── components/ui/           # Komponen UI (shadcn/ui)
│   ├── contexts/                # React contexts
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilities & konfigurasi
│   └── types/                   # TypeScript type definitions
│       └── soal.ts              # Tipe soal & auto-grading
├── .env                         # Environment variables
├── CHANGELOG.md                 # Log perubahan
└── package.json
```

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
| Pilihan Ganda | Otomatis | Benar = poin penuh, Salah = 0 |
| Isian Singkat | Otomatis | Cocok dengan kunci = poin penuh |
| Benar/Salah | Otomatis | Benar = poin penuh, Salah = 0 |
| Pencocokan | Otomatis (partial) | (pasangan benar / total pasangan) × poin |
| Essay | Manual oleh guru | Guru memberi nilai 0 s.d. poin soal |

**Nilai akhir = jumlah semua poin yang didapat** (tanpa rumus persentase).

## Autentikasi & Otorisasi

Sistem menggunakan **Iron Session** (cookie-based) dengan role-based access control:

| Role | Akses |
|------|-------|
| **Admin** | Full access — kelola guru, siswa, kelas, mapel, token, presensi |
| **Guru** | Kelola ujian, tugas, penilaian, materi, jadwal |
| **Siswa** | Kerjakan ujian & tugas, lihat nilai & raport, akses materi |

Siswa login menggunakan **NIS** atau **NISN** (tanpa email).

## Database Schema

Model utama (PostgreSQL + Prisma):

| Model | Deskripsi |
|-------|-----------|
| `User` | Akun login (admin, guru, siswa) |
| `Guru` | Data guru + relasi ke mapel dan kelas |
| `Siswa` | Data siswa + relasi ke kelas |
| `Kelas` | Data kelas + wali kelas |
| `MataPelajaran` | Mata pelajaran + guru pengampu |
| `Ujian` | Data ujian (jadwal, kelas, status) |
| `Soal` | Soal ujian — unified model untuk semua tipe |
| `UjianSubmission` | Submission ujian siswa |
| `JawabanSoal` | Jawaban per soal (nilai, isCorrect, feedback) |
| `Tugas` | Data tugas dari guru |
| `TugasSubmission` | Submission tugas siswa |
| `Nilai` | Rekap nilai per semester |
| `SekolahInfo` | Informasi dan branding sekolah |

## Scripts

```bash
# Development
npm run dev                          # Start dev server (port 3000)
npm run build                        # Build production
npm run start                        # Start production server

# Database
npx prisma generate                  # Generate Prisma Client
npx prisma migrate dev               # Jalankan migrasi
npx prisma db seed                   # Seed data awal
npx prisma studio                    # Buka Prisma Studio (GUI)

# Seed tambahan
npm run seed:info-masuk              # Seed info masuk
npm run seed:dummy-ujian             # Seed ujian dummy

# Code Quality
npx @biomejs/biome check --write     # Format & lint
```

## API Endpoints

### Autentikasi
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login admin/guru |
| `POST` | `/api/auth/siswa-login` | Login siswa (NIS/NISN) |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/session` | Cek session aktif |

### Admin
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET/POST` | `/api/admin/guru` | List & create guru |
| `GET/POST` | `/api/siswa` | List & create siswa |
| `POST` | `/api/admin/siswa/import` | Import siswa dari Excel |
| `GET/POST` | `/api/admin/kelas` | List & create kelas |
| `GET/POST` | `/api/admin/mapel` | List & create mapel |
| `GET/POST` | `/api/admin/token-ujian` | Kelola token ujian |

### Guru
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET/POST` | `/api/guru/ujian` | List & create ujian |
| `GET/PUT` | `/api/guru/ujian/[id]` | Detail & update ujian |
| `GET/PUT` | `/api/guru/ujian/[id]/nilai` | Penilaian ujian |
| `POST` | `/api/guru/ujian/[id]/nilai/recalculate` | Hitung ulang nilai |
| `GET/POST` | `/api/guru/tugas` | List & create tugas |
| `POST` | `/api/guru/submissions/grade` | Nilai tugas siswa |

### Siswa
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/siswa/ujian` | List ujian tersedia |
| `POST` | `/api/siswa/ujian/[id]/start` | Mulai ujian |
| `POST` | `/api/siswa/ujian/[id]/save-answer` | Simpan jawaban (auto-save) |
| `POST` | `/api/siswa/ujian/[id]/submit` | Submit ujian |
| `GET` | `/api/siswa/ujian/[id]/hasil` | Lihat hasil ujian |
| `GET` | `/api/siswa/tugas` | List tugas |

## Kustomisasi

### Tema
Mendukung light/dark mode dengan preset warna:
- Neutral (default)
- Tangerine
- Neo Brutalism
- Soft Pop

### Branding Sekolah
Logo dan nama sekolah dikonfigurasi melalui tabel `SekolahInfo` dan tampil otomatis di halaman login serta kartu pelajar.

## Changelog

Lihat [CHANGELOG.md](./CHANGELOG.md) untuk daftar lengkap perubahan.

## Lisensi

&copy; 2025 **PT Core Solution Digital**. All rights reserved.

## Pengembang

Dikembangkan oleh **PT Core Solution Digital** untuk dunia pendidikan Indonesia.
