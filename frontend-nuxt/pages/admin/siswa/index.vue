<template>
  <div>
    <!-- Data Table -->
    <DataTable
      title="Manajemen Siswa"
      subtitle="Kelola data siswa"
      :columns="columns"
      :data="siswaList"
      searchable
      search-placeholder="Cari siswa..."
      :search-keys="['nama', 'nisn']"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <Select
            v-model="filterKelas"
            :options="kelasOptions"
            placeholder="Semua Kelas"
            class="w-48"
          />
          <Button icon="lucide:plus" @click="openAddModal">
            Tambah Siswa
          </Button>
        </div>
      </template>

      <template #cell-kelas="{ row }">
        <span class="text-gray-600">{{ row.kelas?.nama || row.kelas || '-' }}</span>
      </template>

      <template #cell-jenisKelamin="{ row }">
        <Badge :variant="row.jenisKelamin === 'L' ? 'info' : 'success'">
          {{ row.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan' }}
        </Badge>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon="lucide:pencil"
            @click="editSiswa(row)"
          />
          <Button
            variant="ghost"
            size="sm"
            icon="lucide:trash-2"
            class="text-red-600 hover:text-red-700 hover:bg-red-50"
            @click="confirmDelete(row)"
          />
        </div>
      </template>
    </DataTable>

    <!-- Add/Edit Modal -->
    <Modal
      v-model="showAddModal"
      :title="editingId ? 'Edit Siswa' : 'Tambah Siswa'"
      :description="editingId ? 'Ubah data siswa yang sudah ada' : 'Tambahkan siswa baru ke sistem'"
      size="md"
    >
      <form @submit.prevent="saveSiswa" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>NIS</Label>
            <Input v-model="form.nis" placeholder="Nomor Induk Siswa" icon="lucide:id-card" />
          </div>
          <div class="space-y-2">
            <Label>NISN</Label>
            <Input v-model="form.nisn" placeholder="Nomor Induk Siswa Nasional" icon="lucide:hash" />
          </div>
        </div>
        <div class="space-y-2">
          <Label>Nama Lengkap</Label>
          <Input v-model="form.nama" placeholder="Masukkan nama lengkap" icon="lucide:user" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Kelas</Label>
            <Select v-model="form.kelasId" :options="kelasSelectOptions" placeholder="Pilih Kelas" />
          </div>
          <div class="space-y-2">
            <Label>Jenis Kelamin</Label>
            <Select v-model="form.jenisKelamin" :options="genderOptions" />
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="showAddModal = false">
            Batal
          </Button>
          <Button :loading="isSaving" @click="saveSiswa">
            {{ editingId ? 'Update' : 'Simpan' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Hapus Siswa"
      :message="`Apakah Anda yakin ingin menghapus siswa '${deletingItem?.nama}'? Tindakan ini tidak dapat dibatalkan.`"
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
  title: 'Manajemen Siswa',
})

const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const showAddModal = ref(false)
const showDeleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingItem = ref<any>(null)
const filterKelas = ref('')

const siswaList = ref<any[]>([])
const kelasList = ref<any[]>([])

const form = ref({
  nis: '',
  nisn: '',
  nama: '',
  kelasId: '',
  jenisKelamin: 'L',
})

const columns = [
  { key: 'nis', label: 'NIS' },
  { key: 'nisn', label: 'NISN' },
  { key: 'nama', label: 'Nama' },
  { key: 'kelas', label: 'Kelas' },
  { key: 'jenisKelamin', label: 'Jenis Kelamin' },
  { key: 'actions', label: '', align: 'right' as const },
]

const kelasOptions = computed(() => [
  { label: 'Semua Kelas', value: '' },
  ...kelasList.value.map(k => ({ label: k.nama, value: k.id }))
])

const kelasSelectOptions = computed(() => 
  kelasList.value.map(k => ({ label: k.nama, value: k.id }))
)

const genderOptions = [
  { label: 'Laki-laki', value: 'L' },
  { label: 'Perempuan', value: 'P' },
]


const resetForm = () => {
  form.value = {
    nis: '',
    nisn: '',
    nama: '',
    kelasId: '',
    jenisKelamin: 'L',
  }
  editingId.value = null
}

const editSiswa = (siswa: any) => {
  editingId.value = siswa.id
  form.value = {
    nis: siswa.nis || '',
    nisn: siswa.nisn || '',
    nama: siswa.nama || '',
    kelasId: siswa.kelasId || '',
    jenisKelamin: siswa.jenisKelamin || 'L',
  }
  showAddModal.value = true
}

const saveSiswa = async () => {
  isSaving.value = true
  try {
    const url = editingId.value 
      ? `/api/admin/siswa/${editingId.value}`
      : '/api/admin/siswa'
    
    const response = await fetchApi(url, {
      method: editingId.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success(editingId.value ? 'Siswa berhasil diupdate' : 'Siswa berhasil ditambahkan')
      showAddModal.value = false
      resetForm()
      await fetchSiswa()
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

const confirmDelete = (siswa: any) => {
  deletingItem.value = siswa
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingItem.value) return
  
  isDeleting.value = true
  try {
    const response = await fetchApi(`/api/admin/siswa/${deletingItem.value.id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success('Siswa berhasil dihapus')
      showDeleteDialog.value = false
      deletingItem.value = null
      await fetchSiswa()
    } else {
      toast.error(data.error || 'Gagal menghapus')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isDeleting.value = false
  }
}

const fetchSiswa = async () => {
  const response = await fetchApi('/api/admin/siswa')
  const data = await response.json()
  if (data.success) {
    siswaList.value = data.data || []
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
    await Promise.all([fetchSiswa(), fetchKelas()])
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
