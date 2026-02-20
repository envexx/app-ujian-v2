<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-3 mb-2">
      <button @click="navigateTo('/superadmin/schools')" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
        <Icon name="lucide:arrow-left" class="w-5 h-5" />
      </button>
      <h2 class="text-xl font-bold text-gray-900">Tambah Sekolah Baru</h2>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- School Info -->
      <div class="bg-white rounded-2xl card-shadow p-6 space-y-5">
        <h3 class="text-lg font-semibold text-gray-900">Informasi Sekolah</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Nama Sekolah *</label>
            <input v-model="form.nama" required placeholder="SMA Negeri 1 Jakarta" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">NPSN</label>
            <input v-model="form.npsn" placeholder="20100001" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Jenjang</label>
            <select v-model="form.jenjang" class="sa-input">
              <option value="">Pilih Jenjang</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Email Sekolah</label>
            <input v-model="form.email" type="email" placeholder="info@sekolah.sch.id" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Kota</label>
            <input v-model="form.kota" placeholder="Jakarta" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Provinsi</label>
            <input v-model="form.provinsi" placeholder="DKI Jakarta" class="sa-input" />
          </div>
          <div class="md:col-span-2 space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Alamat</label>
            <input v-model="form.alamat" placeholder="Jl. Pendidikan No. 1" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">No. Telepon</label>
            <input v-model="form.noTelp" placeholder="021-1234567" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Website</label>
            <input v-model="form.website" placeholder="https://sekolah.sch.id" class="sa-input" />
          </div>
        </div>
      </div>

      <!-- Tier -->
      <div class="bg-white rounded-2xl card-shadow p-6 space-y-5">
        <h3 class="text-lg font-semibold text-gray-900">Paket Langganan</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Tier</label>
            <select v-model="form.tierId" class="sa-input">
              <option value="">Tanpa Tier</option>
              <option v-for="tier in tiers" :key="tier.id" :value="tier.id">{{ tier.label }} ({{ tier.nama }})</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Expired At</label>
            <input v-model="form.expiredAt" type="date" class="sa-input" />
          </div>
        </div>
      </div>

      <!-- Admin Account -->
      <div class="bg-white rounded-2xl card-shadow p-6 space-y-5">
        <h3 class="text-lg font-semibold text-gray-900">Akun Admin Sekolah</h3>
        <p class="text-sm text-gray-500 -mt-3">Opsional. Buat akun admin untuk sekolah ini.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Nama Admin</label>
            <input v-model="form.adminNama" placeholder="Admin Sekolah" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Email Admin</label>
            <input v-model="form.adminEmail" type="email" placeholder="admin@sekolah.sch.id" class="sa-input" />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium text-gray-700">Password</label>
            <input v-model="form.adminPassword" type="text" placeholder="password123" class="sa-input" />
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <button type="button" @click="navigateTo('/superadmin/schools')" class="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors">
          Batal
        </button>
        <button
          type="submit"
          :disabled="createMutation.isPending.value"
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Icon v-if="createMutation.isPending.value" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          Simpan Sekolah
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'superadmin' })
useHead({ title: 'Tambah Sekolah - Super Admin' })

const { data: tiers } = useSuperAdminTiers()
const createMutation = useCreateSchool()

const form = ref({
  nama: '',
  npsn: '',
  jenjang: '',
  email: '',
  kota: '',
  provinsi: '',
  alamat: '',
  noTelp: '',
  website: '',
  tierId: '',
  expiredAt: '',
  adminNama: '',
  adminEmail: '',
  adminPassword: '',
})

const handleSubmit = async () => {
  if (!form.value.nama) {
    toast.error('Nama sekolah wajib diisi')
    return
  }
  try {
    const result = await createMutation.mutateAsync({
      ...form.value,
      tierId: form.value.tierId || null,
      expiredAt: form.value.expiredAt || null,
    })
    if (result.success) {
      toast.success('Sekolah berhasil ditambahkan')
      navigateTo('/superadmin/schools')
    } else {
      toast.error(result.error || 'Gagal menambahkan sekolah')
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
