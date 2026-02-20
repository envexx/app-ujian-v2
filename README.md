# LMS - Learning Management School

Sistem Manajemen Pembelajaran (LMS) dengan arsitektur terpisah antara Frontend dan Backend.

## 📁 Struktur Proyek

```
LMS---Learning-Management-School/
├── backend/          # Backend API (Hono + AWS Lambda)
├── frontend/         # Frontend Web (Next.js + Cloudflare Pages)
├── README.md         # Dokumentasi ini
└── LICENSE
```

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database dan JWT secret
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 2. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local dengan URL backend API
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                         │
│                    (Frontend - Next.js)                     │
│                    Port: 3000                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS LAMBDA + API GATEWAY                 │
│                    (Backend - Hono)                         │
│                    Port: 5000 (dev)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma + Neon Adapter
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEON POSTGRESQL                          │
│                    (Serverless Database)                    │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Tech Stack

### Backend
- **Framework**: Hono (lightweight, fast)
- **Runtime**: AWS Lambda / Node.js
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma
- **Auth**: JWT (jose)
- **Validation**: Zod
- **Deployment**: SST (Serverless Stack)

### Frontend
- **Framework**: Next.js 15+
- **Runtime**: Edge (Cloudflare Pages)
- **Styling**: TailwindCSS
- **State**: SWR, Zustand
- **UI**: Radix UI, Phosphor Icons

## 🔐 Authentication

Sistem menggunakan JWT (JSON Web Token) untuk autentikasi:

1. User login → Backend mengembalikan JWT token
2. Frontend menyimpan token di `localStorage`
3. Setiap request ke backend menyertakan `Authorization: Bearer <token>`
4. Backend memvalidasi token dan mengekstrak user info

## 📚 Dokumentasi Lengkap

- [Backend README](./backend/README.md) - Setup dan deployment backend
- [Frontend README](./frontend/README.md) - Setup dan deployment frontend

## 📄 License

MIT License - Lihat file [LICENSE](./LICENSE) untuk detail.
