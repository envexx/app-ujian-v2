<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon="lucide:arrow-left"
          @click="navigateTo('/guru/ujian')"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Edit Ujian</h1>
          <p class="text-sm text-gray-500">{{ examInfo.judul || 'Untitled Exam' }}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" :loading="isPrinting" @click="handlePrintSoal" icon="lucide:printer">
          Print Soal
        </Button>
        <Button variant="outline" :loading="isSaving" @click="handleSaveDraft">
          Simpan Draft
        </Button>
        <Button :loading="isSaving" @click="handlePublish">
          Publikasikan
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>

    <!-- Tabs -->
    <div v-else>
      <div class="flex border-b border-gray-200 mb-6">
        <button
          @click="activeTab = 'info'"
          :class="[
            'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'info' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Informasi Ujian
        </button>
        <button
          @click="activeTab = 'soal'"
          :class="[
            'px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'soal' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Soal ({{ soalList.length }} soal, {{ totalPoin }} poin)
        </button>
      </div>

      <!-- Tab: Informasi Ujian -->
      <div v-show="activeTab === 'info'" class="bg-white rounded-2xl card-shadow">
        <div class="px-6 py-5 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Informasi Ujian</h3>
          <p class="text-sm text-gray-500">Atur detail dan konfigurasi ujian</p>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Judul -->
          <div class="space-y-2">
            <Label>Judul Ujian *</Label>
            <Input 
              v-model="examInfo.judul" 
              placeholder="Contoh: Ulangan Harian Matematika Bab 3"
              icon="lucide:file-text"
            />
          </div>

          <!-- Deskripsi -->
          <div class="space-y-2">
            <Label>Deskripsi</Label>
            <TiptapEditor 
              v-model="examInfo.deskripsi" 
              placeholder="Deskripsi singkat tentang ujian..."
            />
          </div>

          <!-- Kelas Selection -->
          <div class="space-y-3">
            <Label>Kelas (Pilih satu atau lebih) *</Label>
            <div class="border border-gray-200 rounded-xl p-4">
              <div v-if="kelasList.length === 0" class="text-sm text-gray-500">
                Tidak ada kelas tersedia
              </div>
              <div v-else class="grid grid-cols-3 gap-3">
                <div 
                  v-for="kelas in kelasList" 
                  :key="kelas.id" 
                  class="flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    :id="`kelas-${kelas.id}`"
                    :checked="examInfo.kelas.includes(kelas.nama)"
                    @change="toggleKelas(kelas.nama)"
                    class="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <label :for="`kelas-${kelas.id}`" class="text-sm cursor-pointer">
                    {{ kelas.nama }}
                  </label>
                </div>
              </div>
            </div>
            <p v-if="examInfo.kelas.length > 0" class="text-xs text-orange-600">
              Dipilih: {{ examInfo.kelas.join(', ') }}
            </p>
          </div>

          <!-- Mata Pelajaran -->
          <div class="space-y-2">
            <Label>Mata Pelajaran *</Label>
            <select 
              v-model="examInfo.mapelId"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="">Pilih Mata Pelajaran</option>
              <option v-for="mapel in mapelList" :key="mapel.id" :value="mapel.id">
                {{ mapel.nama }}
              </option>
            </select>
          </div>

          <!-- Waktu Ujian -->
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <Label>Waktu Mulai Ujian *</Label>
              <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <span class="text-xs text-gray-500">Tanggal</span>
                  <Input v-model="startDate" type="date" />
                </div>
                <div class="space-y-1">
                  <span class="text-xs text-gray-500">Waktu</span>
                  <Input v-model="startTime" type="time" />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Waktu Akhir Ujian *</Label>
              <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <span class="text-xs text-gray-500">Tanggal</span>
                  <Input v-model="endDate" type="date" />
                </div>
                <div class="space-y-1">
                  <span class="text-xs text-gray-500">Waktu</span>
                  <Input v-model="endTime" type="time" />
                </div>
              </div>
            </div>
          </div>

          <!-- Pengaturan Ujian -->
          <div class="space-y-4 pt-4 border-t border-gray-100">
            <h3 class="font-semibold text-gray-900">Pengaturan Ujian</h3>
            
            <!-- Acak Soal -->
            <div class="flex items-center justify-between p-4 rounded-xl border border-gray-200">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Icon name="lucide:shuffle" class="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Acak Urutan Soal</p>
                  <p class="text-sm text-gray-500">Soal akan ditampilkan secara acak untuk setiap siswa</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="examInfo.shuffleQuestions" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <!-- Tampilkan Nilai -->
            <div class="flex items-center justify-between p-4 rounded-xl border border-gray-200">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Icon :name="examInfo.showScore ? 'lucide:eye' : 'lucide:eye-off'" class="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Tampilkan Nilai ke Siswa</p>
                  <p class="text-sm text-gray-500">Siswa dapat melihat nilai setelah menyelesaikan ujian</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="examInfo.showScore" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          <!-- Summary -->
          <div class="p-4 rounded-xl bg-gray-50">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Total Soal</span>
              <span class="text-lg font-bold text-gray-900">{{ soalList.length }}</span>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-sm text-gray-500">Total Poin</span>
              <span :class="['text-sm font-semibold', totalPoin === 100 ? 'text-green-600' : 'text-red-600']">
                {{ totalPoin }}/100
              </span>
            </div>
            <p v-if="totalPoin !== 100" class="text-xs text-red-500 mt-1">
              Total poin harus tepat 100 untuk bisa dipublikasikan
            </p>
          </div>
        </div>
      </div>

      <!-- Tab: Soal -->
      <div v-show="activeTab === 'soal'" class="bg-white rounded-2xl card-shadow">
        <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Daftar Soal</h3>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="collapseAll">
              <Icon name="lucide:minimize-2" class="w-4 h-4 mr-1" />
              Collapse All
            </Button>
            <Button variant="outline" size="sm" @click="expandAll">
              <Icon name="lucide:maximize-2" class="w-4 h-4 mr-1" />
              Expand All
            </Button>
            
            <!-- Add Soal Dropdown -->
            <div class="relative">
              <Button @click="showAddSoalMenu = !showAddSoalMenu" icon="lucide:plus">
                Tambah Soal
              </Button>
              <div 
                v-if="showAddSoalMenu" 
                class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
              >
                <button 
                  @click="addSoal('PILIHAN_GANDA')"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icon name="lucide:list" class="w-4 h-4 text-blue-500" />
                  Pilihan Ganda
                </button>
                <button 
                  @click="addSoal('ESSAY')"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icon name="lucide:file-text" class="w-4 h-4 text-green-500" />
                  Essay
                </button>
                <button 
                  @click="addSoal('ISIAN_SINGKAT')"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icon name="lucide:text-cursor-input" class="w-4 h-4 text-purple-500" />
                  Isian Singkat
                </button>
                <button 
                  @click="addSoal('BENAR_SALAH')"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icon name="lucide:check-circle" class="w-4 h-4 text-orange-500" />
                  Benar/Salah
                </button>
                <button 
                  @click="addSoal('PENCOCOKAN')"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                >
                  <Icon name="lucide:git-compare" class="w-4 h-4 text-pink-500" />
                  Pencocokan
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <!-- Empty State -->
          <div v-if="soalList.length === 0" class="text-center py-12">
            <Icon name="lucide:file-question" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500 mb-4">Belum ada soal</p>
            <Button @click="showAddSoalMenu = true" icon="lucide:plus">
              Tambah Soal Pertama
            </Button>
          </div>

          <!-- Soal List with Drag and Drop -->
          <draggable
            v-else
            v-model="soalList"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            @end="handleDragEnd"
            class="space-y-4"
          >
            <template #item="{ element: soal, index }">
              <div 
                :id="`soal-${soal.id}`"
                class="border border-gray-200 rounded-xl overflow-hidden bg-white"
              >
                <!-- Soal Header -->
                <div 
                  class="flex items-center justify-between px-4 py-3 bg-gray-50"
                >
                  <div class="flex items-center gap-3">
                    <!-- Drag Handle -->
                    <div class="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded">
                      <Icon name="lucide:grip-vertical" class="w-4 h-4 text-gray-400" />
                    </div>
                    <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-semibold text-sm">
                      {{ index + 1 }}
                    </div>
                    <span :class="getTipeBadgeClass(soal.tipe)">
                      {{ getTipeLabel(soal.tipe) }}
                    </span>
                    <span class="text-sm text-gray-500">{{ soal.poin }} poin</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="lucide:trash-2"
                      class="text-red-500 hover:text-red-600 hover:bg-red-50"
                      @click.stop="deleteSoal(soal.id)"
                    />
                    <button 
                      @click="toggleCollapse(soal.id)"
                      class="p-1 hover:bg-gray-200 rounded"
                    >
                      <Icon 
                        :name="collapsedSoal.has(soal.id) ? 'lucide:chevron-down' : 'lucide:chevron-up'" 
                        class="w-5 h-5 text-gray-400"
                      />
                    </button>
                  </div>
                </div>

              <!-- Soal Content -->
              <div v-show="!collapsedSoal.has(soal.id)" class="p-4 space-y-4">
                <!-- Pertanyaan -->
                <div class="space-y-2">
                  <Label>Pertanyaan</Label>
                  <TiptapEditor
                    :modelValue="soal.pertanyaan"
                    @update:modelValue="(val: string) => { soal.pertanyaan = val; updateSoal(soal.id, { pertanyaan: val }) }"
                    placeholder="Masukkan pertanyaan..."
                  />
                </div>

                <!-- Poin -->
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label>Poin</Label>
                    <Input 
                      v-model.number="soal.poin" 
                      type="number" 
                      min="1"
                      @input="updateSoal(soal.id, { poin: soal.poin })"
                      class="w-32"
                    />
                  </div>
                </div>

                <!-- Pilihan Ganda Options -->
                <div v-if="soal.tipe === 'PILIHAN_GANDA'" class="space-y-3">
                  <Label>Pilihan Jawaban</Label>
                  <div 
                    v-for="(opsi, opsiIdx) in (soal.data?.opsi || [])" 
                    :key="opsiIdx"
                    class="flex items-start gap-3"
                  >
                    <div class="flex items-center gap-2 pt-2">
                      <input
                        type="radio"
                        :name="`jawaban-${soal.id}`"
                        :value="opsi.label"
                        :checked="soal.data?.kunciJawaban === opsi.label"
                        @change="updateSoalData(soal.id, { kunciJawaban: opsi.label })"
                        class="w-4 h-4 text-orange-500 focus:ring-orange-500"
                      />
                      <span class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg font-medium text-sm">
                        {{ opsi.label }}
                      </span>
                    </div>
                    <div class="flex-1">
                      <TiptapEditor 
                        :modelValue="opsi.text"
                        @update:modelValue="(val: string) => { opsi.text = val; updateSoalOpsi(soal.id, opsiIdx, val) }"
                        :placeholder="`Pilihan ${opsi.label}`"
                        mini
                      />
                    </div>
                  </div>
                  <p class="text-xs text-gray-500">Pilih radio button untuk menandai jawaban yang benar</p>
                </div>

                <!-- Essay -->
                <div v-if="soal.tipe === 'ESSAY'" class="space-y-3">
                  <Label>Kunci Jawaban (Referensi)</Label>
                  <TiptapEditor
                    :modelValue="soal.data?.kunciJawaban || ''"
                    @update:modelValue="(val: string) => { if(soal.data) soal.data.kunciJawaban = val; updateSoalData(soal.id, { kunciJawaban: val }) }"
                    placeholder="Kunci jawaban untuk referensi penilaian..."
                    mini
                  />
                </div>

                <!-- Isian Singkat -->
                <div v-if="soal.tipe === 'ISIAN_SINGKAT'" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <Label>Kunci Jawaban (bisa lebih dari satu)</Label>
                    <button
                      type="button"
                      @click="addIsianSingkatJawaban(soal.id)"
                      class="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                      Tambah Jawaban
                    </button>
                  </div>
                  <div class="space-y-2">
                    <div 
                      v-for="(jawaban, idx) in (soal.data?.kunciJawaban || [''])" 
                      :key="idx"
                      class="flex items-center gap-2"
                    >
                      <Input 
                        :modelValue="jawaban"
                        @update:modelValue="(val: string) => updateIsianSingkatJawaban(soal.id, idx, val)"
                        :placeholder="`Jawaban ${idx + 1}`"
                        class="flex-1"
                      />
                      <button
                        v-if="(soal.data?.kunciJawaban?.length || 1) > 1"
                        type="button"
                        @click="removeIsianSingkatJawaban(soal.id, idx)"
                        class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Icon name="lucide:trash-2" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500">Siswa akan dianggap benar jika jawabannya cocok dengan salah satu kunci jawaban di atas</p>
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      :id="`case-${soal.id}`"
                      v-model="soal.data.caseSensitive"
                      @change="updateSoalData(soal.id, { caseSensitive: soal.data.caseSensitive })"
                      class="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <label :for="`case-${soal.id}`" class="text-sm text-gray-600">Case sensitive</label>
                  </div>
                </div>

                <!-- Benar/Salah -->
                <div v-if="soal.tipe === 'BENAR_SALAH'" class="space-y-3">
                  <Label>Jawaban yang Benar</Label>
                  <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        :name="`bs-${soal.id}`"
                        :value="true"
                        :checked="soal.data?.kunciJawaban === true"
                        @change="updateSoalData(soal.id, { kunciJawaban: true })"
                        class="w-4 h-4 text-orange-500 focus:ring-orange-500"
                      />
                      <span class="text-sm">Benar</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        :name="`bs-${soal.id}`"
                        :value="false"
                        :checked="soal.data?.kunciJawaban === false"
                        @change="updateSoalData(soal.id, { kunciJawaban: false })"
                        class="w-4 h-4 text-orange-500 focus:ring-orange-500"
                      />
                      <span class="text-sm">Salah</span>
                    </label>
                  </div>
                </div>

                <!-- Pencocokan -->
                <div v-if="soal.tipe === 'PENCOCOKAN'" class="space-y-4">
                  <MatchingEditor
                    :itemKiri="soal.data?.itemKiri || []"
                    :itemKanan="soal.data?.itemKanan || []"
                    :jawaban="soal.data?.jawaban || {}"
                    @update:itemKiri="(val) => updatePencocokanData(soal.id, 'itemKiri', val)"
                    @update:itemKanan="(val) => updatePencocokanData(soal.id, 'itemKanan', val)"
                    @update:jawaban="(val) => updatePencocokanData(soal.id, 'jawaban', val)"
                  />
                </div>
              </div>
            </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- Delete Soal Confirmation -->
    <ConfirmDialog
      v-model="showDeleteSoalDialog"
      title="Hapus Soal"
      message="Apakah Anda yakin ingin menghapus soal ini?"
      type="danger"
      confirm-text="Ya, Hapus"
      :loading="isDeletingSoal"
      @confirm="handleDeleteSoal"
    />
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'
import draggable from 'vuedraggable'

definePageMeta({
  layout: 'guru',
})

useHead({
  title: 'Edit Ujian',
})

const route = useRoute()
const ujianId = route.params.id as string

const { printSoal, isPrinting } = usePrintSoal()

const isLoading = ref(true)
const isSaving = ref(false)
const isDeletingSoal = ref(false)
const activeTab = ref('info')
const showAddSoalMenu = ref(false)
const showDeleteSoalDialog = ref(false)
const deletingSoalId = ref<string | null>(null)

const kelasList = ref<any[]>([])
const mapelList = ref<any[]>([])
const soalList = ref<any[]>([])
const collapsedSoal = ref<Set<string>>(new Set())

// Exam info
const examInfo = ref({
  judul: '',
  deskripsi: '',
  kelas: [] as string[],
  mapelId: '',
  shuffleQuestions: false,
  showScore: true,
})

// Date/time inputs
const startDate = ref('')
const startTime = ref('')
const endDate = ref('')
const endTime = ref('')

// Computed
const totalPoin = computed(() => {
  return soalList.value.reduce((sum, soal) => sum + (soal.poin || 0), 0)
})

// Helper functions
function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimeInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Parse datetime string from DB into date and time parts.
 * DB may return: "2026-02-21T09:00:00" (local) or "2026-02-21T02:00:00.000Z" (UTC)
 * We treat strings WITHOUT 'Z' as Jakarta local time (stored directly).
 * We treat strings WITH 'Z' as UTC and convert to local.
 */
function parseDateTimeFromDB(dateStr: string): { date: string, time: string } {
  if (!dateStr) return { date: '', time: '' }
  const str = String(dateStr)
  // If it has Z or timezone offset, parse as Date (UTC → local conversion)
  if (str.includes('Z') || str.match(/[+-]\d{2}:\d{2}$/)) {
    const d = new Date(str)
    return { date: formatDateInput(d), time: formatTimeInput(d) }
  }
  // No timezone info — treat as Jakarta local time, extract directly
  const match = str.match(/(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/)
  if (match) {
    return { date: match[1], time: match[2] }
  }
  // Fallback
  const d = new Date(str)
  return { date: formatDateInput(d), time: formatTimeInput(d) }
}

const getTipeLabel = (tipe: string) => {
  const labels: Record<string, string> = {
    PILIHAN_GANDA: 'Pilihan Ganda',
    ESSAY: 'Essay',
    ISIAN_SINGKAT: 'Isian Singkat',
    BENAR_SALAH: 'Benar/Salah',
    PENCOCOKAN: 'Pencocokan',
  }
  return labels[tipe] || tipe
}

const getTipeBadgeClass = (tipe: string) => {
  const classes: Record<string, string> = {
    PILIHAN_GANDA: 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700',
    ESSAY: 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-700',
    ISIAN_SINGKAT: 'px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700',
    BENAR_SALAH: 'px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700',
    PENCOCOKAN: 'px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-700',
  }
  return classes[tipe] || 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700'
}

const handlePrintSoal = async () => {
  if (soalList.value.length === 0) {
    toast.error('Belum ada soal untuk dicetak')
    return
  }
  const mapelNama = mapelList.value.find(m => m.id === examInfo.value.mapelId)?.nama || ''
  try {
    await printSoal(
      { judul: examInfo.value.judul, mapel: mapelNama, kelas: examInfo.value.kelas },
      soalList.value,
    )
  } catch {
    toast.error('Gagal membuat PDF soal')
  }
}

const toggleKelas = (kelasNama: string) => {
  const idx = examInfo.value.kelas.indexOf(kelasNama)
  if (idx === -1) {
    examInfo.value.kelas.push(kelasNama)
  } else {
    examInfo.value.kelas.splice(idx, 1)
  }
}

const toggleCollapse = (soalId: string) => {
  if (collapsedSoal.value.has(soalId)) {
    collapsedSoal.value.delete(soalId)
  } else {
    collapsedSoal.value.add(soalId)
  }
}

const collapseAll = () => {
  collapsedSoal.value = new Set(soalList.value.map(s => s.id))
}

const expandAll = () => {
  collapsedSoal.value = new Set()
}

// Handle drag end - save new order to backend
const handleDragEnd = async () => {
  try {
    // Update urutan for each soal
    const updates = soalList.value.map((soal, index) => ({
      id: soal.id,
      urutan: index + 1,
    }))

    await fetchApi(`/api/guru/ujian/${ujianId}/soal/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soal: updates }),
    })
  } catch (err) {
    console.error('Error reordering soal:', err)
  }
}

// Soal management
const getDefaultSoalData = (tipe: string) => {
  switch (tipe) {
    case 'PILIHAN_GANDA':
      return {
        opsi: [
          { label: 'A', text: '' },
          { label: 'B', text: '' },
          { label: 'C', text: '' },
          { label: 'D', text: '' },
        ],
        kunciJawaban: 'A',
      }
    case 'ESSAY':
      return {
        kunciJawaban: '',
        minKata: 0,
        maxKata: 1000,
      }
    case 'ISIAN_SINGKAT':
      return {
        kunciJawaban: [''],
        caseSensitive: false,
      }
    case 'BENAR_SALAH':
      return {
        kunciJawaban: true,
      }
    case 'PENCOCOKAN':
      return {
        itemKiri: [
          { id: generateId(), text: '' },
          { id: generateId(), text: '' },
        ],
        itemKanan: [
          { id: generateId(), text: '' },
          { id: generateId(), text: '' },
        ],
        jawaban: {},
      }
    default:
      return {}
  }
}

const getDefaultPoin = (tipe: string) => {
  const defaults: Record<string, number> = {
    PILIHAN_GANDA: 5,
    ESSAY: 20,
    ISIAN_SINGKAT: 5,
    BENAR_SALAH: 5,
    PENCOCOKAN: 10,
  }
  return defaults[tipe] || 5
}

const addSoal = async (tipe: string) => {
  showAddSoalMenu.value = false
  
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujianId}/soal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipe,
        pertanyaan: '',
        poin: getDefaultPoin(tipe),
        data: getDefaultSoalData(tipe),
      }),
    })

    const result = await response.json()

    if (result.success) {
      await fetchSoal()
      toast.success('Soal berhasil ditambahkan')
      
      // Scroll to new soal
      setTimeout(() => {
        const element = document.getElementById(`soal-${result.data.id}`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } else {
      toast.error(result.error || 'Gagal menambahkan soal')
    }
  } catch (err) {
    console.error('Error adding soal:', err)
    toast.error('Terjadi kesalahan saat menambahkan soal')
  }
}

// Debounce timer for soal updates
let updateTimers: Record<string, NodeJS.Timeout> = {}

const updateSoal = (soalId: string, updates: any) => {
  // Clear existing timer
  if (updateTimers[soalId]) {
    clearTimeout(updateTimers[soalId])
  }

  // Debounce API call
  updateTimers[soalId] = setTimeout(async () => {
    try {
      const soal = soalList.value.find(s => s.id === soalId)
      if (!soal) return

      await fetchApi(`/api/guru/ujian/${ujianId}/soal/${soalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pertanyaan: soal.pertanyaan,
          poin: soal.poin,
          data: soal.data,
        }),
      })
    } catch (err) {
      console.error('Error updating soal:', err)
    }
  }, 500)
}

const updateSoalData = (soalId: string, dataUpdates: any) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (soal) {
    soal.data = { ...soal.data, ...dataUpdates }
    updateSoal(soalId, { data: soal.data })
  }
}

const updateSoalOpsi = (soalId: string, opsiIdx: number, text: string) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (soal && soal.data?.opsi) {
    soal.data.opsi[opsiIdx].text = text
    updateSoal(soalId, { data: soal.data })
  }
}

// Generate unique ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9)
}

// Pencocokan functions
const addPencocokanItem = (soalId: string, side: 'kiri' | 'kanan') => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal) return
  
  const newItem = { id: generateId(), text: '' }
  
  if (side === 'kiri') {
    if (!soal.data.itemKiri) soal.data.itemKiri = []
    soal.data.itemKiri.push(newItem)
  } else {
    if (!soal.data.itemKanan) soal.data.itemKanan = []
    soal.data.itemKanan.push(newItem)
  }
  
  updateSoal(soalId, { data: soal.data })
}

const removePencocokanItem = (soalId: string, side: 'kiri' | 'kanan', idx: number) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal) return
  
  if (side === 'kiri' && soal.data.itemKiri) {
    const removedItem = soal.data.itemKiri[idx]
    soal.data.itemKiri.splice(idx, 1)
    // Remove jawaban for this item
    if (soal.data.jawaban && removedItem) {
      delete soal.data.jawaban[removedItem.id]
    }
  } else if (side === 'kanan' && soal.data.itemKanan) {
    const removedItem = soal.data.itemKanan[idx]
    soal.data.itemKanan.splice(idx, 1)
    // Remove any jawaban pointing to this item
    if (soal.data.jawaban && removedItem) {
      Object.keys(soal.data.jawaban).forEach(key => {
        if (soal.data.jawaban[key] === removedItem.id) {
          delete soal.data.jawaban[key]
        }
      })
    }
  }
  
  updateSoal(soalId, { data: soal.data })
}

const updatePencocokanItem = (soalId: string, side: 'kiri' | 'kanan', idx: number, text: string) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal) return
  
  if (side === 'kiri' && soal.data.itemKiri?.[idx]) {
    soal.data.itemKiri[idx].text = text
  } else if (side === 'kanan' && soal.data.itemKanan?.[idx]) {
    soal.data.itemKanan[idx].text = text
  }
  
  updateSoal(soalId, { data: soal.data })
}

const updatePencocokanJawaban = (soalId: string, kiriId: string, kananId: string) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal) return
  
  if (!soal.data.jawaban) soal.data.jawaban = {}
  
  if (kananId) {
    soal.data.jawaban[kiriId] = kananId
  } else {
    delete soal.data.jawaban[kiriId]
  }
  
  updateSoal(soalId, { data: soal.data })
}

// New function for MatchingEditor component
const updatePencocokanData = (soalId: string, field: 'itemKiri' | 'itemKanan' | 'jawaban', value: any) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal) return
  
  if (!soal.data) soal.data = {}
  soal.data[field] = value
  
  updateSoal(soalId, { data: soal.data })
}

// Isian Singkat functions
const addIsianSingkatJawaban = (soalId: string) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal) return
  
  if (!soal.data.kunciJawaban) soal.data.kunciJawaban = []
  soal.data.kunciJawaban.push('')
  updateSoal(soalId, { data: soal.data })
}

const removeIsianSingkatJawaban = (soalId: string, idx: number) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal || !soal.data.kunciJawaban) return
  
  soal.data.kunciJawaban.splice(idx, 1)
  if (soal.data.kunciJawaban.length === 0) {
    soal.data.kunciJawaban = ['']
  }
  updateSoal(soalId, { data: soal.data })
}

const updateIsianSingkatJawaban = (soalId: string, idx: number, value: string) => {
  const soal = soalList.value.find(s => s.id === soalId)
  if (!soal || !soal.data.kunciJawaban) return
  
  soal.data.kunciJawaban[idx] = value
  updateSoal(soalId, { data: soal.data })
}

const deleteSoal = (soalId: string) => {
  deletingSoalId.value = soalId
  showDeleteSoalDialog.value = true
}

const handleDeleteSoal = async () => {
  if (!deletingSoalId.value) return

  isDeletingSoal.value = true
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujianId}/soal/${deletingSoalId.value}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (result.success) {
      await fetchSoal()
      toast.success('Soal berhasil dihapus')
      showDeleteSoalDialog.value = false
      deletingSoalId.value = null
    } else {
      toast.error(result.error || 'Gagal menghapus soal')
    }
  } catch (err) {
    console.error('Error deleting soal:', err)
    toast.error('Terjadi kesalahan saat menghapus soal')
  } finally {
    isDeletingSoal.value = false
  }
}

// Save handlers
const handleSaveDraft = async () => {
  isSaving.value = true
  try {
    // Send as local Jakarta time string — do NOT convert to UTC with .toISOString()
    const startUjian = `${startDate.value}T${startTime.value}`
    const endUjian = `${endDate.value}T${endTime.value}`

    const response = await fetchApi(`/api/guru/ujian/${ujianId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...examInfo.value,
        startUjian,
        endUjian,
        status: 'draft',
      }),
    })

    const result = await response.json()

    if (result.success) {
      toast.success('Draft berhasil disimpan')
    } else {
      toast.error(result.error || 'Gagal menyimpan draft')
    }
  } catch (err) {
    console.error('Error saving draft:', err)
    toast.error('Terjadi kesalahan saat menyimpan')
  } finally {
    isSaving.value = false
  }
}

const handlePublish = async () => {
  // Validate
  if (!examInfo.value.judul) {
    toast.error('Judul ujian wajib diisi')
    activeTab.value = 'info'
    return
  }
  if (!examInfo.value.mapelId) {
    toast.error('Pilih mata pelajaran')
    activeTab.value = 'info'
    return
  }
  if (examInfo.value.kelas.length === 0) {
    toast.error('Pilih minimal 1 kelas')
    activeTab.value = 'info'
    return
  }
  if (soalList.value.length === 0) {
    toast.error('Minimal harus ada 1 soal')
    activeTab.value = 'soal'
    return
  }
  if (totalPoin.value !== 100) {
    toast.error(`Total poin harus 100. Saat ini: ${totalPoin.value} poin`)
    activeTab.value = 'soal'
    return
  }

  isSaving.value = true
  try {
    // Send as local Jakarta time string — do NOT convert to UTC with .toISOString()
    const startUjian = `${startDate.value}T${startTime.value}`
    const endUjian = `${endDate.value}T${endTime.value}`

    const response = await fetchApi(`/api/guru/ujian/${ujianId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...examInfo.value,
        startUjian,
        endUjian,
        status: 'aktif',
      }),
    })

    const result = await response.json()

    if (result.success) {
      toast.success('Ujian berhasil dipublikasikan')
      navigateTo('/guru/ujian')
    } else {
      toast.error(result.error || 'Gagal mempublikasikan ujian')
    }
  } catch (err) {
    console.error('Error publishing:', err)
    toast.error('Terjadi kesalahan saat mempublikasikan')
  } finally {
    isSaving.value = false
  }
}

// Fetch data
const fetchUjian = async () => {
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujianId}`)
    const data = await response.json()

    if (data.success) {
      // Handle both { ujian: {...} } and direct ujian object formats
      const ujian = data.data?.ujian || data.data
      
      if (ujian) {
        examInfo.value = {
          judul: ujian.judul || '',
          deskripsi: ujian.deskripsi || '',
          kelas: Array.isArray(ujian.kelas) ? ujian.kelas : (ujian.kelas ? [ujian.kelas] : []),
          mapelId: ujian.mapelId || '',
          shuffleQuestions: ujian.shuffleQuestions || false,
          showScore: ujian.showScore !== false,
        }

        // Parse dates from DB — handles both UTC (with Z) and local (without Z) formats
        const now = new Date()
        if (ujian.startUjian) {
          const parsed = parseDateTimeFromDB(ujian.startUjian)
          startDate.value = parsed.date
          startTime.value = parsed.time
        } else {
          startDate.value = formatDateInput(now)
          startTime.value = formatTimeInput(now)
        }
        
        if (ujian.endUjian) {
          const parsed = parseDateTimeFromDB(ujian.endUjian)
          endDate.value = parsed.date
          endTime.value = parsed.time
        } else {
          const defaultEnd = new Date(now.getTime() + 90 * 60000)
          endDate.value = formatDateInput(defaultEnd)
          endTime.value = formatTimeInput(defaultEnd)
        }
      }

      // Fetch kelas and mapel lists from the response
      kelasList.value = data.data?.kelasList || []
      mapelList.value = data.data?.mapelList || []
    } else {
      toast.error(data.error || 'Gagal memuat data ujian')
    }
  } catch (err) {
    console.error('Error fetching ujian:', err)
    toast.error('Terjadi kesalahan saat memuat data ujian')
  }
}

const fetchSoal = async () => {
  try {
    const response = await fetchApi(`/api/guru/ujian/${ujianId}/soal`)
    const data = await response.json()

    if (data.success) {
      soalList.value = data.data || []
    }
  } catch (err) {
    console.error('Error fetching soal:', err)
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    showAddSoalMenu.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  
  try {
    await Promise.all([fetchUjian(), fetchSoal()])
  } catch (err) {
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  // Clear all timers
  Object.values(updateTimers).forEach(clearTimeout)
})
</script>
