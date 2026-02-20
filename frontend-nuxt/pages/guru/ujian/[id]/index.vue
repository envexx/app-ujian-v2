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
          <h1 class="text-2xl font-bold text-gray-900">{{ ujian?.judul || 'Detail Ujian' }}</h1>
          <p class="text-sm text-gray-500">{{ typeof ujian?.mapel === 'object' ? ujian?.mapel?.nama : ujian?.mapel || 'Mata Pelajaran' }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" icon="lucide:printer" :loading="isPrinting" @click="handlePrintSoal">
          Print Soal
        </Button>
        <Button variant="outline" icon="lucide:pencil" @click="navigateTo(`/guru/ujian/${ujianId}/edit`)">
          Edit
        </Button>
        <Button 
          v-if="ujian?.status === 'draft'"
          @click="publishUjian"
          :loading="isPublishing"
          icon="lucide:send"
          class="bg-green-500 hover:bg-green-600 text-white"
        >
          Publish
        </Button>
        <Button 
          v-else-if="ujian?.status === 'active'"
          @click="unpublishUjian"
          :loading="isPublishing"
          variant="outline"
          icon="lucide:pause"
        >
          Unpublish
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>

    <div v-else class="space-y-6">
      <!-- Info Card -->
      <div class="bg-white rounded-2xl card-shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Informasi Ujian</h3>
          <span :class="getStatusClass(ujian?.status)">
            {{ getStatusLabel(ujian?.status) }}
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-gray-500 mb-1">Mata Pelajaran</p>
            <p class="font-medium text-gray-900">{{ typeof ujian?.mapel === 'object' ? ujian?.mapel?.nama : ujian?.mapel || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Kelas</p>
            <p class="font-medium text-gray-900">{{ formatKelas(ujian?.kelas) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Waktu Mulai</p>
            <p class="font-medium text-gray-900">{{ formatDateTime(ujian?.startUjian) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Waktu Selesai</p>
            <p class="font-medium text-gray-900">{{ formatDateTime(ujian?.endUjian) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p class="text-sm text-gray-500 mb-1">Total Soal</p>
            <p class="text-2xl font-bold text-gray-900">{{ soalList.length }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Total Poin</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalPoin }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Acak Soal</p>
            <p class="font-medium text-gray-900">{{ ujian?.shuffleQuestions ? 'Ya' : 'Tidak' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Tampilkan Nilai</p>
            <p class="font-medium text-gray-900">{{ ujian?.showScore ? 'Ya' : 'Tidak' }}</p>
          </div>
        </div>

        <div v-if="ujian?.deskripsi" class="mt-6 pt-6 border-t border-gray-100">
          <p class="text-sm text-gray-500 mb-2">Deskripsi</p>
          <div class="prose prose-sm max-w-none" v-html="ujian.deskripsi"></div>
        </div>
      </div>

      <!-- Soal Preview -->
      <div class="bg-white rounded-2xl card-shadow">
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Daftar Soal</h3>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="showAnswerKey"
                class="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span class="text-sm text-gray-600">Tampilkan Kunci Jawaban</span>
            </label>
          </div>
        </div>

        <div class="p-6">
          <div v-if="soalList.length === 0" class="text-center py-12">
            <Icon name="lucide:file-question" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500">Belum ada soal</p>
          </div>

          <div v-else class="space-y-6">
            <div 
              v-for="(soal, index) in soalList" 
              :key="soal.id"
              class="border border-gray-200 rounded-xl p-5"
            >
              <!-- Soal Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-semibold text-sm">
                    {{ index + 1 }}
                  </div>
                  <span :class="getTipeBadgeClass(soal.tipe)">
                    {{ getTipeLabel(soal.tipe) }}
                  </span>
                  <span class="text-sm text-gray-500">{{ soal.poin }} poin</span>
                </div>
              </div>

              <!-- Pertanyaan -->
              <div class="mb-4">
                <div class="prose prose-sm max-w-none" v-html="soal.pertanyaan || '<em class=\'text-gray-400\'>Tidak ada pertanyaan</em>'"></div>
              </div>

              <!-- Pilihan Ganda -->
              <div v-if="soal.tipe === 'PILIHAN_GANDA'" class="space-y-2">
                <div 
                  v-for="opsi in (soal.data?.opsi || [])" 
                  :key="opsi.label"
                  :class="[
                    'flex items-center gap-3 p-3 border rounded-lg transition-colors',
                    showAnswerKey && soal.data?.kunciJawaban === opsi.label
                      ? 'bg-green-50 border-green-400'
                      : 'bg-white border-gray-200'
                  ]"
                >
                  <div :class="[
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    showAnswerKey && soal.data?.kunciJawaban === opsi.label
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  ]">
                    <div v-if="showAnswerKey && soal.data?.kunciJawaban === opsi.label" class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <span :class="[
                    'font-semibold text-sm',
                    showAnswerKey && soal.data?.kunciJawaban === opsi.label ? 'text-green-700' : 'text-gray-700'
                  ]">{{ opsi.label }}.</span>
                  <span 
                    :class="[
                      'text-sm flex-1',
                      showAnswerKey && soal.data?.kunciJawaban === opsi.label ? 'text-green-900' : 'text-gray-700'
                    ]"
                    v-html="opsi.text || '-'"
                  ></span>
                  <Icon 
                    v-if="showAnswerKey && soal.data?.kunciJawaban === opsi.label" 
                    name="lucide:check-circle" 
                    class="w-5 h-5 text-green-600 ml-auto"
                  />
                </div>
              </div>

              <!-- Essay -->
              <div v-if="soal.tipe === 'ESSAY'" class="space-y-3">
                <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p class="text-sm text-gray-400 italic">Siswa akan menulis jawaban di sini...</p>
                </div>
                <div v-if="showAnswerKey && soal.data?.kunciJawaban" class="p-3 bg-green-50 border border-green-300 rounded-lg">
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <Icon name="lucide:check-circle" class="w-4 h-4 text-green-600" />
                    <p class="text-xs font-semibold text-green-700">Kunci Jawaban</p>
                  </div>
                  <p class="text-sm text-green-900">{{ soal.data.kunciJawaban }}</p>
                </div>
              </div>

              <!-- Isian Singkat -->
              <div v-if="soal.tipe === 'ISIAN_SINGKAT'" class="space-y-3">
                <div class="h-10 bg-white border border-gray-300 rounded-md px-3 flex items-center">
                  <span class="text-sm text-gray-400 italic">Ketik jawaban singkat...</span>
                </div>
                <div v-if="showAnswerKey" class="p-3 bg-green-50 border border-green-300 rounded-lg">
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <Icon name="lucide:check-circle" class="w-4 h-4 text-green-600" />
                    <p class="text-xs font-semibold text-green-700">
                      Jawaban yang Diterima {{ soal.data?.caseSensitive ? '(Case Sensitive)' : '' }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <span 
                      v-for="(jawaban, idx) in (soal.data?.kunciJawaban || [])" 
                      :key="idx"
                      class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                    >
                      {{ jawaban || '(kosong)' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Benar/Salah -->
              <div v-if="soal.tipe === 'BENAR_SALAH'" class="space-y-3">
                <div class="flex gap-3">
                  <div :class="[
                    'flex-1 p-3 border rounded-lg text-center font-medium',
                    showAnswerKey && soal.data?.kunciJawaban === true
                      ? 'bg-green-50 border-green-400 text-green-700'
                      : 'bg-white border-gray-200 text-gray-700'
                  ]">
                    Benar
                    <Icon v-if="showAnswerKey && soal.data?.kunciJawaban === true" name="lucide:check" class="w-4 h-4 inline ml-1 text-green-600" />
                  </div>
                  <div :class="[
                    'flex-1 p-3 border rounded-lg text-center font-medium',
                    showAnswerKey && soal.data?.kunciJawaban === false
                      ? 'bg-green-50 border-green-400 text-green-700'
                      : 'bg-white border-gray-200 text-gray-700'
                  ]">
                    Salah
                    <Icon v-if="showAnswerKey && soal.data?.kunciJawaban === false" name="lucide:check" class="w-4 h-4 inline ml-1 text-green-600" />
                  </div>
                </div>
              </div>

              <!-- Pencocokan -->
              <div v-if="soal.tipe === 'PENCOCOKAN'" class="space-y-4">
                <div class="grid grid-cols-2 gap-6">
                  <!-- Item Kiri -->
                  <div class="space-y-2">
                    <p class="text-sm font-medium text-gray-700">Item Kiri</p>
                    <div 
                      v-for="(item, idx) in (soal.data?.itemKiri || [])" 
                      :key="item.id || idx"
                      class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <span class="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded text-xs font-bold">
                        {{ idx + 1 }}
                      </span>
                      <span class="text-sm flex-1" v-html="item.text || '-'"></span>
                    </div>
                  </div>
                  
                  <!-- Item Kanan -->
                  <div class="space-y-2">
                    <p class="text-sm font-medium text-gray-700">Item Kanan</p>
                    <div 
                      v-for="(item, idx) in (soal.data?.itemKanan || [])" 
                      :key="item.id || idx"
                      class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <span class="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded text-xs font-bold">
                        {{ String.fromCharCode(65 + idx) }}
                      </span>
                      <span class="text-sm flex-1" v-html="item.text || '-'"></span>
                    </div>
                  </div>
                </div>
                
                <!-- Kunci Jawaban Pencocokan -->
                <div v-if="showAnswerKey && soal.data?.jawaban" class="p-4 bg-green-50 border border-green-300 rounded-lg">
                  <div class="flex items-center gap-1.5 mb-3">
                    <Icon name="lucide:check-circle" class="w-4 h-4 text-green-600" />
                    <p class="text-sm font-semibold text-green-700">Kunci Jawaban</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <template v-for="(kananIds, kiriId) in soal.data.jawaban" :key="kiriId">
                      <template v-if="Array.isArray(kananIds)">
                        <div 
                          v-for="kananId in kananIds" 
                          :key="`${kiriId}-${kananId}`"
                          class="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-green-300"
                        >
                          <span class="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded text-xs font-bold">
                            {{ getKiriIndex(soal.data.itemKiri, kiriId) + 1 }}
                          </span>
                          <Icon name="lucide:arrow-right" class="w-3 h-3 text-green-500" />
                          <span class="w-5 h-5 flex items-center justify-center bg-green-500 text-white rounded text-xs font-bold">
                            {{ String.fromCharCode(65 + getKananIndex(soal.data.itemKanan, kananId)) }}
                          </span>
                        </div>
                      </template>
                      <div 
                        v-else
                        class="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-green-300"
                      >
                        <span class="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded text-xs font-bold">
                          {{ getKiriIndex(soal.data.itemKiri, kiriId) + 1 }}
                        </span>
                        <Icon name="lucide:arrow-right" class="w-3 h-3 text-green-500" />
                        <span class="w-5 h-5 flex items-center justify-center bg-green-500 text-white rounded text-xs font-bold">
                          {{ String.fromCharCode(65 + getKananIndex(soal.data.itemKanan, kananIds)) }}
                        </span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'guru',
})

useHead({
  title: 'Detail Ujian',
})

const route = useRoute()
const ujianId = route.params.id as string

const { printSoal, isPrinting } = usePrintSoal()

const isLoading = ref(true)
const isPublishing = ref(false)
const showAnswerKey = ref(false)
const ujian = ref<any>(null)
const soalList = ref<any[]>([])

const totalPoin = computed(() => {
  return soalList.value.reduce((sum, soal) => sum + (soal.poin || 0), 0)
})

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: idLocale })
}

const formatKelas = (kelas: any) => {
  if (!kelas) return '-'
  if (Array.isArray(kelas)) return kelas.join(', ')
  return kelas
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-600',
    aktif: 'px-3 py-1 text-sm rounded-full bg-green-100 text-green-600',
    selesai: 'px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-600',
  }
  return classes[status] || classes.draft
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    aktif: 'Aktif',
    selesai: 'Selesai',
  }
  return labels[status] || status
}

const getTipeLabel = (tipe: string) => {
  const labels: Record<string, string> = {
    PILIHAN_GANDA: 'Pilihan Ganda',
    ESSAY: 'Essay',
    ISIAN_SINGKAT: 'Isian Singkat',
    BENAR_SALAH: 'Benar/Salah',
    PENCOCOKAN: 'Pencocokan',
  }
  return labels[tipe] || tipe
}

const getTipeBadgeClass = (tipe: string) => {
  const classes: Record<string, string> = {
    PILIHAN_GANDA: 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700',
    ESSAY: 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-700',
    ISIAN_SINGKAT: 'px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700',
    BENAR_SALAH: 'px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700',
    PENCOCOKAN: 'px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-700',
  }
  return classes[tipe] || 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700'
}

const handlePrintSoal = async () => {
  if (soalList.value.length === 0) {
    toast.error('Belum ada soal untuk dicetak')
    return
  }
  const mapelNama = typeof ujian.value?.mapel === 'object' ? ujian.value?.mapel?.nama : ujian.value?.mapel || ''
  const kelas = Array.isArray(ujian.value?.kelas) ? ujian.value.kelas : []
  try {
    await printSoal(
      { judul: ujian.value?.judul || 'Ujian', mapel: mapelNama, kelas },
      soalList.value,
    )
  } catch {
    toast.error('Gagal membuat PDF soal')
  }
}

const publishUjian = async () => {
  isPublishing.value = true
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujianId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success('Ujian berhasil dipublish')
      ujian.value.status = 'active'
    } else {
      toast.error(data.error || 'Gagal mempublish ujian')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isPublishing.value = false
  }
}

const unpublishUjian = async () => {
  isPublishing.value = true
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujianId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success('Ujian berhasil di-unpublish')
      ujian.value.status = 'draft'
    } else {
      toast.error(data.error || 'Gagal mengubah status ujian')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isPublishing.value = false
  }
}

// Helper functions for pencocokan
const getKiriIndex = (itemKiri: any[], kiriId: string): number => {
  if (!itemKiri) return -1
  return itemKiri.findIndex(item => item.id === kiriId)
}

const getKananIndex = (itemKanan: any[], kananId: string): number => {
  if (!itemKanan) return -1
  return itemKanan.findIndex(item => item.id === kananId)
}

const fetchData = async () => {
  try {
    const [ujianRes, soalRes] = await Promise.all([
      fetchApi(`/api/guru/ujian/${ujianId}`),
      fetchApi(`/api/guru/ujian/${ujianId}/soal`),
    ])

    const ujianData = await ujianRes.json()
    const soalData = await soalRes.json()

    if (ujianData.success && ujianData.data?.ujian) {
      ujian.value = ujianData.data.ujian
    }
    if (soalData.success) {
      soalList.value = soalData.data || []
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

<style scoped>
@media print {
  .card-shadow {
    box-shadow: none !important;
    border: 1px solid #e5e7eb;
  }
}
</style>
