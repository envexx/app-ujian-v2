<template>
  <div class="space-y-6">
    <!-- Token Ujian Card -->
    <div :class="[
      'rounded-2xl card-shadow p-5 transition-all',
      tokenData.isActive ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-white'
    ]">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div :class="[
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            tokenData.isActive ? 'bg-white/20' : 'bg-orange-100'
          ]">
            <Icon name="lucide:key-round" :class="['w-5 h-5', tokenData.isActive ? 'text-white' : 'text-orange-600']" />
          </div>
          <div class="min-w-0">
            <p :class="['text-sm font-medium', tokenData.isActive ? 'text-white/80' : 'text-gray-500']">Token Akses Ujian</p>
            <div v-if="tokenData.isActive && tokenData.currentToken" class="flex items-center gap-2 mt-0.5">
              <p class="text-2xl font-mono font-bold tracking-[0.3em]">{{ tokenData.currentToken }}</p>
              <button @click="copyToken" class="p-1 hover:bg-white/20 rounded transition-colors">
                <Icon name="lucide:copy" class="w-4 h-4" />
              </button>
            </div>
            <p v-else :class="['text-sm', tokenData.isActive ? 'text-white/70' : 'text-gray-400']">Belum ada token aktif</p>
          </div>
        </div>

        <!-- Countdown Timer -->
        <div v-if="tokenData.isActive && tokenCountdown > 0" class="flex items-center gap-3 flex-shrink-0">
          <div class="text-center">
            <p :class="['text-2xl font-bold font-mono', tokenData.isActive ? 'text-white' : 'text-gray-900']">{{ formatCountdown }}</p>
            <p :class="['text-xs', tokenData.isActive ? 'text-white/70' : 'text-gray-400']">Sisa waktu</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <template v-if="tokenData.isActive">
            <Button
              size="sm"
              variant="outline"
              class="!bg-white/20 !border-white/30 !text-white hover:!bg-white/30"
              @click="deactivateToken"
              :loading="isDeactivatingToken"
            >
              <Icon name="lucide:x" class="w-4 h-4 mr-1" />
              Nonaktifkan
            </Button>
          </template>
          <template v-else>
            <Button
              size="sm"
              @click="generateToken"
              :loading="isGeneratingToken"
            >
              <Icon name="lucide:zap" class="w-4 h-4 mr-1" />
              Aktifkan Token (5 menit)
            </Button>
          </template>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl card-shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon name="lucide:file-text" class="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900">{{ stats.total }}</p>
            <p class="text-xs text-gray-500">Total Ujian</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl card-shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <Icon name="lucide:check-circle" class="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900">{{ stats.aktif }}</p>
            <p class="text-xs text-gray-500">Aktif</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl card-shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Icon name="lucide:clock" class="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900">{{ stats.berlangsung }}</p>
            <p class="text-xs text-gray-500">Berlangsung</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl card-shadow p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon name="lucide:archive" class="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p class="text-xl font-bold text-gray-900">{{ stats.selesai }}</p>
            <p class="text-xs text-gray-500">Selesai</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & Search -->
    <div class="bg-white rounded-2xl card-shadow p-4">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <Input v-model="searchQuery" placeholder="Cari ujian..." icon="lucide:search" />
        </div>
        <select v-model="filterStatus" class="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
          <option value="all">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="active">Aktif</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>
    </div>

    <!-- Ujian List -->
    <div class="space-y-3">
      <div v-if="filteredUjian.length === 0" class="bg-white rounded-2xl card-shadow p-12 text-center">
        <Icon name="lucide:inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">Tidak ada ujian ditemukan</p>
      </div>

      <div 
        v-for="ujian in filteredUjian" 
        :key="ujian.id" 
        class="bg-white rounded-2xl card-shadow p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold text-gray-900 truncate">{{ ujian.judul }}</h3>
              <span :class="getStatusClass(ujian)">{{ getStatusLabel(ujian) }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span class="flex items-center gap-1">
                <Icon name="lucide:book-open" class="w-3.5 h-3.5" />
                {{ ujian.mapel || '-' }}
              </span>
              <span class="flex items-center gap-1">
                <Icon name="lucide:user" class="w-3.5 h-3.5" />
                {{ ujian.guru || '-' }}
              </span>
              <span class="flex items-center gap-1">
                <Icon name="lucide:users" class="w-3.5 h-3.5" />
                {{ ujian.kelas?.join(', ') || '-' }}
              </span>
              <span class="flex items-center gap-1">
                <Icon name="lucide:calendar" class="w-3.5 h-3.5" />
                {{ formatDate(ujian.startUjian) }} - {{ formatDate(ujian.endUjian) }}
              </span>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm">
            <div class="text-center px-3">
              <p class="font-bold text-gray-900">{{ ujian.soalCount }}</p>
              <p class="text-xs text-gray-500">Soal</p>
            </div>
            <div class="text-center px-3 border-l border-gray-200">
              <p class="font-bold text-gray-900">{{ ujian.submissionCount }}/{{ ujian.targetSiswa }}</p>
              <p class="text-xs text-gray-500">Mengerjakan</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <Button 
              v-if="isUjianEnded(ujian)"
              size="sm" 
              variant="outline"
              icon="lucide:refresh-cw"
              @click="openSusulanModal(ujian)"
            >
              <span class="hidden sm:inline">Susulan</span>
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Susulan Modal -->
    <Modal
      v-model="showSusulanModal"
      :title="`Ujian Susulan - ${selectedUjian?.judul || ''}`"
      description="Berikan akses ujian susulan untuk siswa yang belum mengerjakan"
      size="lg"
    >
      <div class="space-y-4">
        <!-- Duration -->
        <div class="space-y-2">
          <Label>Durasi Susulan (menit) *</Label>
          <Input v-model.number="susulanDurasi" type="number" placeholder="60" icon="lucide:clock" />
          <p class="text-xs text-gray-400">Waktu yang diberikan untuk mengerjakan ujian susulan</p>
        </div>

        <!-- Siswa List -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label>Pilih Siswa</Label>
            <button 
              @click="selectAllBelumUjian" 
              class="text-xs text-orange-500 hover:text-orange-600 font-medium"
            >
              Pilih Semua Belum Ujian
            </button>
          </div>
          
          <div class="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
            <div v-if="susulanSiswaList.length === 0" class="p-4 text-center text-sm text-gray-500">
              Memuat data siswa...
            </div>
            <div 
              v-for="s in susulanSiswaList" 
              :key="s.id"
              :class="[
                'flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0',
                s.submittedAt ? 'opacity-50' : ''
              ]"
            >
              <input
                type="checkbox"
                :checked="selectedSiswaIds.includes(s.id)"
                :disabled="!!s.submittedAt"
                @change="toggleSiswa(s.id)"
                class="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ s.nama }}</p>
                <p class="text-xs text-gray-500">{{ s.nis }} · {{ s.kelas }}</p>
              </div>
              <div class="text-right">
                <span v-if="s.submittedAt" class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Sudah Ujian</span>
                <span v-else-if="s.hasSusulan" class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Susulan Aktif</span>
                <span v-else class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Belum Ujian</span>
              </div>
            </div>
          </div>
          <p v-if="selectedSiswaIds.length > 0" class="text-xs text-orange-600">
            {{ selectedSiswaIds.length }} siswa dipilih
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="showSusulanModal = false">Batal</Button>
          <Button 
            :loading="isGrantingSusulan" 
            :disabled="selectedSiswaIds.length === 0"
            @click="grantSusulan"
          >
            <Icon name="lucide:send" class="w-4 h-4 mr-1" />
            Berikan Akses Susulan
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Manajemen Ujian',
})

const searchQuery = ref('')
const filterStatus = ref('all')
const ujianList = ref<any[]>([])
const showSusulanModal = ref(false)
const selectedUjian = ref<any>(null)
const susulanSiswaList = ref<any[]>([])
const selectedSiswaIds = ref<string[]>([])
const susulanDurasi = ref(60)
const isGrantingSusulan = ref(false)

// Token state
const tokenData = ref<any>({ isActive: false, currentToken: null })
const tokenCountdown = ref(0)
const isGeneratingToken = ref(false)
const isDeactivatingToken = ref(false)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const formatCountdown = computed(() => {
  const mins = Math.floor(tokenCountdown.value / 60)
  const secs = tokenCountdown.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const startCountdown = (seconds: number) => {
  if (countdownInterval) clearInterval(countdownInterval)
  tokenCountdown.value = seconds

  if (seconds <= 0) {
    tokenData.value.isActive = false
    tokenData.value.currentToken = null
    return
  }

  countdownInterval = setInterval(() => {
    tokenCountdown.value--
    if (tokenCountdown.value <= 0) {
      if (countdownInterval) clearInterval(countdownInterval)
      tokenData.value.isActive = false
      tokenData.value.currentToken = null
    }
  }, 1000)
}

const fetchTokenStatus = async () => {
  try {
    const response = await fetchApi('/api/admin/ujian/token')
    const data = await response.json()
    console.log('[TOKEN] fetchTokenStatus response:', JSON.stringify(data))
    if (data.success && data.data) {
      const isActive = data.data.isActive === true
      const remaining = typeof data.data.remainingSeconds === 'string' 
        ? parseInt(data.data.remainingSeconds) 
        : (data.data.remainingSeconds || 0)
      console.log('[TOKEN] parsed:', { isActive, remaining, currentToken: data.data.currentToken })
      tokenData.value = {
        isActive,
        currentToken: data.data.currentToken || null,
      }
      if (isActive && remaining > 0) {
        startCountdown(remaining)
      }
    }
  } catch (err) {
    console.error('Error fetching token:', err)
  }
}

const generateToken = async () => {
  isGeneratingToken.value = true
  try {
    const response = await fetchApi('/api/admin/ujian/token/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: 5 }),
    })
    const data = await response.json()
    if (data.success && data.data) {
      tokenData.value = {
        isActive: true,
        currentToken: data.data.currentToken,
      }
      startCountdown(data.data.remainingSeconds)
      toast.success('Token berhasil diaktifkan (5 menit)')
    } else {
      toast.error(data.error || 'Gagal mengaktifkan token')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isGeneratingToken.value = false
  }
}

const deactivateToken = async () => {
  isDeactivatingToken.value = true
  try {
    const response = await fetchApi('/api/admin/ujian/token/deactivate', {
      method: 'POST',
    })
    const data = await response.json()
    if (data.success) {
      if (countdownInterval) clearInterval(countdownInterval)
      tokenData.value = { isActive: false, currentToken: null, tokenExpiresAt: null }
      tokenCountdown.value = 0
      toast.success('Token berhasil dinonaktifkan')
    } else {
      toast.error(data.error || 'Gagal menonaktifkan token')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isDeactivatingToken.value = false
  }
}

const copyToken = () => {
  if (tokenData.value.currentToken) {
    navigator.clipboard.writeText(tokenData.value.currentToken)
    toast.success('Token disalin ke clipboard')
  }
}

const stats = computed(() => {
  const now = new Date()
  const total = ujianList.value.length
  const aktif = ujianList.value.filter(u => u.status === 'active' || u.status === 'aktif').length
  const berlangsung = ujianList.value.filter(u => {
    const start = new Date(u.startUjian)
    const end = new Date(u.endUjian)
    return now >= start && now <= end && (u.status === 'active' || u.status === 'aktif')
  }).length
  const selesai = ujianList.value.filter(u => new Date(u.endUjian) < now).length
  return { total, aktif, berlangsung, selesai }
})

const filteredUjian = computed(() => {
  let list = ujianList.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(u => 
      u.judul?.toLowerCase().includes(q) || 
      u.mapel?.toLowerCase().includes(q) || 
      u.guru?.toLowerCase().includes(q)
    )
  }
  if (filterStatus.value !== 'all') {
    const now = new Date()
    if (filterStatus.value === 'selesai') {
      list = list.filter(u => new Date(u.endUjian) < now)
    } else if (filterStatus.value === 'active') {
      list = list.filter(u => u.status === 'active' || u.status === 'aktif')
    } else {
      list = list.filter(u => u.status === filterStatus.value)
    }
  }
  return list
})

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const isUjianEnded = (ujian: any) => {
  return new Date(ujian.endUjian) < new Date()
}

const getStatusLabel = (ujian: any) => {
  const now = new Date()
  const start = new Date(ujian.startUjian)
  const end = new Date(ujian.endUjian)
  if (ujian.status === 'draft') return 'Draft'
  if (now < start) return 'Belum Mulai'
  if (now >= start && now <= end) return 'Berlangsung'
  if (now > end) return 'Selesai'
  return ujian.status
}

const getStatusClass = (ujian: any) => {
  const now = new Date()
  const start = new Date(ujian.startUjian)
  const end = new Date(ujian.endUjian)
  const base = 'text-xs px-2 py-0.5 rounded-full font-medium'
  if (ujian.status === 'draft') return `${base} bg-gray-100 text-gray-600`
  if (now < start) return `${base} bg-blue-100 text-blue-700`
  if (now >= start && now <= end) return `${base} bg-green-100 text-green-700`
  return `${base} bg-gray-100 text-gray-600`
}

const openSusulanModal = async (ujian: any) => {
  selectedUjian.value = ujian
  selectedSiswaIds.value = []
  susulanDurasi.value = 60
  showSusulanModal.value = true
  
  try {
    const response = await fetchApi(`/api/admin/ujian/${ujian.id}/siswa`)
    const data = await response.json()
    if (data.success) {
      susulanSiswaList.value = data.data.siswa || []
    }
  } catch (err) {
    console.error('Error fetching siswa:', err)
  }
}

const toggleSiswa = (siswaId: string) => {
  const idx = selectedSiswaIds.value.indexOf(siswaId)
  if (idx === -1) {
    selectedSiswaIds.value.push(siswaId)
  } else {
    selectedSiswaIds.value.splice(idx, 1)
  }
}

const selectAllBelumUjian = () => {
  selectedSiswaIds.value = susulanSiswaList.value
    .filter(s => !s.submittedAt)
    .map(s => s.id)
}

const grantSusulan = async () => {
  if (!selectedUjian.value || selectedSiswaIds.value.length === 0) return
  
  isGrantingSusulan.value = true
  try {
    const response = await fetchApi(`/api/admin/ujian/${selectedUjian.value.id}/susulan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siswaIds: selectedSiswaIds.value,
        durasiMenit: susulanDurasi.value,
      }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success(data.message || 'Ujian susulan berhasil diberikan')
      showSusulanModal.value = false
      await fetchUjian()
    } else {
      toast.error(data.error || 'Gagal memberikan ujian susulan')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isGrantingSusulan.value = false
  }
}

const fetchUjian = async () => {
  try {
    const response = await fetchApi('/api/admin/ujian')
    const data = await response.json()
    if (data.success) {
      ujianList.value = data.data || []
    }
  } catch (err) {
    console.error('Error fetching ujian:', err)
  }
}

onMounted(() => {
  fetchUjian()
  fetchTokenStatus()
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>
