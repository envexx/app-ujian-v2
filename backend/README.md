# LMS Backend API

Backend API untuk Learning Management System menggunakan **Hono** framework, dioptimasi untuk deployment di **AWS Lambda + API Gateway**.

## Tech Stack

- **Hono** - Ultrafast web framework
- **Prisma** - Database ORM
- **Neon PostgreSQL** - Serverless database
- **JWT (jose)** - Authentication
- **Zod** - Validation
- **SST** - AWS deployment framework

## Struktur Folder

```
backend/
├── src/
│   ├── index.ts          # Entry point untuk development
│   ├── lambda.ts         # Entry point untuk AWS Lambda
│   ├── lib/
│   │   ├── prisma.ts     # Prisma client
│   │   ├── jwt.ts        # JWT utilities
│   │   ├── query-helpers.ts
│   │   └── tier-limits.ts
│   ├── middleware/
│   │   ├── auth.ts       # Authentication middleware
│   │   └── cors.ts       # CORS configuration
│   └── routes/
│       ├── index.ts      # Route aggregator
│       ├── auth.ts       # /api/auth/*
│       ├── dashboard.ts  # /api/dashboard/*
│       ├── guru.ts       # /api/guru/*
│       ├── siswa.ts      # /api/siswa/*
│       ├── kelas.ts      # /api/kelas/*
│       └── mapel.ts      # /api/mapel/*
├── package.json
├── tsconfig.json
├── sst.config.ts         # AWS deployment config
└── .env.example
```

## Setup Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Setup Prisma (symlink dari root project):**
   ```bash
   # Windows (PowerShell as Admin)
   mklink /D prisma ..\prisma
   
   # Linux/Mac
   ln -s ../prisma prisma
   ```

3. **Copy environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env dengan nilai yang sesuai
   ```

4. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

5. **Run development server:**
   ```bash
   npm run dev
   ```

   Server akan berjalan di `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh JWT token

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activities` - Get recent activities

### Guru
- `GET /api/guru` - List all guru
- `POST /api/guru` - Create guru (Admin only)
- `PUT /api/guru/:id` - Update guru (Admin only)
- `DELETE /api/guru/:id` - Delete guru (Admin only)

### Siswa
- `GET /api/siswa` - List all siswa
- `POST /api/siswa` - Create siswa (Admin only)
- `PUT /api/siswa/:id` - Update siswa (Admin only)
- `DELETE /api/siswa/:id` - Delete siswa (Admin only)

### Kelas
- `GET /api/kelas` - List all kelas
- `POST /api/kelas` - Create kelas (Admin only)
- `PUT /api/kelas/:id` - Update kelas (Admin only)
- `DELETE /api/kelas/:id` - Delete kelas (Admin only)

### Mata Pelajaran
- `GET /api/mapel` - List all mata pelajaran
- `POST /api/mapel` - Create mapel (Admin only)
- `PUT /api/mapel/:id` - Update mapel (Admin only)
- `DELETE /api/mapel/:id` - Delete mapel (Admin only)

## Deployment ke AWS

### Menggunakan SST

1. **Install SST CLI:**
   ```bash
   npm install -g sst
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

3. **Deploy ke staging:**
   ```bash
   npm run deploy
   ```

4. **Deploy ke production:**
   ```bash
   npm run deploy:prod
   ```

### Environment Variables di AWS

Set environment variables berikut di AWS Lambda atau SST:

- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret key untuk JWT (min 32 chars)
- `FRONTEND_URL` - URL frontend di Cloudflare Pages

## Authentication

API menggunakan JWT Bearer token. Setelah login, client harus menyimpan token dan mengirimkannya di header:

```
Authorization: Bearer <token>
```

Token berlaku selama 8 jam dan dapat di-refresh menggunakan endpoint `/api/auth/refresh`.

## Multi-tenancy

Sistem mendukung multi-tenant (multi-sekolah). Setiap request akan di-filter berdasarkan `schoolId` dari JWT token, kecuali untuk SUPERADMIN yang dapat mengakses semua data.
