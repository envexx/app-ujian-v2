<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Manajemen Kelas</h1>
        <p class="text-sm text-gray-500">Kelola data kelas</p>
      </div>
      <Button icon="lucide:plus" @click="openAddModal" class="w-full sm:w-auto">
        Tambah Kelas
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="kelas in kelasList"
        :key="kelas.id"
        class="bg-white rounded-2xl p-6 card-shadow hover:card-shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Icon name="lucide:school" class="w-6 h-6 text-purple-600" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{{ kelas.nama }}</h3>
            <div class="flex flex-wrap items-center gap-2 mt-1">
              <span v-if="kelas.tingkat" class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{{ getTingkatanLabel(kelas.tingkat) }}</span>
              <span class="badge-blue">{{ kelas.jumlahSiswa || kelas._count?.siswa || 0 }} siswa</span>
            </div>
          </div>
          <div class="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon="lucide:pencil"
              @click="editKelas(kelas)"
            />
            <Button
              variant="ghost"
              size="sm"
              icon="lucide:trash-2"
              class="text-red-600 hover:text-red-700 hover:bg-red-50"
              @click="confirmDelete(kelas)"
            />
          </div>
        </div>
      </div>
      
      <div v-if="kelasList.length === 0" class="col-span-full text-center py-12 text-gray-500">
        <Icon name="lucide:school" class="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p>Belum ada kelas</p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Modal
      v-model="showAddModal"
      :title="editingId ? 'Edit Kelas' : 'Tambah Kelas'"
      :description="editingId ? 'Ubah data kelas' : 'Tambahkan kelas baru'"
      size="sm"
    >
      <form @submit.prevent="saveKelas" class="space-y-4">
        <div class="space-y-2">
          <Label>Tingkatan *</Label>
          <select 
            v-model="form.tingkat" 
            class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="" disabled>Pilih tingkatan</option>
            <optgroup label="SD">
              <option value="1">Kelas 1 SD</option>
              <option value="2">Kelas 2 SD</option>
              <option value="3">Kelas 3 SD</option>
              <option value="4">Kelas 4 SD</option>
              <option value="5">Kelas 5 SD</option>
              <option value="6">Kelas 6 SD</option>
            </optgroup>
            <optgroup label="SMP">
              <option value="7">Kelas 7 SMP</option>
              <option value="8">Kelas 8 SMP</option>
              <option value="9">Kelas 9 SMP</option>
            </optgroup>
            <optgroup label="SMA/SMK">
              <option value="10">Kelas 10 SMA/SMK</option>
              <option value="11">Kelas 11 SMA/SMK</option>
              <option value="12">Kelas 12 SMA/SMK</option>
            </optgroup>
          </select>
        </div>
        <div class="space-y-2">
          <Label>Nama Kelas *</Label>
          <Input v-model="form.nama" placeholder="Contoh: X IPA 1" icon="lucide:school" />
        </div>
        <div class="space-y-2">
          <Label>Tahun Ajaran</Label>
          <Input v-model="form.tahunAjaran" placeholder="Contoh: 2025/2026" icon="lucide:calendar" />
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="showAddModal = false">
            Batal
          </Button>
          <Button :loading="isSaving" @click="saveKelas">
            {{ editingId ? 'Update' : 'Simpan' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Hapus Kelas"
      :message="`Apakah Anda yakin ingin menghapus kelas '${deletingItem?.nama}'? Semua siswa di kelas ini akan kehilangan kelasnya.`"
      type="danger"
      confirm-text="Ya, Hapus"
      :loading="isDeleting"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Manajemen Kelas',
})

const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const showAddModal = ref(false)
const showDeleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingItem = ref<any>(null)

const kelasList = ref<any[]>([])

const form = ref({
  nama: '',
  tingkat: '',
  tahunAjaran: '',
})

const tingkatanMap: Record<string, string> = {
  '1': 'Kelas 1 SD', '2': 'Kelas 2 SD', '3': 'Kelas 3 SD',
  '4': 'Kelas 4 SD', '5': 'Kelas 5 SD', '6': 'Kelas 6 SD',
  '7': 'Kelas 7 SMP', '8': 'Kelas 8 SMP', '9': 'Kelas 9 SMP',
  '10': 'Kelas 10 SMA/SMK', '11': 'Kelas 11 SMA/SMK', '12': 'Kelas 12 SMA/SMK',
}

const getTingkatanLabel = (tingkat: string | number) => {
  return tingkatanMap[String(tingkat)] || `Kelas ${tingkat}`
}

const resetForm = () => {
  form.value = { nama: '', tingkat: '', tahunAjaran: '' }
  editingId.value = null
}

const editKelas = (kelas: any) => {
  editingId.value = kelas.id
  form.value = {
    nama: kelas.nama || '',
    tingkat: kelas.tingkat ? String(kelas.tingkat) : '',
    tahunAjaran: kelas.tahunAjaran || '',
  }
  showAddModal.value = true
}

const saveKelas = async () => {
  isSaving.value = true
  try {
    const url = editingId.value 
      ? `/api/admin/kelas/${editingId.value}`
      : '/api/admin/kelas'
    
    const response = await fetchApi(url, {
      method: editingId.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success(editingId.value ? 'Kelas berhasil diupdate' : 'Kelas berhasil ditambahkan')
      showAddModal.value = false
      resetForm()
      await fetchKelas()
    } else {
      toast.error(data.error || 'Gagal menyimpan')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isSaving.value = false
  }
}

const openAddModal = () => {
  resetForm()
  showAddModal.value = true
}

const confirmDelete = (kelas: any) => {
  deletingItem.value = kelas
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingItem.value) return
  
  isDeleting.value = true
  try {
    const response = await fetchApi(`/api/admin/kelas/${deletingItem.value.id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success('Kelas berhasil dihapus')
      showDeleteDialog.value = false
      deletingItem.value = null
      await fetchKelas()
    } else {
      toast.error(data.error || 'Gagal menghapus')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isDeleting.value = false
  }
}

const fetchKelas = async () => {
  const response = await fetchApi('/api/admin/kelas')
  const data = await response.json()
  if (data.success) {
    kelasList.value = data.data || []
  }
}

onMounted(async () => {
  try {
    await fetchKelas()
  } catch (err) {
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
})

watch(showAddModal, (val) => {
  if (!val) resetForm()
})
</script>
