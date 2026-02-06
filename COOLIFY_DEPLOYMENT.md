# Coolify Deployment Guide

## ⚠️ Masalah yang Ditemukan

1. **Node.js Version**: Coolify menggunakan Node.js 18 (EOL), tapi project memerlukan Node.js 20+
2. **Prisma Version**: Project menggunakan Prisma 6.4.0 (stable) untuk kompatibilitas
3. **Database SSL**: Coolify PostgreSQL tidak support SSL, perlu disable di konfigurasi

## ✅ Solusi (2 Opsi)

### OPSI 1: Gunakan Custom Dockerfile (RECOMMENDED) ⭐

Dockerfile custom sudah dibuat dan aman (tidak ada secrets di build time).

**Di Coolify Dashboard:**

1. Buka aplikasi Anda
2. Pergi ke **Configuration** → **Build Pack**
3. Ganti dari `nixpacks` ke `dockerfile`
4. Dockerfile path: `Dockerfile` (default)
5. **PENTING**: Set semua Environment Variables di Settings → Environment Variables:
   ```
   DATABASE_URL=postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres
   SESSION_SECRET=your-secret-key-min-32-chars
   R2_ACCOUNT_ID=6d16bbd1d7b7b0aed592e9d62822a01e
   R2_ACCESS_KEY_ID=your-r2-access-key
   R2_SECRET_ACCESS_KEY=your-r2-secret-key
   R2_BUCKET_NAME=your-bucket-name
   R2_PUBLIC_URL=https://pub-48d5f2d21ee94c799a380b5db2425529.r2.dev
   WHATSAPP_API_KEY=your-whatsapp-key (optional)
   ANTHROPIC_API_KEY=your-anthropic-key (optional)
   CRON_SECRET=your-cron-secret (optional)
   DIRECT_URL=postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres
   ```
6. Save dan redeploy

**Mengapa Dockerfile lebih baik?**
- ✅ Menggunakan Node.js 20 LTS yang stabil
- ✅ Tidak ada secrets di build time (lebih aman)
- ✅ Build lebih cepat dengan multi-stage
- ✅ Tidak bergantung pada Nixpacks cache

### OPSI 2: Fix Nixpacks Version

**Masalah saat ini:** Node.js 22.11.0 tidak memenuhi requirement Prisma (perlu 22.12+)

**Solusi:**

1. Buka Coolify Dashboard → aplikasi Anda
2. **Settings** → **Environment Variables**
3. **Ubah `NIXPACKS_NODE_VERSION` dari `22` ke `20`**:
   ```
   NIXPACKS_NODE_VERSION=20
   ```
4. **Configuration** → **General** → Clear Build Cache (hapus cache Node.js 22.11)
5. Save dan redeploy

**Catatan:** Node.js 20 LTS lebih stabil dan memenuhi semua requirement.

### 2. Setup Database (Migration & Seeder)

Setelah deployment berhasil, Anda perlu setup database:

1. **Buka Terminal di Coolify**
   - Dashboard → Aplikasi Anda → **Terminal** tab

2. **Jalankan Migration**
   ```bash
   npx prisma migrate deploy
   ```

3. **Jalankan Seeder (Optional - Initial Data)**
   ```bash
   npx prisma db seed
   ```

⚠️ **Catatan**: Seeder akan menghapus semua data existing dan membuat data dummy.
Lihat file `DATABASE_SETUP.md` untuk detail lengkap.

---

### 3. Mengatasi Secrets Warning

**Masalah**: Nixpacks auto-generate Dockerfile dengan ARG/ENV untuk secrets

**Solusi**: 
1. **Nonaktifkan Nixpacks** dan gunakan Dockerfile custom:
   - Di Coolify Dashboard → Application Settings
   - Cari opsi "Build Pack" atau "Build Method"
   - Pilih "Dockerfile" instead of "Nixpacks"
   - Dockerfile sudah tersedia di root project

2. **Atau tetap gunakan Nixpacks** (warning akan tetap muncul tapi tidak berbahaya):
   - Warning hanya peringatan, tidak akan memblokir deployment
   - Secrets tetap aman karena di-inject saat runtime
   - Pastikan secrets di-set di Coolify Environment Variables, bukan di Dockerfile

### 3. Environment Variables yang Perlu Di-set di Coolify

Pastikan semua environment variables ini di-set di **Coolify Dashboard → Environment Variables**:

```env
# Node.js Version (untuk Nixpacks)
NIXPACKS_NODE_VERSION=20

# Database
DATABASE_URL=postgres://postgres:PASSWORD@31.97.67.141:5436/postgres

# Session
SESSION_SECRET=your-secret-key-minimum-32-characters-long

# Cloudflare R2
R2_ACCOUNT_ID=6d16bbd1d7b7b0aed592e9d62822a01e
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=e-learning
R2_PUBLIC_URL=https://pub-48d5f2d21ee94c799a380b5db2425529.r2.dev

# APIs
ANTHROPIC_API_KEY=your-anthropic-api-key
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_API_URL=https://api.moonwa.id/api/send-message

# Cron
CRON_SECRET=your-cron-secret

# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 📋 Checklist Deployment

- [ ] Set `NIXPACKS_NODE_VERSION=20` di Coolify Environment Variables
- [ ] Atau nonaktifkan Nixpacks dan gunakan Dockerfile custom
- [ ] Set semua environment variables di Coolify Dashboard
- [ ] Pastikan database sudah running dan accessible
- [ ] Run migrations setelah deployment pertama:
  ```bash
  # Via Coolify Terminal atau SSH
  npx prisma migrate deploy
  npx prisma generate
  ```

## 🔧 Troubleshooting

### Error: "Prisma only supports Node.js versions 20.19+"
**Solusi**: Set `NIXPACKS_NODE_VERSION=20` atau `22` di Coolify Environment Variables

### Warning: "SecretsUsedInArgOrEnv"
**Solusi**: 
- Nonaktifkan Nixpacks dan gunakan Dockerfile custom, atau
- Abaikan warning (tidak berbahaya jika secrets di-set di runtime)

### Build Fails dengan Node.js 18
**Solusi**: Pastikan `NIXPACKS_NODE_VERSION=20` sudah di-set di Coolify

## 📝 Catatan

- File `nixpacks.toml` sudah dibuat untuk konfigurasi Nixpacks
- File `.nvmrc` dan `.node-version` sudah dibuat untuk menentukan Node.js version
- Dockerfile custom sudah tersedia jika ingin nonaktifkan Nixpacks
- Semua secrets harus di-set di Coolify Environment Variables, bukan di kode
