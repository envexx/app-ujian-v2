<template>
  <div class="space-y-6">
    <!-- Actions -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative">
          <Icon name="lucide:search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="search"
            placeholder="Cari sekolah..."
            class="h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-64"
          />
        </div>
        <select
          v-model="filterStatus"
          class="h-10 px-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>
      <NuxtLink to="/superadmin/schools/create">
        <button class="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
          <Icon name="lucide:plus" class="w-4 h-4" />
          Tambah Sekolah
        </button>
      </NuxtLink>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl card-shadow overflow-hidden">
      <div v-if="isLoading" class="flex items-center justify-center py-16">
        <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-indigo-600" />
      </div>

      <table v-else-if="filteredSchools.length > 0" class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Sekolah</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Kota</th>
            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Jenjang</th>
            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Tier</th>
            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Guru</th>
            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Siswa</th>
            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Ujian</th>
            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Status</th>
            <th class="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="school in filteredSchools" :key="school.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <NuxtLink :to="`/superadmin/schools/${school.id}`" class="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                {{ school.nama }}
              </NuxtLink>
              <p class="text-xs text-gray-400">{{ school.npsn || '-' }}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ school.kota || '-' }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ school.jenjang || '-' }}</td>
            <td class="px-6 py-4 text-center">
              <span class="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                {{ school.tierLabel || 'No Tier' }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">{{ school._count?.guru ?? 0 }}</td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">{{ school._count?.siswa ?? 0 }}</td>
            <td class="px-6 py-4 text-sm text-gray-500 text-center">{{ school._count?.ujian ?? 0 }}</td>
            <td class="px-6 py-4 text-center">
              <span :class="[
                'px-2 py-1 text-xs rounded-full font-medium',
                school.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
              ]">
                {{ school.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <div class="flex items-center justify-center gap-1">
                <NuxtLink :to="`/superadmin/schools/${school.id}`">
                  <button class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors">
                    <Icon name="lucide:eye" class="w-4 h-4" />
                  </button>
                </NuxtLink>
                <button
                  @click="toggleActive(school)"
                  class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"
                  :title="school.isActive ? 'Nonaktifkan' : 'Aktifkan'"
                >
                  <Icon :name="school.isActive ? 'lucide:pause' : 'lucide:play'" class="w-4 h-4" />
                </button>
                <button
                  @click="confirmDelete(school)"
                  class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="py-16 text-center">
        <Icon name="lucide:school" class="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p class="text-gray-500">{{ search ? 'Tidak ditemukan' : 'Belum ada sekolah' }}</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="deleteTarget = null">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md card-shadow">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Hapus Sekolah</h3>
        <p class="text-gray-500 text-sm mb-6">
          Yakin ingin menghapus <strong class="text-gray-900">{{ deleteTarget.nama }}</strong>? Semua data terkait (guru, siswa, ujian) akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex justify-end gap-3">
          <button @click="deleteTarget = null" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors">
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="deleteMutation.isPending.value"
            class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Icon v-if="deleteMutation.isPending.value" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'superadmin' })
useHead({ title: 'Manajemen Sekolah - Super Admin' })

const search = ref('')
const filterStatus = ref('')
const deleteTarget = ref<any>(null)

const { data: schools, isLoading } = useSuperAdminSchools()
const updateMutation = useUpdateSchool()
const deleteMutation = useDeleteSchool()

const filteredSchools = computed(() => {
  let list = schools.value || []
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((s: any) => s.nama?.toLowerCase().includes(q) || s.kota?.toLowerCase().includes(q) || s.npsn?.includes(q))
  }
  if (filterStatus.value === 'active') list = list.filter((s: any) => s.isActive)
  if (filterStatus.value === 'inactive') list = list.filter((s: any) => !s.isActive)
  return list
})

const toggleActive = async (school: any) => {
  try {
    const result = await updateMutation.mutateAsync({ id: school.id, isActive: !school.isActive })
    if (result.success) {
      toast.success(`Sekolah ${school.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
    } else {
      toast.error(result.error || 'Gagal mengubah status')
    }
  } catch {
    toast.error('Terjadi kesalahan')
  }
}

const confirmDelete = (school: any) => {
  deleteTarget.value = school
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  try {
    const result = await deleteMutation.mutateAsync(deleteTarget.value.id)
    if (result.success) {
      toast.success('Sekolah berhasil dihapus')
      deleteTarget.value = null
    } else {
      toast.error(result.error || 'Gagal menghapus')
    }
  } catch {
    toast.error('Terjadi kesalahan')
  }
}
</script>
