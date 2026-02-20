<template>
  <div class="min-h-screen bg-[#E8F4F8]">
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
    
    <div v-else class="max-w-lg mx-auto px-4 py-6 pb-24">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Daftar Ujian</h1>
        <p class="text-gray-500 text-sm">Pilih ujian yang ingin dikerjakan</p>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            activeTab === tab.value
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Ujian List -->
      <div v-if="filteredUjian.length === 0" class="bg-white rounded-3xl p-8 text-center shadow-sm">
        <Icon name="ph:book-open-duotone" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">Tidak ada ujian</p>
      </div>
      
      <div v-else class="space-y-3">
        <div 
          v-for="(u, index) in filteredUjian"
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
              {{ u.mapel }} • {{ formatDuration(u.startUjian, u.endUjian) }} menit
            </p>
            <p class="text-xs mt-1" :class="getExamStatusColor(u)">
              {{ getExamStatusText(u) }}
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
          class="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="ph:house-duotone" class="w-6 h-6" />
          <span class="text-xs">Home</span>
        </button>
        <button 
          @click="navigateTo('/siswa/ujian')"
          class="flex flex-col items-center gap-1 text-orange-500"
        >
          <Icon name="ph:exam-fill" class="w-6 h-6" />
          <span class="text-xs font-medium">Ujian</span>
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
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

definePageMeta({
  layout: 'siswa',
})

useHead({
  title: 'Daftar Ujian',
})

const isLoading = ref(true)
const ujianData = ref<any>(null)
const activeTab = ref('all')

const tabs = [
  { value: 'all', label: 'Semua' },
  { value: 'upcoming', label: 'Mendatang' },
  { value: 'completed', label: 'Selesai' },
]

const iconBgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100']
const iconColors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600']

const allUjian = computed(() => ujianData.value?.data?.ujian || [])

const filteredUjian = computed(() => {
  const now = new Date()
  switch (activeTab.value) {
    case 'upcoming':
      return allUjian.value.filter((u: any) => !u.submission && new Date(u.startUjian) >= now)
    case 'completed':
      return allUjian.value.filter((u: any) => u.submission)
    default:
      return allUjian.value
  }
})

const formatDuration = (start: string, end: string) => {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: id })
}

const getExamStatusText = (u: any) => {
  if (u.examStatus === 'susulan') return 'Susulan tersedia'
  if (u.examStatus === 'berlangsung') return 'Sedang berlangsung'
  if (u.examStatus === 'berakhir') return 'Waktu habis'
  if (u.examStatus === 'selesai') return 'Selesai'
  return formatDate(u.startUjian)
}

const getExamStatusColor = (u: any) => {
  if (u.examStatus === 'susulan') return 'text-orange-500'
  if (u.examStatus === 'berlangsung') return 'text-green-500'
  if (u.examStatus === 'berakhir') return 'text-red-400'
  return 'text-gray-400'
}

onMounted(async () => {
  try {
    const response = await fetchApi('/api/siswa/ujian')
    ujianData.value = await response.json()
  } catch (err) {
    console.error('Error fetching ujian:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
