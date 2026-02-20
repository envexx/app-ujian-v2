<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Manajemen Ujian</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola semua ujian Anda</p>
      </div>
      <Button @click="navigateTo('/guru/ujian/create')" icon="lucide:plus">
        Buat Ujian Baru
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 card-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon name="lucide:file-text" class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ ujianList.length }}</p>
            <p class="text-xs text-gray-500">Total Ujian</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 card-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon name="lucide:file-edit" class="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ ujianList.filter(u => u.status === 'draft').length }}</p>
            <p class="text-xs text-gray-500">Draft</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 card-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Icon name="lucide:play-circle" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ ujianList.filter(u => u.status === 'active').length }}</p>
            <p class="text-xs text-gray-500">Aktif</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 card-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon name="lucide:check-circle" class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ ujianList.filter(u => u.status === 'completed').length }}</p>
            <p class="text-xs text-gray-500">Selesai</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="bg-white rounded-xl p-4 card-shadow mb-6">
      <div class="flex gap-3">
        <div class="flex-1 relative">
          <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            placeholder="Cari ujian berdasarkan judul..."
            class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
        <select
          v-model="filterStatus"
          class="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 min-w-[140px]"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="active">Aktif</option>
          <option value="completed">Selesai</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>

    <!-- Ujian Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="ujian in filteredUjian"
        :key="ujian.id"
        class="bg-white rounded-xl card-shadow hover:shadow-lg transition-all duration-200 overflow-hidden group"
      >
        <!-- Card Header with Status -->
        <div class="px-5 py-4 border-b border-gray-100">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                {{ ujian.judul }}
              </h3>
              <p class="text-sm text-gray-500 mt-0.5">{{ ujian.mapel?.nama || ujian.mapel || '-' }}</p>
            </div>
            <span :class="getStatusClass(ujian.status)">
              {{ getStatusLabel(ujian.status) }}
            </span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="px-5 py-4 space-y-3">
          <!-- Time Info -->
          <div class="flex items-center gap-2 text-sm">
            <Icon name="lucide:calendar" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ formatDate(ujian.startUjian) }}</span>
          </div>
          
          <!-- Stats Row -->
          <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-1.5">
              <Icon name="lucide:clock" class="w-4 h-4 text-gray-400" />
              <span class="text-gray-600">{{ formatDuration(ujian.startUjian, ujian.endUjian) }} menit</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Icon name="lucide:list-checks" class="w-4 h-4 text-gray-400" />
              <span class="text-gray-600">{{ ujian.totalSoal || ujian._count?.soal || 0 }} soal</span>
            </div>
          </div>

          <!-- Participants -->
          <div class="flex items-center gap-2 text-sm">
            <Icon name="lucide:users" class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{{ ujian.totalSubmissions || ujian._count?.submissions || 0 }} peserta mengerjakan</span>
          </div>

          <!-- Kelas Tags -->
          <div class="flex flex-wrap gap-1.5">
            <span 
              v-for="kelas in getKelasList(ujian.kelas)" 
              :key="kelas"
              class="px-2 py-0.5 text-xs rounded-md bg-orange-50 text-orange-600"
            >
              {{ kelas }}
            </span>
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div class="flex gap-1">
            <button 
              @click="navigateTo(`/guru/ujian/${ujian.id}`)"
              class="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
              title="Lihat Detail"
            >
              <Icon name="lucide:eye" class="w-4 h-4" />
            </button>
            <button 
              @click="navigateTo(`/guru/ujian/${ujian.id}/edit`)"
              class="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
              title="Edit"
            >
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>
            <button 
              @click="confirmDelete(ujian)"
              class="p-2 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
              title="Hapus"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
          
          <!-- Publish Button -->
          <button
            v-if="ujian.status === 'draft'"
            @click="publishUjian(ujian)"
            :disabled="isPublishing === ujian.id"
            class="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Icon v-if="isPublishing === ujian.id" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <Icon v-else name="lucide:send" class="w-3.5 h-3.5" />
            Publish
          </button>
          <button
            v-else-if="ujian.status === 'active'"
            @click="unpublishUjian(ujian)"
            :disabled="isPublishing === ujian.id"
            class="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Icon v-if="isPublishing === ujian.id" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <Icon v-else name="lucide:pause" class="w-3.5 h-3.5" />
            Unpublish
          </button>
          <span v-else class="px-3 py-1.5 text-sm text-gray-400">
            Selesai
          </span>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredUjian.length === 0" class="col-span-full bg-white rounded-xl p-12 card-shadow text-center">
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Icon name="lucide:file-text" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-1">Belum ada ujian</h3>
        <p class="text-gray-500 mb-4">Mulai buat ujian pertama Anda</p>
        <Button @click="navigateTo('/guru/ujian/create')" icon="lucide:plus">
          Buat Ujian Baru
        </Button>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Hapus Ujian"
      :message="`Apakah Anda yakin ingin menghapus ujian '${deletingItem?.judul}'? Tindakan ini tidak dapat dibatalkan.`"
      type="danger"
      confirm-text="Ya, Hapus"
      :loading="isDeleting"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

definePageMeta({
  layout: 'guru',
})

useHead({
  title: 'Manajemen Ujian',
})

const isLoading = ref(true)
const isDeleting = ref(false)
const isPublishing = ref<string | null>(null)
const showDeleteDialog = ref(false)
const deletingItem = ref<any>(null)
const searchQuery = ref('')
const filterStatus = ref('')
const ujianList = ref<any[]>([])

const filteredUjian = computed(() => {
  let result = ujianList.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(u => u.judul.toLowerCase().includes(query))
  }
  
  if (filterStatus.value) {
    result = result.filter(u => u.status === filterStatus.value)
  }
  
  return result
})

const formatDuration = (start: string, end: string) => {
  if (!start || !end) return 0
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: idLocale })
}

const getKelasList = (kelas: any): string[] => {
  if (!kelas) return []
  if (Array.isArray(kelas)) return kelas.slice(0, 3)
  if (typeof kelas === 'string') return [kelas]
  return []
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600',
    active: 'px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600',
    completed: 'px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600',
  }
  return classes[status] || classes.draft
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    active: 'Aktif',
    completed: 'Selesai',
  }
  return labels[status] || status
}

const confirmDelete = (ujian: any) => {
  deletingItem.value = ujian
  showDeleteDialog.value = true
}

const publishUjian = async (ujian: any) => {
  isPublishing.value = ujian.id
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujian.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success('Ujian berhasil dipublish')
      await fetchUjian()
    } else {
      toast.error(data.error || 'Gagal mempublish ujian')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isPublishing.value = null
  }
}

const unpublishUjian = async (ujian: any) => {
  isPublishing.value = ujian.id
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujian.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success('Ujian berhasil di-unpublish')
      await fetchUjian()
    } else {
      toast.error(data.error || 'Gagal mengubah status ujian')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isPublishing.value = null
  }
}

const handleDelete = async () => {
  if (!deletingItem.value) return
  
  isDeleting.value = true
  try {
    const response = await fetchApi(`/api/guru/ujian/${deletingItem.value.id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success('Ujian berhasil dihapus')
      showDeleteDialog.value = false
      deletingItem.value = null
      await fetchUjian()
    } else {
      toast.error(data.error || 'Gagal menghapus')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isDeleting.value = false
  }
}

const fetchUjian = async () => {
  const response = await fetchApi('/api/guru/ujian')
  const data = await response.json()
  if (data.success) {
    // Backend returns { ujian: [...], kelasList: [...], mapelList: [...] }
    ujianList.value = data.data?.ujian || data.data || []
  }
}

onMounted(async () => {
  try {
    await fetchUjian()
  } catch (err) {
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
