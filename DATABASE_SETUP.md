# Database Setup untuk Production (Coolify)

## 📋 Prasyarat

Pastikan environment variables sudah di-set di Coolify:
- `DATABASE_URL=postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres`
- `DIRECT_URL=postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres`

---

## 🚀 Cara Menjalankan Migration & Seeder di Production

### Metode 1: Via Terminal Coolify (RECOMMENDED)

1. **Masuk ke Container via Coolify Dashboard**
   - Buka Coolify Dashboard
   - Pilih aplikasi Anda
   - Klik **Terminal** (tab di sebelah Logs)

2. **Cek Environment Variables**
   ```bash
   cd /app
   echo $DATABASE_URL
   ```
   
   **Jika kosong, environment variables tidak loaded.** Ada 2 cara:

3a. **Cara 1: Export Manual (Quick Fix)**
   ```bash
   export DATABASE_URL="postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres"
   
   # Verifikasi
   echo $DATABASE_URL
   ```

3b. **Cara 2: Load dari .env (Jika ada)**
   ```bash
   # Buat .env file sementara
   cat > .env << 'EOF'
   DATABASE_URL="postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres"
   DIRECT_URL="postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres"
   EOF
   ```
   
4. **Jalankan Migration**
   
   **Set DATABASE_URL dan jalankan migration:**
   ```bash
   cd /app
   export DATABASE_URL="postgres://postgres:T1ZjVSlg9DuhDVoDqq6EmGC81zufSuyyTGhpbX3DejKzZyCSLxsCCl8twkMaZj29@31.97.67.141:5436/postgres"
   
   ./node_modules/.bin/prisma migrate deploy
   ```
   
   Atau gunakan npx:
   ```bash
   npx prisma migrate deploy
   ```
   
5. **Jalankan Seeder**
   ```bash
   npx --yes tsx@4.21.0 prisma/seed.ts
   ```
   
   **Jika error SSL:** Database tidak support SSL. Sudah diperbaiki di `prisma/seed.ts`.

---

### Metode 2: Via SSH ke Server Coolify

1. **SSH ke Server Coolify**
   ```bash
   ssh user@31.97.67.141
   ```

2. **Cari Container ID**
   ```bash
   docker ps | grep e-learning
   ```

3. **Masuk ke Container**
   ```bash
   docker exec -it <container_id> sh
   ```

4. **Jalankan Migration**
   ```bash
   npx prisma migrate deploy
   ```

5. **Jalankan Seeder**
   ```bash
   npx prisma db seed
   ```

6. **Keluar dari Container**
   ```bash
   exit
   ```

---

### Metode 3: Otomatis saat Deployment (Startup Command)

⚠️ **PERHATIAN**: Metode ini akan menjalankan migration otomatis setiap deployment.
Untuk production, lebih baik gunakan Metode 1 atau 2 secara manual untuk seeding.

**Di Coolify Dashboard:**

1. Pergi ke **Configuration** → **General**
2. Scroll ke **Post Deployment Command**
3. Masukkan command (hanya migration, tanpa seeding):
   ```bash
   cd /app && ./node_modules/.bin/prisma migrate deploy
   ```

4. Save dan redeploy

**Atau jika ingin juga auto-seed (TIDAK DIREKOMENDASIKAN untuk production):**
   ```bash
   cd /app && ./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx prisma/seed.ts
   ```

---

## 📝 Command Reference

### Migration Commands

```bash
# Deploy pending migrations (production)
./node_modules/.bin/prisma migrate deploy

# Check migration status
./node_modules/.bin/prisma migrate status

# Generate Prisma Client (jika belum ter-generate)
./node_modules/.bin/prisma generate
```

### Seeder Commands

```bash
# Main seeder (prisma/seed.ts)
./node_modules/.bin/tsx prisma/seed.ts

# Custom seeders
./node_modules/.bin/tsx prisma/seed-info-masuk.ts
./node_modules/.bin/tsx prisma/seed-dummy-ujian.ts
```

### Database Commands

```bash
# Check database connection
./node_modules/.bin/prisma db pull --print

# Introspect database schema
./node_modules/.bin/prisma db pull

# Reset database (DANGER: Deletes all data!)
# DON'T USE IN PRODUCTION!
./node_modules/.bin/prisma migrate reset
```

**Alternatif dengan npx (download on-the-fly):**
```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

---

## 🔑 Login Credentials (After Seeding)

Setelah menjalankan seeder, gunakan credentials berikut:

**Admin:**
- Email: `admin@school.com`
- Password: `admin123`

**Guru:**
- Email: `budi.hartono@school.com`
- Password: `guru123`

**Siswa:**
- Email: `ahmad.rizki@student.com`
- Password: `siswa123`
- NISN: `0012345678`

---

## ⚠️ Catatan Penting

1. **Seeder akan menghapus semua data yang ada!**
   - File `prisma/seed.ts` memiliki `deleteMany()` untuk semua tabel
   - Jika ingin mempertahankan data existing, comment out bagian `deleteMany()`

2. **Migration hanya sekali**
   - `prisma migrate deploy` hanya menjalankan migration yang belum dijalankan
   - Aman untuk dijalankan berkali-kali

3. **Seeder bisa dijalankan berkali-kali**
   - Tapi akan reset semua data kembali ke initial state

4. **Database Backup**
   - Selalu backup database sebelum menjalankan seeder di production
   - Di Coolify, backup database via PostgreSQL container

---

## 🐛 Troubleshooting

### Error: "Prisma CLI not found"

**Solusi 1: Gunakan path lengkap**
```bash
cd /app
./node_modules/.bin/prisma migrate deploy
```

**Solusi 2: Gunakan npx dengan --yes**
```bash
npx --yes prisma@7.3.0 migrate deploy
```

**Solusi 3: Jika masih error, redeploy dengan Dockerfile terbaru**
- Dockerfile sudah diupdate untuk include Prisma CLI
- Commit dan push perubahan
- Redeploy di Coolify

### Error: "Can't reach database server"

- Cek koneksi `DATABASE_URL` di environment variables
- Pastikan PostgreSQL container running
- Test koneksi: `npx prisma db pull --print`

### Error: "Permission denied"

Jika ada error permission:
```bash
# Switch ke root user
docker exec -it -u root <container_id> sh

# Jalankan migration
npx prisma migrate deploy

# Exit
exit
```

---

## 📚 Resource

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/database/seed-database)
