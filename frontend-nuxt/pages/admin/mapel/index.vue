<template>
  <div>
    <!-- Data Table -->
    <DataTable
      title="Mata Pelajaran"
      subtitle="Kelola mata pelajaran"
      :columns="columns"
      :data="mapelList"
      searchable
      search-placeholder="Cari mata pelajaran..."
      :search-keys="['nama', 'kode']"
    >
      <template #header>
        <Button icon="lucide:plus" @click="openAddModal">
          Tambah Mapel
        </Button>
      </template>

      <template #cell-kode="{ row }">
        <Badge>{{ row.kode }}</Badge>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon="lucide:pencil"
            @click="editMapel(row)"
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
      :title="editingId ? 'Edit Mapel' : 'Tambah Mapel'"
      :description="editingId ? 'Ubah data mata pelajaran' : 'Tambahkan mata pelajaran baru'"
      size="sm"
    >
      <form @submit.prevent="saveMapel" class="space-y-4">
        <div class="space-y-2">
          <Label>Kode</Label>
          <Input v-model="form.kode" placeholder="Contoh: MTK" icon="lucide:hash" />
        </div>
        <div class="space-y-2">
          <Label>Nama</Label>
          <Input v-model="form.nama" placeholder="Contoh: Matematika" icon="lucide:book-open" />
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="showAddModal = false">
            Batal
          </Button>
          <Button :loading="isSaving" @click="saveMapel">
            {{ editingId ? 'Update' : 'Simpan' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Hapus Mata Pelajaran"
      :message="`Apakah Anda yakin ingin menghapus mata pelajaran '${deletingItem?.nama}'?`"
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
  title: 'Mata Pelajaran',
})

const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const showAddModal = ref(false)
const showDeleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingItem = ref<any>(null)

const mapelList = ref<any[]>([])

const form = ref({
  kode: '',
  nama: '',
})

const columns = [
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  { key: 'actions', label: '', align: 'right' as const },
]

const resetForm = () => {
  form.value = { kode: '', nama: '' }
  editingId.value = null
}

const editMapel = (mapel: any) => {
  editingId.value = mapel.id
  form.value = { kode: mapel.kode, nama: mapel.nama }
  showAddModal.value = true
}

const saveMapel = async () => {
  isSaving.value = true
  try {
    const url = editingId.value 
      ? `/api/admin/mapel/${editingId.value}`
      : '/api/admin/mapel'
    
    const response = await fetchApi(url, {
      method: editingId.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success(editingId.value ? 'Mapel berhasil diupdate' : 'Mapel berhasil ditambahkan')
      showAddModal.value = false
      resetForm()
      await fetchMapel()
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

const confirmDelete = (mapel: any) => {
  deletingItem.value = mapel
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingItem.value) return
  
  isDeleting.value = true
  try {
    const response = await fetchApi(`/api/admin/mapel/${deletingItem.value.id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success('Mapel berhasil dihapus')
      showDeleteDialog.value = false
      deletingItem.value = null
      await fetchMapel()
    } else {
      toast.error(data.error || 'Gagal menghapus')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isDeleting.value = false
  }
}

const fetchMapel = async () => {
  const response = await fetchApi('/api/admin/mapel')
  const data = await response.json()
  if (data.success) {
    mapelList.value = data.data || []
  }
}

onMounted(async () => {
  try {
    await fetchMapel()
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
