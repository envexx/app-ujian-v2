<template>
  <!-- Child route (kerjakan, hasil) — render child page directly -->
  <NuxtPage v-if="hasChildRoute" />

  <!-- Detail page (no child route) -->
  <div v-else class="min-h-screen bg-[#E8F4F8]">
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
    
    <div v-else-if="error" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <Button @click="navigateTo('/siswa/ujian')">Kembali</Button>
      </div>
    </div>
    
    <div v-else class="max-w-lg mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <button @click="navigateTo('/siswa/ujian')" class="p-2 hover:bg-white rounded-lg">
          <Icon name="ph:arrow-left" class="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ ujian?.judul }}</h1>
          <p class="text-gray-500 text-sm">{{ ujian?.mapel }}</p>
        </div>
      </div>

      <!-- Ujian Info Card -->
      <div class="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Durasi</span>
            <span class="font-semibold">{{ formatDuration }} menit</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Jumlah Soal</span>
            <span class="font-semibold">{{ ujian?.jumlahSoal || 0 }} soal</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Mulai</span>
            <span class="font-semibold">{{ formatDate(ujian?.startUjian) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500">Selesai</span>
            <span class="font-semibold">{{ formatDate(ujian?.endUjian) }}</span>
          </div>
        </div>
      </div>

      <!-- Susulan Badge -->
      <div v-if="ujian?.isSusulan" class="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <Icon name="ph:warning-circle-fill" class="w-6 h-6 text-orange-500 flex-shrink-0" />
        <div>
          <p class="text-orange-700 font-semibold text-sm">Ujian Susulan</p>
          <p class="text-orange-600 text-xs">Anda mendapat akses susulan dari admin. Segera kerjakan sebelum waktu habis.</p>
        </div>
      </div>

      <!-- Token Input -->
      <div v-if="!ujian?.submission && ujian?.canStart" class="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">Masukkan Token Ujian</h3>
        <div class="space-y-4">
          <Input
            v-model="token"
            placeholder="Masukkan token ujian"
            class="text-center text-lg tracking-widest uppercase"
            :disabled="isValidating"
          />
          <Button 
            @click="validateToken"
            class="w-full"
            :disabled="!token || isValidating"
          >
            {{ isValidating ? 'Memvalidasi...' : 'Mulai Ujian' }}
          </Button>
        </div>
      </div>

      <!-- Status Messages -->
      <div v-if="ujian?.submission" class="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <Icon name="ph:check-circle-fill" class="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p class="text-green-700 font-semibold">Ujian sudah dikerjakan</p>
        <p class="text-green-600 text-sm mt-1">Nilai: {{ ujian.submission.nilai ?? '-' }}</p>
        <Button 
          @click="navigateTo(`/siswa/ujian/${route.params.id}/hasil`)"
          class="mt-4"
          variant="outline"
        >
          Lihat Hasil
        </Button>
      </div>

      <div v-else-if="!ujian?.canStart && ujian?.examStatus === 'berakhir'" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <Icon name="ph:x-circle" class="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p class="text-red-700 font-semibold">Waktu ujian sudah berakhir</p>
        <p class="text-red-600 text-sm mt-1">Hubungi admin jika Anda perlu ujian susulan</p>
      </div>

      <div v-else-if="!ujian?.canStart" class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
        <Icon name="ph:clock" class="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p class="text-yellow-700 font-semibold">Ujian belum dimulai</p>
        <p class="text-yellow-600 text-sm mt-1">Tunggu hingga waktu ujian dimulai</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'siswa',
})

const route = useRoute()
const isLoading = ref(true)
const error = ref<string | null>(null)
const ujian = ref<any>(null)
const token = ref('')
const isValidating = ref(false)

// Detect child routes (kerjakan, hasil) — render NuxtPage instead of detail content
const hasChildRoute = computed(() => {
  const path = route.path
  const idSegment = `/siswa/ujian/${route.params.id}`
  return path !== idSegment && path.startsWith(idSegment + '/')
})

useHead({
  title: computed(() => ujian.value?.judul || 'Detail Ujian'),
})

const formatDuration = computed(() => {
  if (!ujian.value) return 0
  return Math.round((new Date(ujian.value.endUjian).getTime() - new Date(ujian.value.startUjian).getTime()) / 60000)
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: idLocale })
}

const validateToken = async () => {
  if (!token.value) {
    toast.error('Masukkan token ujian')
    return
  }

  isValidating.value = true
  try {
    const response = await fetchApi('/api/siswa/ujian/validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: token.value 
      }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      toast.success('Token valid! Memulai ujian...')
      navigateTo(`/siswa/ujian/${route.params.id}/kerjakan`)
    } else {
      toast.error(data.error || 'Token tidak valid')
    }
  } catch (err) {
    toast.error('Gagal memvalidasi token')
  } finally {
    isValidating.value = false
  }
}

onMounted(async () => {
  // Skip data fetch on child routes (kerjakan, hasil handle their own data)
  if (hasChildRoute.value) return

  try {
    const response = await fetchApi(`/api/siswa/ujian/${route.params.id}`)
    const data = await response.json()
    
    if (data.success) {
      // Flatten: merge ujian info with top-level fields (canStart, isSusulan, examStatus, submission)
      ujian.value = {
        ...data.data.ujian,
        canStart: data.data.canStart,
        isSusulan: data.data.isSusulan,
        examStatus: data.data.examStatus,
        submission: data.data.submission,
        timeRemaining: data.data.timeRemaining,
        accessMessage: data.data.accessMessage,
      }
    } else {
      error.value = data.error || 'Gagal memuat data ujian'
    }
  } catch (err) {
    error.value = 'Terjadi kesalahan'
  } finally {
    isLoading.value = false
  }
})
</script>
