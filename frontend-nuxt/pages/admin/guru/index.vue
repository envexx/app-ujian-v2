<template>
  <div>
    <!-- Data Table -->
    <DataTable
      title="Manajemen Guru"
      subtitle="Kelola data guru"
      :columns="columns"
      :data="guruList"
      searchable
      search-placeholder="Cari guru..."
      :search-keys="['nama', 'nip', 'email']"
    >
      <template #header>
        <Button icon="lucide:plus" @click="openAddModal">
          Tambah Guru
        </Button>
      </template>

      <template #cell-nip="{ row }">
        <span class="text-gray-900 font-medium">{{ row.nip || row.nipUsername || '-' }}</span>
      </template>

      <template #cell-mapel="{ row }">
        <div class="flex flex-wrap gap-1">
          <template v-if="getMapelList(row).length > 0">
            <span 
              v-for="(mapel, idx) in getMapelList(row)" 
              :key="idx"
              class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
            >
              {{ mapel }}
            </span>
          </template>
          <span v-else class="text-gray-400">-</span>
        </div>
      </template>

      <template #cell-kelas="{ row }">
        <div class="flex flex-wrap gap-1">
          <template v-if="getKelasList(row).length > 0">
            <span 
              v-for="(kelas, idx) in getKelasList(row)" 
              :key="idx"
              class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700"
            >
              {{ kelas }}
            </span>
          </template>
          <span v-else class="text-gray-400">-</span>
        </div>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon="lucide:pencil"
            @click="editGuru(row)"
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
      :title="editingId ? 'Edit Guru' : 'Tambah Guru'"
      :description="editingId ? 'Ubah data guru yang sudah ada' : 'Tambahkan guru baru ke sistem'"
      size="lg"
    >
      <form @submit.prevent="saveGuru" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>NIP / Username *</Label>
            <Input v-model="form.nip" placeholder="Masukkan NIP atau username" icon="lucide:hash" />
          </div>
          <div class="space-y-2">
            <Label>Email *</Label>
            <Input v-model="form.email" type="email" placeholder="Masukkan email" icon="lucide:mail" />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label>Nama Lengkap *</Label>
          <Input v-model="form.nama" placeholder="Masukkan nama lengkap" icon="lucide:user" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Jenis Kelamin *</Label>
            <select 
              v-model="form.jenisKelamin" 
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Status *</Label>
            <select 
              v-model="form.isActive" 
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option :value="true">Aktif</option>
              <option :value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <Label>Alamat</Label>
          <Input v-model="form.alamat" placeholder="Masukkan alamat" icon="lucide:map-pin" />
        </div>

        <!-- Mata Pelajaran Selection -->
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-3">
            <Label>Mata Pelajaran yang Diajar *</Label>
            <div class="border border-gray-200 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
              <div v-if="mapelList.length === 0" class="text-sm text-gray-500">
                Tidak ada mata pelajaran
              </div>
              <div 
                v-for="mapel in mapelList" 
                :key="mapel.id" 
                class="flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  :id="`mapel-${mapel.id}`"
                  :checked="form.mapelIds.includes(mapel.id)"
                  @change="toggleMapel(mapel.id)"
                  class="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label :for="`mapel-${mapel.id}`" class="text-sm cursor-pointer flex items-center gap-2">
                  <Icon name="lucide:book-open" class="w-4 h-4 text-gray-400" />
                  {{ mapel.nama }}
                  <span v-if="mapel.kode" class="text-xs text-gray-400">({{ mapel.kode }})</span>
                </label>
              </div>
            </div>
            <p v-if="form.mapelIds.length > 0" class="text-xs text-orange-600">
              {{ form.mapelIds.length }} mata pelajaran dipilih
            </p>
          </div>

          <!-- Kelas Selection -->
          <div class="space-y-3">
            <Label>Kelas yang Diajar *</Label>
            <div class="border border-gray-200 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
              <div v-if="kelasList.length === 0" class="text-sm text-gray-500">
                Tidak ada kelas
              </div>
              <div 
                v-for="kelas in kelasList" 
                :key="kelas.id" 
                class="flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  :id="`kelas-${kelas.id}`"
                  :checked="form.kelasIds.includes(kelas.id)"
                  @change="toggleKelas(kelas.id)"
                  class="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label :for="`kelas-${kelas.id}`" class="text-sm cursor-pointer flex items-center gap-2">
                  <Icon name="lucide:users" class="w-4 h-4 text-gray-400" />
                  {{ kelas.nama }}
                  <span v-if="kelas.tingkat" class="text-xs text-gray-400">(Tingkat {{ kelas.tingkat }})</span>
                </label>
              </div>
            </div>
            <p v-if="form.kelasIds.length > 0" class="text-xs text-orange-600">
              {{ form.kelasIds.length }} kelas dipilih
            </p>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="showAddModal = false">
            Batal
          </Button>
          <Button :loading="isSaving" @click="saveGuru">
            {{ editingId ? 'Update' : 'Simpan' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Hapus Guru"
      :message="`Apakah Anda yakin ingin menghapus guru '${deletingItem?.nama}'? Tindakan ini tidak dapat dibatalkan.`"
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
  title: 'Manajemen Guru',
})

const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const showAddModal = ref(false)
const showDeleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingItem = ref<any>(null)

const guruList = ref<any[]>([])
const mapelList = ref<any[]>([])
const kelasList = ref<any[]>([])

const form = ref({
  nip: '',
  nama: '',
  email: '',
  alamat: '',
  jenisKelamin: 'L',
  isActive: true,
  mapelIds: [] as string[],
  kelasIds: [] as string[],
})

const columns = [
  { key: 'nip', label: 'NIP' },
  { key: 'nama', label: 'Nama' },
  { key: 'email', label: 'Email' },
  { key: 'mapel', label: 'Mata Pelajaran' },
  { key: 'kelas', label: 'Kelas' },
  { key: 'actions', label: '', align: 'right' as const },
]

const getMapelList = (guru: any) => {
  if (!guru.mapel || !Array.isArray(guru.mapel)) return []
  return guru.mapel.map((m: any) => {
    if (typeof m === 'string') return m
    return m.nama || ''
  }).filter(Boolean)
}

const getKelasList = (guru: any) => {
  if (!guru.kelas || !Array.isArray(guru.kelas)) return []
  return guru.kelas.map((k: any) => {
    if (typeof k === 'string') return k
    return k.nama || ''
  }).filter(Boolean)
}

const toggleMapel = (mapelId: string) => {
  const idx = form.value.mapelIds.indexOf(mapelId)
  if (idx === -1) {
    form.value.mapelIds.push(mapelId)
  } else {
    form.value.mapelIds.splice(idx, 1)
  }
}

const toggleKelas = (kelasId: string) => {
  const idx = form.value.kelasIds.indexOf(kelasId)
  if (idx === -1) {
    form.value.kelasIds.push(kelasId)
  } else {
    form.value.kelasIds.splice(idx, 1)
  }
}

const resetForm = () => {
  form.value = {
    nip: '',
    nama: '',
    email: '',
    alamat: '',
    jenisKelamin: 'L',
    isActive: true,
    mapelIds: [],
    kelasIds: [],
  }
  editingId.value = null
}

const editGuru = (guru: any) => {
  editingId.value = guru.id
  form.value = {
    nip: guru.nip || guru.nipUsername || '',
    nama: guru.nama || '',
    email: guru.email || '',
    alamat: guru.alamat || '',
    jenisKelamin: guru.jenisKelamin || 'L',
    isActive: guru.isActive !== undefined ? guru.isActive : true,
    mapelIds: guru.mapel?.map((m: any) => m.mapelId || m.id) || [],
    kelasIds: guru.kelas?.map((k: any) => k.kelasId || k.id) || [],
  }
  showAddModal.value = true
}

const saveGuru = async () => {
  isSaving.value = true
  try {
    const url = editingId.value 
      ? `/api/admin/guru/${editingId.value}`
      : '/api/admin/guru'
    
    const body = {
      nip: form.value.nip,
      nipUsername: form.value.nip,
      nama: form.value.nama,
      email: form.value.email,
      alamat: form.value.alamat,
      jenisKelamin: form.value.jenisKelamin,
      isActive: form.value.isActive,
      mapelIds: form.value.mapelIds,
      kelasIds: form.value.kelasIds,
    }
    
    const response = await fetchApi(url, {
      method: editingId.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success(editingId.value ? 'Guru berhasil diupdate' : 'Guru berhasil ditambahkan')
      showAddModal.value = false
      resetForm()
      await fetchGuru()
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

const confirmDelete = (guru: any) => {
  deletingItem.value = guru
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingItem.value) return
  
  isDeleting.value = true
  try {
    const response = await fetchApi(`/api/admin/guru/${deletingItem.value.id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success('Guru berhasil dihapus')
      showDeleteDialog.value = false
      deletingItem.value = null
      await fetchGuru()
    } else {
      toast.error(data.error || 'Gagal menghapus')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isDeleting.value = false
  }
}

const fetchGuru = async () => {
  const response = await fetchApi('/api/admin/guru')
  const data = await response.json()
  if (data.success) {
    guruList.value = data.data || []
  }
}

const fetchMapel = async () => {
  const response = await fetchApi('/api/admin/mapel')
  const data = await response.json()
  if (data.success) {
    mapelList.value = data.data || []
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
    await Promise.all([fetchGuru(), fetchMapel(), fetchKelas()])
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
