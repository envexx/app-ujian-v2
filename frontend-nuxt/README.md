# E-Learning System - Nuxt.js Frontend

Frontend aplikasi E-Learning yang dibangun dengan Nuxt.js 3 dan Vue 3.

## Tech Stack

- **Framework**: Nuxt.js 3
- **UI Framework**: Vue 3 + Composition API
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Icons**: Nuxt Icon (Phosphor Icons)
- **HTTP Client**: Native Fetch API
- **Notifications**: Vue Sonner
- **Deployment**: Cloudflare Pages

## Struktur Folder

```
frontend-nuxt/
├── assets/
│   └── css/
│       └── main.css          # Global styles & Tailwind
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── AdminHeader.vue
│   ├── AdminSidebar.vue
│   ├── GuruHeader.vue
│   ├── GuruSidebar.vue
│   └── SiswaHeader.vue
├── composables/
│   └── useAuth.ts            # Authentication composable
├── layouts/
│   ├── default.vue
│   ├── admin.vue
│   ├── guru.vue
│   └── siswa.vue
├── middleware/
│   └── auth.ts               # Auth middleware
├── pages/
│   ├── index.vue             # Login siswa
│   ├── admin-guru.vue        # Login admin/guru
│   ├── admin/                # Admin pages
│   ├── guru/                 # Guru pages
│   └── siswa/                # Siswa pages
├── public/
│   ├── icon/                 # App icons
│   └── avatars/              # Avatar images
├── stores/
│   └── auth.ts               # Pinia auth store
├── utils/
│   ├── api.ts                # API utilities
│   └── cn.ts                 # Class name utilities
├── nuxt.config.ts            # Nuxt configuration
├── tailwind.config.ts        # Tailwind configuration
└── wrangler.toml             # Cloudflare config
```

## Setup & Development

### Prerequisites

- Node.js 18+
- npm atau pnpm

### Installation

```bash
# Install dependencies
npm install

# Generate Nuxt types
npm run postinstall
```

### Development

```bash
# Start development server
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### Environment Variables

Buat file `.env` dari `.env.example`:

```bash
cp .env.example .env
```

Konfigurasi:

```env
# Backend API URL
NUXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Build & Deployment

### Build untuk Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy ke Cloudflare Pages

1. **Via Cloudflare Dashboard:**
   - Connect repository ke Cloudflare Pages
   - Build command: `npm run build`
   - Build output directory: `.output/public`
   - Environment variables: Set `NUXT_PUBLIC_API_URL`

2. **Via Wrangler CLI:**
   ```bash
   npx wrangler pages deploy .output/public
   ```

## Fitur

### Siswa
- Login dengan NISN
- Dashboard dengan statistik
- Daftar ujian
- Mengerjakan ujian
- Lihat hasil/raport

### Guru
- Dashboard dengan statistik
- Manajemen ujian
- Bank soal
- Lihat nilai siswa

### Admin
- Dashboard dengan statistik
- Manajemen siswa
- Manajemen guru
- Manajemen kelas
- Manajemen mata pelajaran
- Token ujian

## API Integration

Frontend berkomunikasi dengan backend melalui REST API. Semua request menggunakan cookies untuk autentikasi (Lucia Auth).

Base URL dikonfigurasi melalui environment variable `NUXT_PUBLIC_API_URL`.

## Notes

- Semua lint errors yang muncul sebelum `npm install` adalah normal karena Nuxt auto-imports belum tersedia
- Setelah `npm install` dan `npm run postinstall`, errors akan hilang
- Pastikan backend sudah berjalan sebelum testing
