<template>
  <div>
    <!-- Search & Filter Card -->
    <div class="bg-white rounded-2xl p-5 card-shadow mb-6">
      <div class="flex gap-4">
        <div class="flex-1">
          <Input
            v-model="searchQuery"
            placeholder="Cari soal..."
            icon="lucide:search"
            class="w-full"
          />
        </div>
        <select
          v-model="filterMapel"
          class="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="">Semua Mapel</option>
          <option v-for="mapel in mapelList" :key="mapel.id" :value="mapel.id">
            {{ mapel.nama }}
          </option>
        </select>
        <select
          v-model="filterTipe"
          class="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="">Semua Tipe</option>
          <option value="PILIHAN_GANDA">Pilihan Ganda</option>
          <option value="ESSAY">Essay</option>
          <option value="ISIAN_SINGKAT">Isian Singkat</option>
          <option value="BENAR_SALAH">Benar/Salah</option>
        </select>
        <Button @click="openAddModal" icon="lucide:plus">
          Tambah Soal
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>

    <!-- Soal List -->
    <div v-else class="space-y-4">
      <div
        v-for="soal in filteredSoal"
        :key="soal.id"
        class="bg-white rounded-2xl p-6 card-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span :class="getTipeClass(soal.tipe)">
                {{ getTipeLabel(soal.tipe) }}
              </span>
              <span class="text-sm text-gray-500">{{ soal.mapel?.nama || soal.mapel || '-' }}</span>
            </div>
            <p class="text-gray-900 mb-2" v-html="truncateText(soal.pertanyaan, 200)"></p>
            <p class="text-sm text-gray-500">Bobot: {{ soal.poin || soal.bobot || 10 }} poin</p>
          </div>
          <div class="flex gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              icon="lucide:pencil"
              @click="editSoal(soal)"
            />
            <Button
              variant="ghost"
              size="sm"
              icon="lucide:trash-2"
              class="text-red-600 hover:text-red-700 hover:bg-red-50"
              @click="confirmDelete(soal)"
            />
          </div>
        </div>
      </div>
      
      <div v-if="filteredSoal.length === 0" class="bg-white rounded-2xl p-12 card-shadow text-center">
        <Icon name="lucide:database" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p class="text-gray-500">Belum ada soal</p>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Modal
      v-model="showAddModal"
      :title="editingId ? 'Edit Soal' : 'Tambah Soal'"
      :description="editingId ? 'Ubah data soal' : 'Tambahkan soal baru ke bank soal'"
      size="lg"
    >
      <form @submit.prevent="saveSoal" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Mata Pelajaran</Label>
            <select v-model="form.mapelId" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" required>
              <option value="">Pilih Mapel</option>
              <option v-for="mapel in mapelList" :key="mapel.id" :value="mapel.id">
                {{ mapel.nama }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Tipe Soal</Label>
            <select v-model="form.tipe" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" required>
              <option value="PILIHAN_GANDA">Pilihan Ganda</option>
              <option value="ESSAY">Essay</option>
              <option value="ISIAN_SINGKAT">Isian Singkat</option>
              <option value="BENAR_SALAH">Benar/Salah</option>
            </select>
          </div>
        </div>
        
        <div class="space-y-2">
          <Label>Pertanyaan</Label>
          <TiptapEditor
            v-model="form.pertanyaan"
            placeholder="Masukkan pertanyaan..."
          />
        </div>
        
        <!-- Pilihan Ganda Options -->
        <div v-if="form.tipe === 'PILIHAN_GANDA'" class="space-y-2">
          <Label>Pilihan Jawaban</Label>
          <div v-for="opsi in form.data.opsi" :key="opsi.label" class="flex gap-3 items-start">
            <div class="flex items-center gap-2 pt-2">
              <input
                type="radio"
                name="jawaban"
                :value="opsi.label"
                v-model="form.data.kunciJawaban"
                class="w-4 h-4 text-orange-500 focus:ring-orange-500"
              />
              <span class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-medium text-sm">
                {{ opsi.label }}
              </span>
            </div>
            <div class="flex-1">
              <TiptapEditor
                v-model="opsi.text"
                :placeholder="`Pilihan ${opsi.label}`"
                mini
              />
            </div>
          </div>
          <p class="text-xs text-gray-500">Pilih radio button untuk menandai jawaban yang benar</p>
        </div>

        <!-- Essay -->
        <div v-if="form.tipe === 'ESSAY'" class="space-y-2">
          <Label>Kunci Jawaban (Referensi)</Label>
          <TiptapEditor
            v-model="form.data.kunciJawaban"
            placeholder="Kunci jawaban untuk referensi penilaian..."
            mini
          />
        </div>

        <!-- Isian Singkat -->
        <div v-if="form.tipe === 'ISIAN_SINGKAT'" class="space-y-2">
          <Label>Kunci Jawaban</Label>
          <Input
            v-model="form.data.kunciJawaban"
            placeholder="Jawaban yang benar"
          />
        </div>

        <!-- Benar/Salah -->
        <div v-if="form.tipe === 'BENAR_SALAH'" class="space-y-2">
          <Label>Jawaban yang Benar</Label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="benar-salah"
                :value="true"
                v-model="form.data.kunciJawaban"
                class="w-4 h-4 text-orange-500 focus:ring-orange-500"
              />
              <span class="text-sm">Benar</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="benar-salah"
                :value="false"
                v-model="form.data.kunciJawaban"
                class="w-4 h-4 text-orange-500 focus:ring-orange-500"
              />
              <span class="text-sm">Salah</span>
            </label>
          </div>
        </div>
        
        <div class="space-y-2">
          <Label>Poin</Label>
          <Input v-model.number="form.poin" type="number" min="1" icon="lucide:star" />
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="showAddModal = false">
            Batal
          </Button>
          <Button :loading="isSaving" @click="saveSoal">
            {{ editingId ? 'Update' : 'Simpan' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Hapus Soal"
      message="Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan."
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
  layout: 'guru',
})

useHead({
  title: 'Bank Soal',
})

const isLoading = ref(true)
const isSaving = ref(false)
const isDeleting = ref(false)
const showAddModal = ref(false)
const showDeleteDialog = ref(false)
const editingId = ref<string | null>(null)
const deletingItem = ref<any>(null)
const searchQuery = ref('')
const filterMapel = ref('')
const filterTipe = ref('')

const soalList = ref<any[]>([])
const mapelList = ref<any[]>([])

const form = ref({
  mapelId: '',
  tipe: 'PILIHAN_GANDA',
  pertanyaan: '',
  data: {
    opsi: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ],
    kunciJawaban: 'A',
  },
  poin: 10,
})

const filteredSoal = computed(() => {
  let result = soalList.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => s.pertanyaan.toLowerCase().includes(query))
  }
  
  if (filterMapel.value) {
    result = result.filter(s => s.mapelId === filterMapel.value)
  }
  
  if (filterTipe.value) {
    result = result.filter(s => s.tipe === filterTipe.value)
  }
  
  return result
})

const truncateText = (text: string, length: number) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const getTipeClass = (tipe: string) => {
  const classes: Record<string, string> = {
    PILIHAN_GANDA: 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600',
    ESSAY: 'px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600',
    ISIAN_SINGKAT: 'px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-600',
    BENAR_SALAH: 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-600',
  }
  return classes[tipe] || 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600'
}

const getTipeLabel = (tipe: string) => {
  const labels: Record<string, string> = {
    PILIHAN_GANDA: 'Pilihan Ganda',
    ESSAY: 'Essay',
    ISIAN_SINGKAT: 'Isian Singkat',
    BENAR_SALAH: 'Benar/Salah',
  }
  return labels[tipe] || tipe
}

const resetForm = () => {
  form.value = {
    mapelId: '',
    tipe: 'PILIHAN_GANDA',
    pertanyaan: '',
    data: {
      opsi: [
        { label: 'A', text: '' },
        { label: 'B', text: '' },
        { label: 'C', text: '' },
        { label: 'D', text: '' },
      ],
      kunciJawaban: 'A',
    },
    poin: 10,
  }
  editingId.value = null
}

const editSoal = (soal: any) => {
  editingId.value = soal.id
  form.value = {
    mapelId: soal.mapelId || '',
    tipe: soal.tipe || 'PILIHAN_GANDA',
    pertanyaan: soal.pertanyaan || '',
    data: soal.data || {
      opsi: [
        { label: 'A', text: '' },
        { label: 'B', text: '' },
        { label: 'C', text: '' },
        { label: 'D', text: '' },
      ],
      kunciJawaban: 'A',
    },
    poin: soal.poin || 10,
  }
  showAddModal.value = true
}

const saveSoal = async () => {
  isSaving.value = true
  try {
    const url = editingId.value 
      ? `/api/guru/bank-soal/${editingId.value}`
      : '/api/guru/bank-soal'
    
    const response = await fetchApi(url, {
      method: editingId.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success(editingId.value ? 'Soal berhasil diupdate' : 'Soal berhasil ditambahkan')
      showAddModal.value = false
      resetForm()
      await fetchSoal()
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

const confirmDelete = (soal: any) => {
  deletingItem.value = soal
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingItem.value) return
  
  isDeleting.value = true
  try {
    const response = await fetchApi(`/api/guru/bank-soal/${deletingItem.value.id}`, {
      method: 'DELETE',
    })
    
    const data = await response.json()
    
    if (data.success) {
      toast.success('Soal berhasil dihapus')
      showDeleteDialog.value = false
      deletingItem.value = null
      await fetchSoal()
    } else {
      toast.error(data.error || 'Gagal menghapus')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isDeleting.value = false
  }
}

const fetchSoal = async () => {
  const response = await fetchApi('/api/guru/bank-soal')
  const data = await response.json()
  if (data.success) {
    soalList.value = data.data || []
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
    await Promise.all([fetchSoal(), fetchMapel()])
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
