# 📚 IMPLEMENTASI SISTEM SOAL MULTI-TYPE - COMPLETE GUIDE

**Status:** ✅ **PHASE 1-3 SELESAI** (60% Complete)  
**Tanggal:** 12 Februari 2026

---

## 🎯 OVERVIEW

Sistem soal ujian telah dirombak dari **tab-based (PG & Essay terpisah)** menjadi **unified single-page system** dengan 5 tipe soal yang dapat di-drag and drop untuk pengurutan.

### **Tipe Soal yang Didukung:**
1. ✅ **Pilihan Ganda** - 4 opsi (A, B, C, D)
2. ✅ **Essay** - Jawaban panjang dengan min/max kata
3. ✅ **Isian Singkat** - Jawaban singkat dengan multiple acceptable answers
4. ✅ **Pencocokan** - Mencocokkan pasangan item
5. ✅ **Benar/Salah** - True/False questions

---

## 📊 STRUKTUR DATABASE

### **Model Soal (Unified)**
```prisma
model Soal {
  id            String   @id @default(cuid())
  ujianId       String
  tipe          String   // 'PILIHAN_GANDA', 'ESSAY', 'ISIAN_SINGKAT', 'PENCOCOKAN', 'BENAR_SALAH'
  urutan        Int      // Urutan global untuk semua tipe soal
  pertanyaan    String   @db.Text
  poin          Int      @default(1)
  data          Json     // PostgreSQL JSONB - data spesifik per tipe
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  ujian         Ujian              @relation(fields: [ujianId], references: [id], onDelete: Cascade)
  jawaban       JawabanSoal[]
  
  @@index([ujianId])
  @@index([urutan])
  @@index([tipe])
  @@map("soal")
}
```

### **Format Data JSON per Tipe:**

#### **1. Pilihan Ganda**
```json
{
  "opsi": [
    { "label": "A", "text": "Opsi A" },
    { "label": "B", "text": "Opsi B" },
    { "label": "C", "text": "Opsi C" },
    { "label": "D", "text": "Opsi D" }
  ],
  "kunciJawaban": "A"
}
```

#### **2. Essay**
```json
{
  "kunciJawaban": "Jawaban yang diharapkan...",
  "minKata": 50,
  "maxKata": 500
}
```

#### **3. Isian Singkat**
```json
{
  "kunciJawaban": ["jawaban1", "jawaban2", "jawaban3"],
  "caseSensitive": false
}
```

#### **4. Pencocokan**
```json
{
  "pasangan": [
    { "id": "pair1", "kiri": "Item 1", "kanan": "Match 1" },
    { "id": "pair2", "kiri": "Item 2", "kanan": "Match 2" },
    { "id": "pair3", "kiri": "Item 3", "kanan": "Match 3" }
  ]
}
```

#### **5. Benar/Salah**
```json
{
  "kunciJawaban": true
}
```

---

## 🔌 API ENDPOINTS

### **1. Get All Soal**
```typescript
GET /api/guru/ujian/[id]/soal

Response:
{
  "success": true,
  "data": [
    {
      "id": "soal_id",
      "ujianId": "ujian_id",
      "tipe": "PILIHAN_GANDA",
      "urutan": 1,
      "pertanyaan": "Berapa 1+1?",
      "poin": 1,
      "data": { /* PilihanGandaData */ },
      "createdAt": "2026-02-12T...",
      "updatedAt": "2026-02-12T..."
    }
  ]
}
```

### **2. Create Soal**
```typescript
POST /api/guru/ujian/[id]/soal

Body:
{
  "tipe": "PILIHAN_GANDA",
  "pertanyaan": "Berapa 1+1?",
  "poin": 1,
  "data": {
    "opsi": [
      { "label": "A", "text": "1" },
      { "label": "B", "text": "2" },
      { "label": "C", "text": "3" },
      { "label": "D", "text": "4" }
    ],
    "kunciJawaban": "B"
  }
}

Response:
{
  "success": true,
  "data": { /* Soal object */ },
  "message": "Soal berhasil ditambahkan"
}
```

### **3. Update Soal**
```typescript
PUT /api/guru/ujian/[id]/soal/[soalId]

Body:
{
  "pertanyaan": "Updated question",
  "poin": 2,
  "data": { /* Updated data */ }
}
```

### **4. Delete Soal**
```typescript
DELETE /api/guru/ujian/[id]/soal/[soalId]

Response:
{
  "success": true,
  "message": "Soal berhasil dihapus"
}
```

### **5. Reorder Soal**
```typescript
PUT /api/guru/ujian/[id]/soal

Body:
{
  "soalIds": ["soal1_id", "soal2_id", "soal3_id"]
}
```

---

## 🎨 KOMPONEN UI

### **Form Components**

#### **1. PilihanGandaForm**
```tsx
import { PilihanGandaForm } from "@/components/soal/PilihanGandaForm";

<PilihanGandaForm
  pertanyaan={pertanyaan}
  poin={poin}
  data={data}
  onChange={(pertanyaan, poin, data) => {
    // Handle change
  }}
/>
```

#### **2. EssayForm**
```tsx
import { EssayForm } from "@/components/soal/EssayForm";

<EssayForm
  pertanyaan={pertanyaan}
  poin={poin}
  data={data}
  onChange={(pertanyaan, poin, data) => {
    // Handle change
  }}
/>
```

#### **3. IsianSingkatForm**
```tsx
import { IsianSingkatForm } from "@/components/soal/IsianSingkatForm";

<IsianSingkatForm
  pertanyaan={pertanyaan}
  poin={poin}
  data={data}
  onChange={(pertanyaan, poin, data) => {
    // Handle change
  }}
/>
```

#### **4. PencocokanForm**
```tsx
import { PencocokanForm } from "@/components/soal/PencocokanForm";

<PencocokanForm
  pertanyaan={pertanyaan}
  poin={poin}
  data={data}
  onChange={(pertanyaan, poin, data) => {
    // Handle change
  }}
/>
```

#### **5. BenarSalahForm**
```tsx
import { BenarSalahForm } from "@/components/soal/BenarSalahForm";

<BenarSalahForm
  pertanyaan={pertanyaan}
  poin={poin}
  data={data}
  onChange={(pertanyaan, poin, data) => {
    // Handle change
  }}
/>
```

### **Wrapper Components**

#### **SoalItem** (Drag-and-Drop Wrapper)
```tsx
import { SoalItem } from "@/components/soal/SoalItem";

<SoalItem
  id={soal.id}
  index={index}
  tipe={soal.tipe}
  isCollapsed={isCollapsed}
  onToggleCollapse={() => toggleCollapse(soal.id)}
  onDelete={() => deleteSoal(soal.id)}
  canDelete={soalList.length > 1}
>
  {/* Form component based on tipe */}
</SoalItem>
```

#### **AddSoalDropdown**
```tsx
import { AddSoalDropdown } from "@/components/soal/AddSoalDropdown";

<AddSoalDropdown
  onAddSoal={(tipe) => {
    // Create new soal with selected type
  }}
/>
```

---

## 🔄 MIGRATION DATA LAMA

### **Jalankan Migration Script**
```bash
npx tsx scripts/migrate-soal-to-new-system.ts
```

Script ini akan:
1. ✅ Convert `SoalPilihanGanda` → `Soal` (tipe: PILIHAN_GANDA)
2. ✅ Convert `SoalEssay` → `Soal` (tipe: ESSAY)
3. ✅ Preserve urutan soal (PG dulu, baru Essay)
4. ✅ Set poin default (PG: 1, Essay: 5)
5. ✅ Skip ujian yang sudah di-migrate

---

## 🎯 CARA PENGGUNAAN

### **1. Membuat Soal Baru**
```typescript
const createSoal = async (ujianId: string, tipe: TipeSoal) => {
  const response = await fetch(`/api/guru/ujian/${ujianId}/soal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipe,
      pertanyaan: '',
      poin: DEFAULT_POIN[tipe],
      data: getDefaultData(tipe),
    }),
  });
  
  return response.json();
};
```

### **2. Update Soal**
```typescript
const updateSoal = async (ujianId: string, soalId: string, updates: Partial<Soal>) => {
  const response = await fetch(`/api/guru/ujian/${ujianId}/soal/${soalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  
  return response.json();
};
```

### **3. Reorder Soal (Drag-and-Drop)**
```typescript
const reorderSoal = async (ujianId: string, soalIds: string[]) => {
  const response = await fetch(`/api/guru/ujian/${ujianId}/soal`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soalIds }),
  });
  
  return response.json();
};
```

---

## ✅ CHECKLIST IMPLEMENTASI

### **Phase 1: Database & Backend** ✅
- [x] Schema Prisma (Model Soal & JawabanSoal)
- [x] Migration file generated & applied
- [x] TypeScript types (`src/types/soal.ts`)
- [x] API endpoints (GET, POST, PUT, DELETE)
- [x] Migration script untuk data lama

### **Phase 2: UI Form Components** ✅
- [x] PilihanGandaForm.tsx
- [x] EssayForm.tsx
- [x] IsianSingkatForm.tsx
- [x] PencocokanForm.tsx
- [x] BenarSalahForm.tsx

### **Phase 3: Wrapper Components** ✅
- [x] SoalItem.tsx (drag-and-drop wrapper)
- [x] AddSoalDropdown.tsx

### **Phase 4: Update Pages** ⏳
- [ ] Update `/guru/ujian/[id]/edit/page.tsx`
- [ ] Update `/siswa/ujian/[id]/page.tsx`

### **Phase 5: Testing** ⏳
- [ ] Test semua tipe soal
- [ ] Test drag-and-drop
- [ ] Test auto-grading
- [ ] Run migration script
- [ ] Dokumentasi final

---

## 📁 FILE STRUCTURE

```
src/
├── types/
│   └── soal.ts                          ✅ TypeScript types & helpers
├── components/
│   └── soal/
│       ├── PilihanGandaForm.tsx         ✅ Form PG
│       ├── EssayForm.tsx                ✅ Form Essay
│       ├── IsianSingkatForm.tsx         ✅ Form Isian
│       ├── PencocokanForm.tsx           ✅ Form Pencocokan
│       ├── BenarSalahForm.tsx           ✅ Form Benar/Salah
│       ├── SoalItem.tsx                 ✅ Wrapper dengan drag-and-drop
│       └── AddSoalDropdown.tsx          ✅ Dropdown pilih tipe
├── app/
│   ├── (main)/
│   │   ├── guru/
│   │   │   └── ujian/
│   │   │       └── [id]/
│   │   │           └── edit/
│   │   │               └── page.tsx     ⏳ TODO: Update UI
│   │   └── siswa/
│   │       └── ujian/
│   │           └── [id]/
│   │               └── page.tsx         ⏳ TODO: Multi-type support
│   └── api/
│       └── guru/
│           └── ujian/
│               └── [id]/
│                   └── soal/
│                       ├── route.ts              ✅ GET, POST, PUT
│                       └── [soalId]/
│                           └── route.ts          ✅ PUT, DELETE
prisma/
├── schema.prisma                        ✅ Updated schema
└── migrations/
    └── 20260212061252_add_soal_multi_type_system/
        └── migration.sql                ✅ Applied
scripts/
└── migrate-soal-to-new-system.ts        ✅ Migration script
```

---

## 🚀 NEXT STEPS

1. **Update halaman edit ujian** - Replace tab-based UI dengan single page
2. **Update halaman ujian siswa** - Support multi-type questions
3. **Testing** - Test semua fitur
4. **Migration** - Run script untuk data lama (jika ada)
5. **Deployment** - Deploy ke production

---

## 📊 PROGRESS

**Overall:** 60% Complete ✅

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Database & Backend | ✅ Done | 100% |
| Phase 2: UI Form Components | ✅ Done | 100% |
| Phase 3: Wrapper Components | ✅ Done | 100% |
| Phase 4: Update Pages | ⏳ In Progress | 0% |
| Phase 5: Testing | ⏳ Pending | 0% |

---

**Last Updated:** 12 Februari 2026, 13:17 WIB
