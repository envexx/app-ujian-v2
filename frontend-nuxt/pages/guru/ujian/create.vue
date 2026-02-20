<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon="lucide:arrow-left"
          @click="navigateTo('/guru/ujian')"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Buat Ujian Baru</h1>
          <p class="text-sm text-gray-500">Isi informasi dasar ujian, lalu tambahkan soal di halaman berikutnya</p>
        </div>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" @click="navigateTo('/guru/ujian')">
          Batal
        </Button>
        <Button :loading="isSaving" @click="handleCreate">
          Buat Ujian & Tambah Soal
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>

    <!-- Form -->
    <div v-else class="bg-white rounded-2xl card-shadow">
      <div class="px-6 py-5 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">Informasi Ujian</h3>
        <p class="text-sm text-gray-500">Atur detail dan konfigurasi ujian</p>
      </div>
      
      <div class="p-6 space-y-6">
        <!-- Judul -->
        <div class="space-y-2">
          <Label>Judul Ujian *</Label>
          <Input 
            v-model="form.judul" 
            placeholder="Contoh: Ulangan Harian Matematika Bab 3"
            icon="lucide:file-text"
          />
        </div>

        <!-- Deskripsi -->
        <div class="space-y-2">
          <Label>Deskripsi</Label>
          <TiptapEditor 
            v-model="form.deskripsi" 
            placeholder="Deskripsi singkat tentang ujian..."
          />
        </div>

        <!-- Kelas Selection -->
        <div class="space-y-3">
          <Label>Kelas (Pilih satu atau lebih) *</Label>
          <div class="border border-gray-200 rounded-xl p-4">
            <div v-if="kelasList.length === 0" class="text-sm text-gray-500">
              Tidak ada kelas tersedia
            </div>
            <div v-else class="grid grid-cols-3 gap-3">
              <div 
                v-for="kelas in kelasList" 
                :key="kelas.id" 
                class="flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  :id="`kelas-${kelas.id}`"
                  :checked="form.kelas.includes(kelas.nama)"
                  @change="toggleKelas(kelas.nama)"
                  class="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label :for="`kelas-${kelas.id}`" class="text-sm cursor-pointer">
                  {{ kelas.nama }}
                </label>
              </div>
            </div>
          </div>
          <p v-if="form.kelas.length > 0" class="text-xs text-orange-600">
            Dipilih: {{ form.kelas.join(', ') }}
          </p>
        </div>

        <!-- Mata Pelajaran -->
        <div class="space-y-2">
          <Label>Mata Pelajaran *</Label>
          <select 
            v-model="form.mapelId"
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Pilih Mata Pelajaran</option>
            <option v-for="mapel in mapelList" :key="mapel.id" :value="mapel.id">
              {{ mapel.nama }}
            </option>
          </select>
        </div>

        <!-- Waktu Ujian -->
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <Label>Waktu Mulai Ujian *</Label>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <span class="text-xs text-gray-500">Tanggal</span>
                <Input 
                  v-model="startDate" 
                  type="date"
                />
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-500">Waktu</span>
                <Input 
                  v-model="startTime" 
                  type="time"
                />
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Waktu Akhir Ujian *</Label>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <span class="text-xs text-gray-500">Tanggal</span>
                <Input 
                  v-model="endDate" 
                  type="date"
                />
              </div>
              <div class="space-y-1">
                <span class="text-xs text-gray-500">Waktu</span>
                <Input 
                  v-model="endTime" 
                  type="time"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Pengaturan Ujian -->
        <div class="space-y-4 pt-4 border-t border-gray-100">
          <h3 class="font-semibold text-gray-900">Pengaturan Ujian</h3>
          
          <!-- Acak Soal -->
          <div class="flex items-center justify-between p-4 rounded-xl border border-gray-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Icon name="lucide:shuffle" class="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900">Acak Urutan Soal</p>
                <p class="text-sm text-gray-500">Soal akan ditampilkan secara acak untuk setiap siswa</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="form.shuffleQuestions" 
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          <!-- Tampilkan Nilai -->
          <div class="flex items-center justify-between p-4 rounded-xl border border-gray-200">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Icon :name="form.showScore ? 'lucide:eye' : 'lucide:eye-off'" class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900">Tampilkan Nilai ke Siswa</p>
                <p class="text-sm text-gray-500">Siswa dapat melihat nilai setelah menyelesaikan ujian</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="form.showScore" 
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'guru',
})

useHead({
  title: 'Buat Ujian Baru',
})

const router = useRouter()
const isLoading = ref(true)
const isSaving = ref(false)

const kelasList = ref<any[]>([])
const mapelList = ref<any[]>([])

// Form data
const form = ref({
  judul: '',
  deskripsi: '',
  kelas: [] as string[],
  mapelId: '',
  shuffleQuestions: false,
  showScore: true,
})

// Date/time inputs
const now = new Date()
const startDate = ref(formatDateInput(now))
const startTime = ref(formatTimeInput(now))
const endDate = ref(formatDateInput(new Date(now.getTime() + 90 * 60000)))
const endTime = ref(formatTimeInput(new Date(now.getTime() + 90 * 60000)))

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimeInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const toggleKelas = (kelasNama: string) => {
  const idx = form.value.kelas.indexOf(kelasNama)
  if (idx === -1) {
    form.value.kelas.push(kelasNama)
  } else {
    form.value.kelas.splice(idx, 1)
  }
}

const handleCreate = async () => {
  // Validate
  if (!form.value.judul) {
    toast.error('Judul ujian wajib diisi')
    return
  }
  if (form.value.kelas.length === 0) {
    toast.error('Pilih minimal 1 kelas')
    return
  }
  if (!form.value.mapelId) {
    toast.error('Pilih mata pelajaran')
    return
  }

  // Build datetime as local string (Jakarta time) — do NOT convert to UTC
  const startUjian = `${startDate.value}T${startTime.value}`
  const endUjian = `${endDate.value}T${endTime.value}`

  if (new Date(endUjian) <= new Date(startUjian)) {
    toast.error('Waktu akhir harus lebih besar dari waktu mulai')
    return
  }

  isSaving.value = true
  try {
    const response = await fetchApi('/api/guru/ujian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judul: form.value.judul,
        deskripsi: form.value.deskripsi,
        kelas: form.value.kelas,
        mapelId: form.value.mapelId,
        startUjian,
        endUjian,
        shuffleQuestions: form.value.shuffleQuestions,
        showScore: form.value.showScore,
        status: 'draft',
      }),
    })

    const data = await response.json()

    if (data.success) {
      toast.success('Ujian berhasil dibuat. Silakan tambahkan soal.')
      navigateTo(`/guru/ujian/${data.data.id}/edit`)
    } else {
      toast.error(data.error || 'Gagal membuat ujian')
    }
  } catch (err) {
    console.error('Error creating ujian:', err)
    toast.error('Terjadi kesalahan saat membuat ujian')
  } finally {
    isSaving.value = false
  }
}

const fetchData = async () => {
  try {
    // Try to get kelas and mapel from guru/ujian endpoint first
    const response = await fetchApi('/api/guru/ujian?status=all')
    const data = await response.json()
    
    if (data.success) {
      kelasList.value = data.data?.kelasList || []
      mapelList.value = data.data?.mapelList || []
    }
    
    // If lists are empty, fetch them separately from admin endpoints
    if (kelasList.value.length === 0) {
      try {
        const kelasRes = await fetchApi('/api/admin/kelas')
        const kelasData = await kelasRes.json()
        if (kelasData.success) {
          kelasList.value = kelasData.data || []
        }
      } catch (e) {
        console.error('Error fetching kelas:', e)
      }
    }
    
    if (mapelList.value.length === 0) {
      try {
        const mapelRes = await fetchApi('/api/admin/mapel')
        const mapelData = await mapelRes.json()
        if (mapelData.success) {
          mapelList.value = mapelData.data || []
        }
      } catch (e) {
        console.error('Error fetching mapel:', e)
      }
    }
  } catch (err) {
    console.error('Error fetching data:', err)
  }
}

onMounted(async () => {
  try {
    await fetchData()
  } catch (err) {
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
