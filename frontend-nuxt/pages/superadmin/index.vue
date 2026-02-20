<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 card-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Icon name="lucide:school" class="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ stats?.schools?.total ?? '-' }}</p>
        <p class="text-xs text-gray-400 mt-1">Total Sekolah</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs text-green-600">{{ stats?.schools?.active ?? 0 }} aktif</span>
          <span class="text-xs text-gray-300">·</span>
          <span class="text-xs text-red-500">{{ stats?.schools?.inactive ?? 0 }} nonaktif</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 card-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Icon name="lucide:users" class="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ stats?.users?.total ?? '-' }}</p>
        <p class="text-xs text-gray-400 mt-1">Total Users</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs text-blue-600">{{ stats?.users?.guru ?? 0 }} guru</span>
          <span class="text-xs text-gray-300">·</span>
          <span class="text-xs text-purple-600">{{ stats?.users?.siswa ?? 0 }} siswa</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 card-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Icon name="lucide:file-text" class="w-5 h-5 text-amber-600" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ stats?.content?.ujian ?? '-' }}</p>
        <p class="text-xs text-gray-400 mt-1">Total Ujian</p>
      </div>

      <div class="bg-white rounded-2xl p-5 card-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
            <Icon name="lucide:crown" class="w-5 h-5 text-pink-600" />
          </div>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ tierCount }}</p>
        <p class="text-xs text-gray-400 mt-1">Paket Tier</p>
        <div v-if="stats?.tierBreakdown" class="flex flex-wrap gap-1 mt-2">
          <span v-for="(count, label) in stats.tierBreakdown" :key="label" class="text-xs text-gray-500">
            {{ label }}: {{ count }}
          </span>
        </div>
      </div>
    </div>

    <!-- Recent Schools -->
    <div class="bg-white rounded-2xl card-shadow overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">Sekolah Terbaru</h3>
        <NuxtLink to="/superadmin/schools" class="text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
          Lihat Semua →
        </NuxtLink>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-indigo-600" />
      </div>

      <table v-else-if="stats?.recentSchools?.length" class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Sekolah</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Kota</th>
            <th class="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Guru</th>
            <th class="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Siswa</th>
            <th class="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="school in stats.recentSchools" :key="school.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-3">
              <NuxtLink :to="`/superadmin/schools/${school.id}`" class="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                {{ school.nama }}
              </NuxtLink>
              <p class="text-xs text-gray-400">{{ school.jenjang || '-' }}</p>
            </td>
            <td class="px-6 py-3 text-sm text-gray-500">{{ school.kota || '-' }}</td>
            <td class="px-6 py-3 text-sm text-gray-500 text-center">{{ school._count?.guru ?? 0 }}</td>
            <td class="px-6 py-3 text-sm text-gray-500 text-center">{{ school._count?.siswa ?? 0 }}</td>
            <td class="px-6 py-3 text-center">
              <span :class="[
                'px-2 py-1 text-xs rounded-full font-medium',
                school.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
              ]">
                {{ school.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="py-12 text-center">
        <p class="text-gray-400">Belum ada sekolah terdaftar</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'superadmin' })
useHead({ title: 'Super Admin Dashboard' })

const { data: stats, isLoading } = useSuperAdminStats()

const tierCount = computed(() => {
  if (!stats.value?.tierBreakdown) return 0
  return Object.keys(stats.value.tierBreakdown).length
})
</script>
