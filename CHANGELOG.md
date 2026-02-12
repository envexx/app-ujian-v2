# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di file ini.

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
