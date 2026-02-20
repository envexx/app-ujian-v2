<template>
  <div>
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>
    
    <div v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Icon name="lucide:file-text" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Ujian</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalUjian || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Icon name="lucide:check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Ujian Selesai</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.ujianSelesai || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Icon name="lucide:database" class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Bank Soal</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalSoal || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Icon name="lucide:users" class="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Siswa Mengerjakan</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.siswaMengerjakan || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div class="space-y-3">
            <Button @click="navigateTo('/guru/ujian/create')" class="w-full justify-start" icon="lucide:plus">
              Buat Ujian Baru
            </Button>
            <Button @click="navigateTo('/guru/bank-soal')" variant="outline" class="w-full justify-start" icon="lucide:database">
              Kelola Bank Soal
            </Button>
            <Button @click="navigateTo('/guru/nilai')" variant="outline" class="w-full justify-start" icon="lucide:bar-chart-3">
              Lihat Nilai Siswa
            </Button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
          
          <div v-if="activities.length === 0" class="text-center py-8">
            <Icon name="lucide:clock" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p class="text-gray-500">Belum ada aktivitas</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="activity in activities.slice(0, 5)"
              :key="activity.id"
              class="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div class="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Icon name="lucide:activity" class="w-4 h-4 text-orange-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 truncate">{{ activity.message }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ formatDate(activity.createdAt) }}</p>
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

definePageMeta({
  layout: 'guru',
})

useHead({
  title: 'Dashboard Guru',
})

const isLoading = ref(true)
const stats = ref<any>({})
const activities = ref<any[]>([])

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: idLocale })
}

onMounted(async () => {
  try {
    const [statsRes, activityRes] = await Promise.all([
      fetchApi('/api/guru/dashboard/stats'),
      fetchApi('/api/guru/dashboard/aktivitas'),
    ])
    
    const statsData = await statsRes.json()
    const activityData = await activityRes.json()
    
    if (statsData.success) {
      stats.value = statsData.data || {}
    }
    if (activityData.success) {
      activities.value = activityData.data || []
    }
  } catch (err) {
    console.error('Error fetching dashboard:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
