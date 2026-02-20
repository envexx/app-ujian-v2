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
              <Icon name="lucide:users" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Siswa</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalSiswa || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Icon name="lucide:graduation-cap" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Guru</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalGuru || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Icon name="lucide:school" class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Kelas</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalKelas || 0 }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-6 card-shadow">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Icon name="lucide:file-text" class="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Total Ujian</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalUjian || 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-2xl card-shadow">
        <div class="px-6 py-5 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h3>
        </div>
        <div class="p-6">
          <div v-if="activities.length === 0" class="text-center py-8">
            <Icon name="lucide:clock" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p class="text-gray-500">Belum ada aktivitas</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="activity in activities"
              :key="activity.id"
              class="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Icon :name="getActivityIcon(activity.type)" class="w-5 h-5 text-orange-600" />
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-900">{{ activity.message }}</p>
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
  layout: 'admin',
})

useHead({
  title: 'Dashboard Admin',
})

const isLoading = ref(true)
const stats = ref<any>({})
const activities = ref<any[]>([])

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale: idLocale })
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'siswa': return 'lucide:user-plus'
    case 'guru': return 'lucide:graduation-cap'
    case 'ujian': return 'lucide:file-text'
    default: return 'lucide:activity'
  }
}

onMounted(async () => {
  try {
    // Try admin dashboard first, fallback to general dashboard
    let statsRes, activityRes
    try {
      [statsRes, activityRes] = await Promise.all([
        fetchApi('/api/admin/dashboard/stats'),
        fetchApi('/api/admin/dashboard/activity'),
      ])
    } catch {
      [statsRes, activityRes] = await Promise.all([
        fetchApi('/api/dashboard/stats'),
        fetchApi('/api/dashboard/activities'),
      ])
    }
    
    const statsData = await statsRes.json()
    const activityData = await activityRes.json()
    
    if (statsData.success) {
      // Handle both totalUjian and ujianAktif field names
      stats.value = {
        totalSiswa: statsData.data?.totalSiswa || 0,
        totalGuru: statsData.data?.totalGuru || 0,
        totalKelas: statsData.data?.totalKelas || 0,
        totalUjian: statsData.data?.totalUjian || statsData.data?.ujianAktif || 0,
      }
    }
    if (activityData.success) {
      // Backend returns { recentUjian: [...] } format
      const recentUjian = activityData.data?.recentUjian || []
      activities.value = recentUjian.map((u: any) => ({
        id: u.id,
        type: 'ujian',
        message: `Ujian "${u.judul}" oleh ${u.guru?.nama || 'Guru'} (${u.status || 'draft'})`,
        createdAt: u.createdAt,
      }))
    }
  } catch (err) {
    console.error('Error fetching dashboard:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
