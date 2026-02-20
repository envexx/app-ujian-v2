<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3 mb-2">
      <button @click="navigateTo('/superadmin/schools')" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
        <Icon name="lucide:arrow-left" class="w-5 h-5" />
      </button>
      <div class="flex-1">
        <h2 class="text-xl font-bold text-gray-900">{{ school?.nama || 'Detail Sekolah' }}</h2>
        <p class="text-sm text-gray-500">{{ school?.npsn || '' }}</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="toggleEdit"
          class="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          :class="isEditing ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-indigo-600 hover:bg-indigo-500 text-white'"
        >
          {{ isEditing ? 'Batal' : 'Edit' }}
        </button>
        <button
          v-if="isEditing"
          @click="handleSave"
          :disabled="updateMutation.isPending.value"
          class="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Icon v-if="updateMutation.isPending.value" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          Simpan
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-indigo-600" />
    </div>

    <template v-else-if="school">
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div v-for="stat in schoolStats" :key="stat.label" class="bg-white rounded-xl p-4 card-shadow text-center">
          <p class="text-xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Info -->
      <div class="bg-white rounded-2xl card-shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-5">Informasi Sekolah</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500">Nama Sekolah</label>
            <input v-if="isEditing" v-model="editForm.nama" class="sa-input" />
            <p v-else class="text-sm text-gray-900">{{ school.nama || '-' }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500">NPSN</label>
            <p class="text-sm text-gray-900">{{ school.npsn || '-' }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500">Jenjang</label>
            <p class="text-sm text-gray-900">{{ school.jenjang || '-' }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500">Email</label>
            <p class="text-sm text-gray-900">{{ school.email || '-' }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500">Kota</label>
            <p class="text-sm text-gray-900">{{ school.kota || '-' }}</p>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-500">Provinsi</label>
            <p class="text-sm text-gray-900">{{ school.provinsi || '-' }}</p>
          </div>
          <div class="md:col-span-2 space-y-1.5">
            <label class="text-xs font-medium text-gray-500">Alamat</label>
            <p class="text-sm text-gray-900">{{ school.alamat || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- Tier & Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl card-shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Paket Langganan</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Tier</span>
              <span class="text-sm text-gray-900 font-medium">{{ school.tierLabel || 'Tidak ada' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Expired</span>
              <span class="text-sm text-gray-900">{{ school.expiredAt ? formatDate(school.expiredAt) : 'Tidak ada' }}</span>
            </div>
            <div v-if="isEditing" class="pt-3 border-t border-gray-100 space-y-3">
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-gray-500">Ubah Tier</label>
                <select v-model="editForm.tierId" class="sa-input">
                  <option value="">Tanpa Tier</option>
                  <option v-for="tier in tiers" :key="tier.id" :value="tier.id">{{ tier.label }}</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-gray-500">Expired At</label>
                <input v-model="editForm.expiredAt" type="date" class="sa-input" />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl card-shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Status & Admin</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Status</span>
              <span :class="[
                'px-2 py-1 text-xs rounded-full font-medium',
                school.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
              ]">
                {{ school.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">Dibuat</span>
              <span class="text-sm text-gray-900">{{ formatDate(school.createdAt) }}</span>
            </div>
          </div>

          <div v-if="school.admins?.length" class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-xs font-medium text-gray-500 mb-2">Admin Users</p>
            <div v-for="admin in school.admins" :key="admin.id" class="flex items-center gap-3 py-2">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Icon name="lucide:user" class="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p class="text-sm text-gray-900">{{ admin.nama }}</p>
                <p class="text-xs text-gray-500">{{ admin.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'superadmin' })
useHead({ title: 'Detail Sekolah - Super Admin' })

const route = useRoute()
const schoolId = route.params.id as string

const { data: school, isLoading } = useSuperAdminSchoolDetail(schoolId)
const { data: tiers } = useSuperAdminTiers()
const updateMutation = useUpdateSchool()

const isEditing = ref(false)
const editForm = ref({ nama: '', tierId: '', expiredAt: '', isActive: true })

const schoolStats = computed(() => {
  if (!school.value?._count) return []
  const c = school.value._count
  return [
    { label: 'Users', value: c.users ?? 0 },
    { label: 'Guru', value: c.guru ?? 0 },
    { label: 'Siswa', value: c.siswa ?? 0 },
    { label: 'Kelas', value: c.kelas ?? 0 },
    { label: 'Mapel', value: c.mapel ?? 0 },
    { label: 'Ujian', value: c.ujian ?? 0 },
  ]
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
}

const toggleEdit = () => {
  if (!isEditing.value && school.value) {
    editForm.value = {
      nama: school.value.nama || '',
      tierId: school.value.tierId || '',
      expiredAt: school.value.expiredAt ? school.value.expiredAt.split('T')[0] : '',
      isActive: school.value.isActive,
    }
  }
  isEditing.value = !isEditing.value
}

const handleSave = async () => {
  try {
    const result = await updateMutation.mutateAsync({
      id: schoolId,
      nama: editForm.value.nama,
      tierId: editForm.value.tierId || null,
      expiredAt: editForm.value.expiredAt || null,
      isActive: editForm.value.isActive,
    })
    if (result.success) {
      toast.success('Sekolah berhasil diperbarui')
      isEditing.value = false
    } else {
      toast.error(result.error || 'Gagal memperbarui')
    }
  } catch {
    toast.error('Terjadi kesalahan')
  }
}
</script>

<style scoped>
.sa-input {
  @apply w-full h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all;
}
</style>
