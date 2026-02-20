<template>
  <div class="space-y-6">
    <!-- Actions -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Paket Langganan</h2>
      <button @click="openCreateModal" class="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
        <Icon name="lucide:plus" class="w-4 h-4" />
        Tambah Paket
      </button>
    </div>

    <!-- Tier Cards -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-indigo-600" />
    </div>

    <div v-else-if="tiers?.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="tier in tiers" :key="tier.id" class="bg-white rounded-2xl card-shadow overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-gray-900">{{ tier.label }}</h3>
              <p class="text-xs text-gray-400">{{ tier.nama }}</p>
            </div>
            <span :class="[
              'px-2 py-1 text-xs rounded-full font-medium',
              tier.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            ]">
              {{ tier.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>

          <p class="text-2xl font-bold text-indigo-600 mb-4">
            {{ tier.harga > 0 ? `Rp ${tier.harga.toLocaleString('id-ID')}` : 'Gratis' }}
            <span v-if="tier.harga > 0" class="text-xs text-gray-500 font-normal">/bulan</span>
          </p>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-gray-500">
              <span>Max Siswa</span>
              <span class="text-gray-900 font-medium">{{ tier.maxSiswa }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Max Guru</span>
              <span class="text-gray-900 font-medium">{{ tier.maxGuru }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Max Kelas</span>
              <span class="text-gray-900 font-medium">{{ tier.maxKelas }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Max Mapel</span>
              <span class="text-gray-900 font-medium">{{ tier.maxMapel }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Max Ujian/bln</span>
              <span class="text-gray-900 font-medium">{{ tier.maxUjian }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>Storage</span>
              <span class="text-gray-900 font-medium">{{ tier.maxStorage }} MB</span>
            </div>
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span class="text-xs text-gray-500">{{ tier._count?.schools ?? 0 }} sekolah</span>
            <div class="flex gap-1">
              <button @click="openEditModal(tier)" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors">
                <Icon name="lucide:pencil" class="w-4 h-4" />
              </button>
              <button @click="confirmDelete(tier)" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
                <Icon name="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-2xl card-shadow py-16 text-center">
      <Icon name="lucide:crown" class="w-12 h-12 mx-auto text-gray-300 mb-3" />
      <p class="text-gray-500">Belum ada paket langganan</p>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showModal = false">
      <div class="bg-white rounded-2xl p-6 w-full max-w-lg card-shadow max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold text-gray-900 mb-5">{{ editingTier ? 'Edit Paket' : 'Tambah Paket' }}</h3>

        <form @submit.prevent="handleSave" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Nama (slug) *</label>
              <input v-model="tierForm.nama" required placeholder="starter" class="sa-input" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Label (display) *</label>
              <input v-model="tierForm.label" required placeholder="Starter" class="sa-input" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Harga (IDR/bulan)</label>
              <input v-model.number="tierForm.harga" type="number" min="0" class="sa-input" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Urutan</label>
              <input v-model.number="tierForm.urutan" type="number" min="0" class="sa-input" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Max Siswa</label>
              <input v-model.number="tierForm.maxSiswa" type="number" min="1" class="sa-input" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Max Guru</label>
              <input v-model.number="tierForm.maxGuru" type="number" min="1" class="sa-input" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Max Kelas</label>
              <input v-model.number="tierForm.maxKelas" type="number" min="1" class="sa-input" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Max Mapel</label>
              <input v-model.number="tierForm.maxMapel" type="number" min="1" class="sa-input" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Max Ujian/bln</label>
              <input v-model.number="tierForm.maxUjian" type="number" min="1" class="sa-input" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-gray-400">Storage (MB)</label>
              <input v-model.number="tierForm.maxStorage" type="number" min="1" class="sa-input" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="tierForm.isActive" id="tierActive" class="rounded border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500" />
            <label for="tierActive" class="text-sm text-gray-700">Aktif</label>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              {{ editingTier ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="deleteTarget = null">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md card-shadow">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Hapus Paket</h3>
        <p class="text-gray-500 text-sm mb-6">
          Yakin ingin menghapus paket <strong class="text-gray-900">{{ deleteTarget.label }}</strong>?
          <span v-if="deleteTarget._count?.schools > 0" class="text-red-500 block mt-1">
            ⚠ {{ deleteTarget._count.schools }} sekolah masih menggunakan paket ini.
          </span>
        </p>
        <div class="flex justify-end gap-3">
          <button @click="deleteTarget = null" class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors">
            Batal
          </button>
          <button
            @click="handleDelete"
            :disabled="deleteMutation.isPending.value"
            class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
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
useHead({ title: 'Paket Langganan - Super Admin' })

const { data: tiers, isLoading } = useSuperAdminTiers()
const createMutation = useCreateTier()
const updateMutation = useUpdateTier()
const deleteMutation = useDeleteTier()

const showModal = ref(false)
const editingTier = ref<any>(null)
const deleteTarget = ref<any>(null)
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const defaultForm = () => ({
  nama: '', label: '', harga: 0, urutan: 0,
  maxSiswa: 50, maxGuru: 5, maxKelas: 5, maxMapel: 10, maxUjian: 10, maxStorage: 500,
  isActive: true,
})

const tierForm = ref(defaultForm())

const openCreateModal = () => {
  editingTier.value = null
  tierForm.value = defaultForm()
  showModal.value = true
}

const openEditModal = (tier: any) => {
  editingTier.value = tier
  tierForm.value = {
    nama: tier.nama, label: tier.label, harga: tier.harga || 0, urutan: tier.urutan || 0,
    maxSiswa: tier.maxSiswa, maxGuru: tier.maxGuru, maxKelas: tier.maxKelas,
    maxMapel: tier.maxMapel, maxUjian: tier.maxUjian, maxStorage: tier.maxStorage,
    isActive: tier.isActive,
  }
  showModal.value = true
}

const handleSave = async () => {
  if (!tierForm.value.nama || !tierForm.value.label) {
    toast.error('Nama dan label wajib diisi')
    return
  }
  try {
    let result
    if (editingTier.value) {
      result = await updateMutation.mutateAsync({ id: editingTier.value.id, ...tierForm.value })
    } else {
      result = await createMutation.mutateAsync(tierForm.value)
    }
    if (result.success) {
      toast.success(editingTier.value ? 'Paket berhasil diperbarui' : 'Paket berhasil ditambahkan')
      showModal.value = false
    } else {
      toast.error(result.error || 'Gagal menyimpan')
    }
  } catch {
    toast.error('Terjadi kesalahan')
  }
}

const confirmDelete = (tier: any) => {
  deleteTarget.value = tier
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  try {
    const result = await deleteMutation.mutateAsync(deleteTarget.value.id)
    if (result.success) {
      toast.success('Paket berhasil dihapus')
      deleteTarget.value = null
    } else {
      toast.error(result.error || 'Gagal menghapus')
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
