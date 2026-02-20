<template>
  <div class="min-h-screen bg-[#E8F4F8]">
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
    
    <div v-else class="max-w-lg mx-auto px-4 py-6 pb-24">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Raport</h1>
        <p class="text-gray-500 text-sm">{{ siswaInfo?.nama }} — {{ siswaInfo?.kelas || '-' }}</p>
      </div>

      <!-- Stats Summary -->
      <div class="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white mb-6">
        <div class="text-center">
          <p class="text-white/80 text-sm mb-1">Rata-rata Nilai</p>
          <p class="text-4xl font-bold">{{ rataRataKeseluruhan }}</p>
        </div>
        <div class="flex justify-around mt-4 pt-4 border-t border-white/20">
          <div class="text-center">
            <p class="text-2xl font-bold">{{ totalUjianDinilai }}</p>
            <p class="text-white/80 text-xs">Total Ujian</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold">{{ nilaiTertinggi }}</p>
            <p class="text-white/80 text-xs">Tertinggi</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold">{{ nilaiTerendah }}</p>
            <p class="text-white/80 text-xs">Terendah</p>
          </div>
        </div>
      </div>

      <!-- Per-Mapel Sections -->
      <div v-if="raportList.length === 0" class="bg-white rounded-2xl p-8 text-center shadow-sm">
        <Icon name="ph:chart-bar-duotone" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">Belum ada nilai</p>
      </div>

      <div v-else class="space-y-5">
        <div v-for="mapelGroup in raportList" :key="mapelGroup.mapel" class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <!-- Mapel Header -->
          <div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div>
              <h4 class="font-semibold text-gray-900">{{ mapelGroup.mapel }}</h4>
              <p class="text-xs text-gray-500">{{ mapelGroup.totalUjian }} ujian</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500">Rata-rata</p>
              <p :class="['text-xl font-bold', getNilaiColor(mapelGroup.rataRata)]">{{ mapelGroup.rataRata }}</p>
            </div>
          </div>
          <!-- Ujian List -->
          <div class="divide-y divide-gray-100">
            <div
              v-for="ujian in mapelGroup.ujian"
              :key="ujian.id"
              class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              @click="navigateTo(`/siswa/ujian/${ujian.id}/hasil`)"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ ujian.judul }}</p>
                <p class="text-xs text-gray-400">{{ formatDate(ujian.tanggal) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <p :class="['text-lg font-bold', getNilaiColor(ujian.nilai)]">
                  {{ ujian.nilai ?? '-' }}
                </p>
                <Icon name="lucide:chevron-right" class="w-4 h-4 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
      <div class="max-w-lg mx-auto flex justify-around">
        <button 
          @click="navigateTo('/siswa')"
          class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="ph:house-duotone" class="w-6 h-6" />
          <span class="text-xs">Home</span>
        </button>
        <button 
          @click="navigateTo('/siswa/ujian')"
          class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="ph:exam-duotone" class="w-6 h-6" />
          <span class="text-xs">Ujian</span>
        </button>
        <button 
          @click="navigateTo('/siswa/raport')"
          class="flex flex-col items-center gap-1 text-orange-500"
        >
          <Icon name="ph:trophy-fill" class="w-6 h-6" />
          <span class="text-xs font-medium">Raport</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'siswa',
})

useHead({
  title: 'Raport',
})

const isLoading = ref(true)
const siswaInfo = ref<any>(null)
const raportList = ref<any[]>([])
const rataRataKeseluruhan = ref(0)
const totalUjianDinilai = ref(0)

const allNilai = computed(() => {
  const vals: number[] = []
  for (const g of raportList.value) {
    for (const u of g.ujian || []) {
      if (u.nilai !== null && u.nilai !== undefined) vals.push(u.nilai)
    }
  }
  return vals
})

const nilaiTertinggi = computed(() => {
  if (allNilai.value.length === 0) return 0
  return Math.max(...allNilai.value)
})

const nilaiTerendah = computed(() => {
  if (allNilai.value.length === 0) return 0
  return Math.min(...allNilai.value)
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
}

const getNilaiColor = (nilai: number | null) => {
  if (nilai === null || nilai === undefined) return 'text-gray-400'
  if (nilai >= 80) return 'text-green-600'
  if (nilai >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

onMounted(async () => {
  try {
    const response = await fetchApi('/api/siswa/raport')
    const data = await response.json()
    if (data.success && data.data) {
      siswaInfo.value = data.data.siswa || null
      raportList.value = data.data.raport || []
      rataRataKeseluruhan.value = data.data.rataRataKeseluruhan || 0
      totalUjianDinilai.value = data.data.totalUjianDinilai || 0
    }
  } catch (err) {
    console.error('Error fetching raport:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
