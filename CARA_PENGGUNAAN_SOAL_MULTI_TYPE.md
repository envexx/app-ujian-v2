# 📖 CARA PENGGUNAAN SISTEM SOAL MULTI-TYPE

**Sistem Baru:** Unified Multi-Type Question System  
**Status:** ✅ Ready to Use

---

## 🚀 QUICK START

### **1. Akses Halaman Edit Ujian Baru**

Untuk menggunakan sistem baru, akses:
```
/guru/ujian/[id]/edit-new
```

**Contoh:**
```
http://localhost:3000/guru/ujian/cm5abc123/edit-new
```

---

## 📝 LANGKAH-LANGKAH PENGGUNAAN

### **Step 1: Isi Informasi Ujian**

1. Klik tab **"Informasi Ujian"**
2. Isi data berikut:
   - **Judul Ujian** (wajib)
   - **Deskripsi** (opsional)
   - **Mata Pelajaran** (wajib)
   - **Kelas** (wajib, bisa pilih multiple)
   - **Waktu Mulai** (wajib)
   - **Waktu Selesai** (wajib)
   - **Acak Urutan Soal** (toggle)
   - **Tampilkan Nilai** (toggle)

3. Klik **"Simpan Draft"** untuk menyimpan

---

### **Step 2: Tambah Soal**

1. Klik tab **"Soal"**
2. Klik tombol **"Tambah Soal"**
3. Pilih tipe soal yang diinginkan:
   - **Pilihan Ganda** - Soal dengan 4 opsi (A, B, C, D)
   - **Essay** - Soal dengan jawaban panjang
   - **Isian Singkat** - Soal dengan jawaban singkat
   - **Pencocokan** - Soal mencocokkan pasangan
   - **Benar/Salah** - Soal dengan jawaban benar atau salah

4. Soal baru akan muncul di bawah

---

### **Step 3: Edit Soal**

#### **A. Pilihan Ganda**
1. Isi **Pertanyaan** (rich text editor)
2. Isi **Opsi A, B, C, D** (rich text editor)
3. Pilih **Kunci Jawaban** (dropdown)
4. Set **Poin** (default: 1)

#### **B. Essay**
1. Isi **Pertanyaan** (rich text editor)
2. Isi **Kunci Jawaban/Pedoman** (rich text editor)
3. Set **Min Kata** (opsional)
4. Set **Max Kata** (opsional)
5. Set **Poin** (default: 5)

#### **C. Isian Singkat**
1. Isi **Pertanyaan** (rich text editor)
2. Tambah **Jawaban yang Diterima** (bisa multiple)
3. Centang **Case Sensitive** jika perlu
4. Set **Poin** (default: 1)

#### **D. Pencocokan**
1. Isi **Pertanyaan/Instruksi** (rich text editor)
2. Tambah **Pasangan** (item kiri & kanan)
3. Klik **"Tambah Pasangan"** untuk menambah
4. Set **Poin** (default: 3)

#### **E. Benar/Salah**
1. Isi **Pertanyaan/Pernyataan** (rich text editor)
2. Pilih **Kunci Jawaban** (Benar/Salah)
3. Set **Poin** (default: 1)

---

### **Step 4: Atur Urutan Soal**

1. **Drag & Drop** - Klik dan tahan icon **⋮⋮** di kiri soal, lalu drag ke posisi yang diinginkan
2. Penomoran akan otomatis update (Soal 1, 2, 3...)
3. Urutan tersimpan otomatis

---

### **Step 5: Collapse/Expand Soal**

- Klik icon **▼** untuk collapse soal
- Klik icon **▲** untuk expand soal
- Klik **"Collapse All"** untuk collapse semua soal
- Klik **"Expand All"** untuk expand semua soal

---

### **Step 6: Hapus Soal**

1. Klik icon **🗑️** (trash) di kanan atas soal
2. Soal akan terhapus
3. Urutan soal lain akan otomatis update
4. **Note:** Minimal harus ada 1 soal

---

### **Step 7: Publikasikan Ujian**

1. Pastikan semua data sudah lengkap:
   - ✅ Informasi ujian terisi
   - ✅ Minimal 1 soal
   - ✅ Semua soal terisi lengkap

2. Klik tombol **"Publikasikan"**
3. Ujian akan menjadi **aktif** dan bisa diakses siswa

---

## 💡 TIPS & TRICKS

### **1. Auto-Save**
- Setiap perubahan pada soal **otomatis tersimpan** ke server
- Tidak perlu klik "Save" untuk setiap soal
- Hanya perlu klik "Simpan Draft" untuk informasi ujian

### **2. Rich Text Editor**
- Support **bold**, *italic*, underline
- Support **list** (bullet & numbered)
- Support **math equations** (LaTeX)
- Support **images** (upload)

### **3. Keyboard Shortcuts**
- **Tab** - Pindah ke field berikutnya
- **Shift + Tab** - Pindah ke field sebelumnya
- **Ctrl + S** - Simpan draft (informasi ujian)

### **4. Validation**
- Sistem akan validasi sebelum publikasi:
  - ✅ Judul tidak boleh kosong
  - ✅ Mapel harus dipilih
  - ✅ Kelas harus dipilih
  - ✅ Minimal 1 soal
  - ✅ Waktu selesai > waktu mulai

### **5. Drag & Drop Best Practices**
- Drag dari icon **⋮⋮** (jangan dari area lain)
- Tunggu hingga soal "drop" sebelum drag lagi
- Jika gagal, refresh halaman

---

## 🔄 MIGRASI DARI SISTEM LAMA

### **Jika Punya Data Ujian Lama:**

1. **Jalankan Migration Script:**
   ```bash
   npx tsx scripts/migrate-soal-to-new-system.ts
   ```

2. Script akan:
   - Convert Pilihan Ganda lama → Soal (tipe: PILIHAN_GANDA)
   - Convert Essay lama → Soal (tipe: ESSAY)
   - Preserve urutan soal
   - Set poin default

3. Setelah migration:
   - Data lama tetap ada (tidak dihapus)
   - Data baru bisa diedit di halaman baru
   - Sistem lama masih bisa digunakan (backward compatible)

---

## ❓ FAQ

### **Q: Apakah data lama akan hilang?**
A: Tidak. Data lama tetap ada di tabel `soal_pilihan_ganda` dan `soal_essay`. Sistem baru menggunakan tabel `soal` yang terpisah.

### **Q: Apakah bisa mix tipe soal?**
A: Ya! Anda bisa membuat ujian dengan kombinasi:
- Soal 1: Pilihan Ganda
- Soal 2: Essay
- Soal 3: Isian Singkat
- Soal 4: Pilihan Ganda
- dst.

### **Q: Bagaimana cara mengubah tipe soal?**
A: Tidak bisa langsung ubah tipe. Harus hapus soal lama, lalu tambah soal baru dengan tipe yang diinginkan.

### **Q: Apakah urutan soal bisa diacak untuk siswa?**
A: Ya, aktifkan toggle **"Acak Urutan Soal"** di tab Informasi Ujian.

### **Q: Berapa maksimal soal yang bisa dibuat?**
A: Tidak ada batasan. Tapi disarankan maksimal 50 soal per ujian untuk performa optimal.

### **Q: Apakah bisa import soal dari Word/Excel?**
A: Belum tersedia di sistem baru. Fitur ini akan ditambahkan di update berikutnya.

### **Q: Bagaimana cara melihat preview ujian?**
A: Belum ada fitur preview. Untuk melihat tampilan siswa, bisa login sebagai siswa dan akses ujian.

---

## 🐛 TROUBLESHOOTING

### **Problem: Soal tidak tersimpan**
**Solution:**
- Cek koneksi internet
- Refresh halaman
- Cek console browser untuk error
- Pastikan session masih aktif (tidak logout)

### **Problem: Drag & drop tidak berfungsi**
**Solution:**
- Pastikan drag dari icon **⋮⋮**
- Refresh halaman
- Clear browser cache
- Coba browser lain

### **Problem: Rich text editor tidak muncul**
**Solution:**
- Refresh halaman
- Clear browser cache
- Pastikan JavaScript enabled
- Coba browser lain (Chrome/Firefox recommended)

### **Problem: Error saat publikasi**
**Solution:**
- Cek semua field wajib sudah terisi
- Pastikan minimal ada 1 soal
- Cek waktu selesai > waktu mulai
- Lihat pesan error untuk detail

---

## 📞 SUPPORT

Jika mengalami masalah:
1. Cek dokumentasi ini
2. Cek console browser untuk error
3. Screenshot error dan kirim ke admin
4. Hubungi IT support

---

**Last Updated:** 12 Februari 2026, 13:20 WIB
