<template>
  <div class="min-h-screen bg-[#E8F4F8]">
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
    
    <div v-else-if="error" class="min-h-screen flex items-center justify-center">
      <p class="text-red-600">Gagal memuat data dashboard</p>
    </div>
    
    <div v-else class="max-w-lg mx-auto px-4 py-6 pb-24">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="text-gray-500 text-sm">Hello,</p>
          <h1 class="text-2xl font-bold text-gray-900">{{ siswa?.nama || 'Siswa' }}</h1>
        </div>
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
          <img
            src="/avatars/siswa.png"
            alt="Avatar"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
        </div>
      </div>

      <!-- Hero Banner -->
      <div class="bg-gradient-to-r from-[#C5E8DC] to-[#B8E5D5] rounded-3xl p-5 mb-6 relative overflow-hidden">
        <div class="relative z-10 max-w-[60%]">
          <h2 class="text-gray-800 text-xl font-bold mb-2">Apa yang ingin kamu pelajari hari ini?</h2>
          <button 
            @click="navigateTo('/siswa/ujian')"
            class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Mulai Ujian
          </button>
        </div>
        
        <div class="absolute right-2 bottom-0 w-32 h-32 flex items-end justify-center">
          <div class="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center">
            <Icon name="ph:sparkle-duotone" class="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="flex gap-3 mb-6">
        <div class="flex-1 bg-white rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <Icon name="ph:trophy-fill" class="w-4 h-4 text-orange-500" />
            <span class="text-xs text-gray-500">Rata-rata</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ rataRataNilai }}</p>
        </div>
        <div class="flex-1 bg-white rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <Icon name="ph:clock-fill" class="w-4 h-4 text-blue-500" />
            <span class="text-xs text-gray-500">Mendatang</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ jumlahUjianMendatang }}</p>
        </div>
        <div class="flex-1 bg-white rounded-2xl p-4 shadow-sm">
          <div class="flex items-center gap-2 mb-1">
            <Icon name="ph:check-circle-fill" class="w-4 h-4 text-green-500" />
            <span class="text-xs text-gray-500">Selesai</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ totalUjianSelesai }}</p>
        </div>
      </div>

      <!-- Section Title -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Ujian Terbaru</h3>
        <button 
          @click="navigateTo('/siswa/ujian')"
          class="text-sm text-orange-500 font-medium"
        >
          Lihat Semua
        </button>
      </div>

      <!-- Ujian List -->
      <div v-if="allUjian.length === 0" class="bg-white rounded-3xl p-8 text-center shadow-sm">
        <Icon name="ph:book-open-duotone" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">Belum ada ujian tersedia</p>
      </div>
      
      <div v-else class="space-y-3">
        <div 
          v-for="(u, index) in allUjian.slice(0, 5)"
          :key="u.id"
          @click="navigateTo(u.submission ? `/siswa/ujian/${u.id}/hasil` : `/siswa/ujian/${u.id}`)"
          class="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center', iconBgColors[index % 4]]">
            <Icon name="ph:exam-duotone" :class="['w-7 h-7', iconColors[index % 4]]" />
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="font-semibold text-gray-900 truncate">{{ u.judul }}</h4>
              <span v-if="u.isSusulan" class="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium flex-shrink-0">Susulan</span>
            </div>
            <p class="text-xs text-gray-500">
              {{ u.mapel }} • {{ Math.round((new Date(u.endUjian).getTime() - new Date(u.startUjian).getTime()) / 60000) }} menit
            </p>
          </div>

          <div class="flex items-center gap-2">
            <template v-if="u.submission">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-green-600">{{ u.submission.nilai ?? '-' }}</span>
                <Icon name="ph:check-circle-fill" class="w-5 h-5 text-green-500" />
              </div>
            </template>
            <template v-else>
              <div :class="['w-10 h-10 rounded-full flex items-center justify-center', u.canStart ? 'bg-orange-500' : u.examStatus === 'berakhir' ? 'bg-red-200' : 'bg-gray-200']">
                <Icon :name="u.examStatus === 'berakhir' ? 'ph:x-bold' : 'ph:play-fill'" :class="['w-5 h-5', u.canStart ? 'text-white' : u.examStatus === 'berakhir' ? 'text-red-500' : 'text-gray-400']" />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
      <div class="max-w-lg mx-auto flex justify-around">
        <button 
          @click="navigateTo('/siswa')"
          class="flex flex-col items-center gap-1 text-orange-500"
        >
          <Icon name="ph:house-fill" class="w-6 h-6" />
          <span class="text-xs font-medium">Home</span>
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
          class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="ph:trophy-duotone" class="w-6 h-6" />
          <span class="text-xs">Raport</span>
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
  title: 'Dashboard Siswa',
})

const isLoading = ref(true)
const error = ref<Error | null>(null)
const dashboardData = ref<any>(null)
const ujianData = ref<any>(null)

const iconBgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100']
const iconColors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600']

const siswa = computed(() => dashboardData.value?.data?.siswa || {})
const stats = computed(() => dashboardData.value?.data?.stats || {})
const allUjian = computed(() => ujianData.value?.data?.ujian || [])

const rataRataNilai = computed(() => stats.value.rataRataNilai || 0)
const jumlahUjianMendatang = computed(() => {
  const now = new Date()
  return allUjian.value.filter((u: any) => {
    const examStartTime = new Date(u.startUjian)
    return !u.submission && examStartTime >= now
  }).length
})
const totalUjianSelesai = computed(() => allUjian.value.filter((u: any) => u.submission).length)

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

onMounted(async () => {
  try {
    const [dashboardRes, ujianRes] = await Promise.all([
      fetchApi('/api/siswa/ujian/dashboard'),
      fetchApi('/api/siswa/ujian'),
    ])
    
    dashboardData.value = await dashboardRes.json()
    ujianData.value = await ujianRes.json()
  } catch (err) {
    error.value = err as Error
  } finally {
    isLoading.value = false
  }
})
</script>
