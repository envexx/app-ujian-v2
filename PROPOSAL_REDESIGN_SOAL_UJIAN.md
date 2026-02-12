# 📋 PROPOSAL REDESIGN SISTEM INPUT SOAL UJIAN

## 🎯 Tujuan
Merombak sistem input soal ujian dari **tab-based (terpisah PG & Essay)** menjadi **single-page unified system** dengan berbagai tipe soal yang dapat di-drag and drop untuk pengurutan.

---

## 📊 ANALISIS SISTEM SAAT INI

### **Database Schema (Current)**

```prisma
// Terpisah per tipe soal
model SoalPilihanGanda {
  id            String   @id @default(cuid())
  ujianId       String
  pertanyaan    String
  opsiA         String
  opsiB         String
  opsiC         String
  opsiD         String
  jawabanBenar  String   // A, B, C, D
  urutan        Int      // Urutan dalam tipe soal ini saja
  // ...
}

model SoalEssay {
  id           String   @id @default(cuid())
  ujianId      String
  pertanyaan   String
  kunciJawaban String
  urutan       Int      // Urutan dalam tipe soal ini saja
  // ...
}
```

### **UI Saat Ini**
- ❌ Tab terpisah: "Pilihan Ganda" dan "Essay"
- ❌ Urutan terpisah per tipe (PG: 1,2,3... Essay: 1,2,3...)
- ❌ Tidak bisa mix order (PG → Essay → PG)
- ✅ Sudah ada drag-and-drop per tab
- ✅ Sudah ada collapsible sections

### **Masalah:**
1. Urutan soal tidak fleksibel (harus semua PG dulu, baru Essay)
2. Tidak bisa variasi tipe soal (hanya PG & Essay)
3. Penomoran terpisah per tipe, bukan global
4. Tidak bisa tambah tipe soal baru (Isian, Pencocokan, dll)

---

## 🚀 DESIGN SISTEM BARU

### **1. Database Schema (New)**

```prisma
// Model utama untuk semua tipe soal
model Soal {
  id            String   @id @default(cuid())
  ujianId       String
  tipe          String   // 'PILIHAN_GANDA', 'ESSAY', 'ISIAN_SINGKAT', 'PENCOCOKAN', 'BENAR_SALAH'
  urutan        Int      // URUTAN GLOBAL untuk semua tipe soal
  pertanyaan    String   // Pertanyaan (support rich text)
  poin          Int      @default(1) // Bobot poin per soal
  
  // Data spesifik per tipe (JSON flexible)
  data          Json     // Menyimpan data spesifik tipe soal
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  ujian         Ujian              @relation(fields: [ujianId], references: [id], onDelete: Cascade)
  jawaban       JawabanSoal[]

  @@index([ujianId])
  @@index([urutan])
  @@map("soal")
}

// Jawaban siswa (unified)
model JawabanSoal {
  id            String   @id @default(cuid())
  submissionId  String
  soalId        String
  jawaban       Json     // Jawaban siswa (format sesuai tipe soal)
  nilai         Int?     // Nilai untuk soal ini
  feedback      String?  // Feedback dari guru
  isCorrect     Boolean? // Auto-graded untuk PG, Isian, Benar-Salah
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  submission    UjianSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  soal          Soal            @relation(fields: [soalId], references: [id], onDelete: Cascade)

  @@unique([submissionId, soalId])
  @@map("jawaban_soal")
}
```

### **2. Struktur Data JSON per Tipe Soal**

```typescript
// PILIHAN_GANDA
{
  "opsi": [
    { "label": "A", "text": "Opsi A" },
    { "label": "B", "text": "Opsi B" },
    { "label": "C", "text": "Opsi C" },
    { "label": "D", "text": "Opsi D" }
  ],
  "kunciJawaban": "A"
}

// ESSAY
{
  "kunciJawaban": "Jawaban essay yang diharapkan...",
  "minKata": 50,
  "maxKata": 500
}

// ISIAN_SINGKAT
{
  "kunciJawaban": ["jawaban1", "jawaban2"], // Multiple acceptable answers
  "caseSensitive": false
}

// PENCOCOKAN (Matching)
{
  "pasangan": [
    { "kiri": "Item 1", "kanan": "Match 1", "id": "pair1" },
    { "kiri": "Item 2", "kanan": "Match 2", "id": "pair2" },
    { "kiri": "Item 3", "kanan": "Match 3", "id": "pair3" }
  ]
}

// BENAR_SALAH
{
  "kunciJawaban": true // true = Benar, false = Salah
}
```

---

## 🎨 DESIGN UI BARU

### **Single Page Layout**

```
┌─────────────────────────────────────────────────────────┐
│ Edit Ujian: [Judul Ujian]                              │
│ ─────────────────────────────────────────────────────── │
│ Tab: [Informasi] [Soal] [Preview]                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ SOAL UJIAN                                              │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ [+ Tambah Soal ▼]                                       │
│   ├─ Pilihan Ganda                                      │
│   ├─ Essay                                              │
│   ├─ Isian Singkat                                      │
│   ├─ Pencocokan                                         │
│   └─ Benar/Salah                                        │
│                                                         │
│ [Collapse All] [Expand All] [Shuffle Preview]          │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ⋮⋮ Soal 1 - Pilihan Ganda          [▼] [×]     │    │
│ │ ───────────────────────────────────────────────  │    │
│ │ Pertanyaan: [Rich Text Editor]                  │    │
│ │ Opsi A: [...]  Opsi B: [...]                    │    │
│ │ Opsi C: [...]  Opsi D: [...]                    │    │
│ │ Kunci Jawaban: [A ▼]  Poin: [1]                │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ⋮⋮ Soal 2 - Essay                  [▼] [×]     │    │
│ │ ───────────────────────────────────────────────  │    │
│ │ Pertanyaan: [Rich Text Editor]                  │    │
│ │ Kunci Jawaban: [Rich Text Editor]               │    │
│ │ Min Kata: [50]  Max Kata: [500]  Poin: [5]     │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ⋮⋮ Soal 3 - Isian Singkat          [▼] [×]     │    │
│ │ ───────────────────────────────────────────────  │    │
│ │ Pertanyaan: [Rich Text Editor]                  │    │
│ │ Jawaban yang diterima:                          │    │
│ │   • [jawaban 1] [×]                             │    │
│ │   • [jawaban 2] [×]                             │    │
│ │   [+ Tambah Jawaban]                            │    │
│ │ ☐ Case Sensitive  Poin: [1]                     │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ⋮⋮ Soal 4 - Pencocokan             [▼] [×]     │    │
│ │ ───────────────────────────────────────────────  │    │
│ │ Pertanyaan: [Rich Text Editor]                  │    │
│ │ Pasangan:                                       │    │
│ │   [Item 1] ←→ [Match 1] [×]                    │    │
│ │   [Item 2] ←→ [Match 2] [×]                    │    │
│ │   [Item 3] ←→ [Match 3] [×]                    │    │
│ │   [+ Tambah Pasangan]                           │    │
│ │ Poin: [3]                                       │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ⋮⋮ Soal 5 - Benar/Salah            [▼] [×]     │    │
│ │ ───────────────────────────────────────────────  │    │
│ │ Pertanyaan: [Rich Text Editor]                  │    │
│ │ Kunci Jawaban: ○ Benar  ● Salah                │    │
│ │ Poin: [1]                                       │    │
│ └─────────────────────────────────────────────────┘    │
│                                                         │
│ Total Soal: 5  |  Total Poin: 11                       │
│                                                         │
│ [Simpan Draft] [Publikasikan]                          │
└─────────────────────────────────────────────────────────┘
```

### **Fitur UI:**
1. ✅ **Dropdown "Tambah Soal"** dengan pilihan tipe soal
2. ✅ **Drag handle (⋮⋮)** untuk reorder soal
3. ✅ **Penomoran otomatis** berdasarkan urutan drag-and-drop
4. ✅ **Collapsible** per soal untuk menghemat space
5. ✅ **Delete button** per soal
6. ✅ **Poin per soal** (customizable)
7. ✅ **Badge tipe soal** untuk identifikasi cepat
8. ✅ **Total soal & total poin** di footer

---

## 🔄 MIGRATION STRATEGY

### **Step 1: Buat Schema Baru**
```sql
-- Migration akan membuat tabel Soal dan JawabanSoal baru
-- Tabel lama (SoalPilihanGanda, SoalEssay) tetap ada untuk backward compatibility
```

### **Step 2: Migrate Data Existing**
```typescript
// Script migration untuk convert data lama ke format baru
async function migrateExistingQuestions() {
  // 1. Ambil semua ujian
  const allUjian = await prisma.ujian.findMany({
    include: {
      soalPilihanGanda: true,
      soalEssay: true,
    },
  });

  for (const ujian of allUjian) {
    const newSoal = [];
    let urutan = 1;

    // Convert PG
    for (const pg of ujian.soalPilihanGanda.sort((a, b) => a.urutan - b.urutan)) {
      newSoal.push({
        ujianId: ujian.id,
        tipe: 'PILIHAN_GANDA',
        urutan: urutan++,
        pertanyaan: pg.pertanyaan,
        poin: 1,
        data: {
          opsi: [
            { label: 'A', text: pg.opsiA },
            { label: 'B', text: pg.opsiB },
            { label: 'C', text: pg.opsiC },
            { label: 'D', text: pg.opsiD },
          ],
          kunciJawaban: pg.jawabanBenar,
        },
      });
    }

    // Convert Essay
    for (const essay of ujian.soalEssay.sort((a, b) => a.urutan - b.urutan)) {
      newSoal.push({
        ujianId: ujian.id,
        tipe: 'ESSAY',
        urutan: urutan++,
        pertanyaan: essay.pertanyaan,
        poin: 5,
        data: {
          kunciJawaban: essay.kunciJawaban,
          minKata: 0,
          maxKata: 1000,
        },
      });
    }

    // Create new soal
    await prisma.soal.createMany({ data: newSoal });
  }
}
```

### **Step 3: Update API Endpoints**
- Buat API baru untuk CRUD soal unified
- Maintain backward compatibility untuk API lama
- Gradual migration dari frontend

---

## 📝 IMPLEMENTATION PLAN

### **Phase 1: Database & Backend (Week 1)**
1. ✅ Buat schema Prisma baru (Soal, JawabanSoal)
2. ✅ Generate migration
3. ✅ Buat migration script untuk data existing
4. ✅ Buat API endpoints baru:
   - `POST /api/guru/ujian/[id]/soal` - Create soal
   - `GET /api/guru/ujian/[id]/soal` - Get all soal
   - `PUT /api/guru/ujian/[id]/soal/[soalId]` - Update soal
   - `DELETE /api/guru/ujian/[id]/soal/[soalId]` - Delete soal
   - `PUT /api/guru/ujian/[id]/soal/reorder` - Reorder soal

### **Phase 2: Frontend Components (Week 2)**
1. ✅ Buat komponen per tipe soal:
   - `PilihanGandaForm.tsx`
   - `EssayForm.tsx`
   - `IsianSingkatForm.tsx`
   - `PencocokanForm.tsx`
   - `BenarSalahForm.tsx`
2. ✅ Buat `SoalItem.tsx` wrapper dengan drag-and-drop
3. ✅ Buat `AddSoalDropdown.tsx` untuk pilih tipe soal
4. ✅ Update `edit/page.tsx` dengan UI baru

### **Phase 3: Student View (Week 3)**
1. ✅ Update halaman ujian siswa untuk support multi-type
2. ✅ Buat komponen render per tipe soal
3. ✅ Update auto-grading logic
4. ✅ Update hasil ujian display

### **Phase 4: Testing & Migration (Week 4)**
1. ✅ Test semua tipe soal
2. ✅ Run migration script di production
3. ✅ Monitor & fix issues
4. ✅ Dokumentasi penggunaan

---

## ⚠️ BREAKING CHANGES

### **Database:**
- ❌ Tabel `SoalPilihanGanda` dan `SoalEssay` akan deprecated (tapi tidak dihapus)
- ✅ Tabel baru `Soal` dan `JawabanSoal` akan menjadi primary

### **API:**
- ❌ API lama masih berfungsi untuk backward compatibility
- ✅ API baru harus digunakan untuk fitur baru

### **Frontend:**
- ❌ Tab "Pilihan Ganda" dan "Essay" akan diganti
- ✅ Single page "Soal" dengan semua tipe

---

## 💡 KEUNTUNGAN SISTEM BARU

1. ✅ **Fleksibilitas:** Tambah tipe soal baru tanpa ubah schema
2. ✅ **Urutan Global:** Penomoran konsisten untuk semua tipe
3. ✅ **UX Lebih Baik:** Single page, tidak perlu pindah-pindah tab
4. ✅ **Drag-and-Drop:** Reorder soal dengan mudah
5. ✅ **Variasi Soal:** Support 5+ tipe soal berbeda
6. ✅ **Poin Custom:** Setiap soal bisa punya bobot berbeda
7. ✅ **Scalable:** Mudah tambah tipe soal baru di masa depan

---

## 🎯 NEXT STEPS

**Apakah Anda setuju dengan design ini?**

Jika ya, saya akan mulai implementasi dengan urutan:
1. Buat schema database baru
2. Buat migration script
3. Buat API endpoints baru
4. Buat UI components baru
5. Update student view
6. Testing & deployment

**Perlu penyesuaian?**
- Tambah/kurangi tipe soal?
- Ubah struktur data JSON?
- Modifikasi UI layout?

Silakan review dan beri feedback! 🚀
