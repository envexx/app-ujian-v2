<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Loading -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center space-y-4">
        <Icon name="lucide:loader-2" class="w-10 h-10 animate-spin text-orange-500 mx-auto" />
        <p class="text-gray-500">Memuat soal ujian...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center px-4">
      <div class="text-center space-y-4 max-w-sm">
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <Icon name="lucide:alert-triangle" class="w-8 h-8 text-red-500" />
        </div>
        <p class="text-red-600 font-medium">{{ error }}</p>
        <button @click="navigateTo('/siswa/ujian')" class="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition">
          Kembali
        </button>
      </div>
    </div>

    <!-- Main Exam UI -->
    <template v-else>
      <!-- Sticky Header -->
      <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:file-text" class="w-5 h-5 text-orange-600" />
            </div>
            <div class="min-w-0">
              <h1 class="text-sm font-bold text-gray-900 truncate">{{ ujianData?.judul }}</h1>
              <p class="text-xs text-gray-500">{{ ujianData?.mapel }}</p>
            </div>
          </div>

          <!-- Timer -->
          <div class="flex items-center gap-3">
            <div :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold',
              timerWarning ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
            ]">
              <Icon name="lucide:clock" class="w-4 h-4" />
              <span>{{ formattedTime }}</span>
            </div>
            <button
              @click="showSubmitDialog = true"
              class="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition flex items-center gap-2"
            >
              <Icon name="lucide:send" class="w-4 h-4" />
              <span class="hidden sm:inline">Kumpulkan</span>
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="h-1 bg-gray-100">
          <div
            class="h-full bg-orange-500 transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </header>

      <!-- Content -->
      <div class="flex-1 max-w-7xl mx-auto w-full flex gap-4 p-4 pb-20 lg:pb-4">
        <!-- Soal Navigation Sidebar (desktop) -->
        <aside class="hidden lg:block w-64 flex-shrink-0">
          <div class="sticky top-24 bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-gray-900">Navigasi Soal</h3>
              <span class="text-xs text-gray-500">{{ answeredCount }}/{{ soalList.length }}</span>
            </div>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="(soal, idx) in soalList"
                :key="soal.id"
                @click="goToSoal(idx)"
                :class="[
                  'w-full aspect-square rounded-lg text-xs font-bold transition-all',
                  currentIndex === idx
                    ? 'bg-orange-500 text-white ring-2 ring-orange-300 scale-110'
                    : isAnswered(soal.id)
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                ]"
              >
                {{ idx + 1 }}
              </button>
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-green-100 border border-green-300" />
                <span>Dijawab</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
                <span>Belum</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Soal Area -->
        <main class="flex-1 min-w-0">
          <div v-if="currentSoal" class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <!-- Soal Header -->
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold">
                  {{ currentIndex + 1 }}
                </span>
                <div>
                  <span :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    soalTypeBadge(currentSoal.tipe)
                  ]">
                    {{ soalTypeLabel(currentSoal.tipe) }}
                  </span>
                </div>
              </div>
              <span class="text-xs text-gray-400">{{ currentSoal.poin }} poin</span>
            </div>

            <!-- Pertanyaan -->
            <div class="px-6 py-5">
              <MathRenderer :content="currentSoal.pertanyaan" class="text-gray-800 leading-relaxed" />
            </div>

            <!-- Jawaban Area -->
            <div class="px-6 pb-6">
              <!-- PILIHAN GANDA -->
              <div v-if="currentSoal.tipe === 'PILIHAN_GANDA'" class="space-y-3">
                <button
                  v-for="opsi in pgOptions"
                  :key="opsi.id"
                  @click="selectPG(opsi.id)"
                  :class="[
                    'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    answers[currentSoal.id] === opsi.id
                      ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  <span :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors',
                    answers[currentSoal.id] === opsi.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  ]">
                    {{ opsi.label }}
                  </span>
                  <MathRenderer :content="opsi.text" class="flex-1 text-sm text-gray-700 pt-1" />
                </button>
              </div>

              <!-- BENAR SALAH -->
              <div v-else-if="currentSoal.tipe === 'BENAR_SALAH'" class="flex gap-4">
                <button
                  v-for="opt in [{ val: true, label: 'Benar', icon: 'lucide:check' }, { val: false, label: 'Salah', icon: 'lucide:x' }]"
                  :key="String(opt.val)"
                  @click="selectBS(opt.val)"
                  :class="[
                    'flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                    answers[currentSoal.id] === opt.val
                      ? (opt.val ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  <div :class="[
                    'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                    answers[currentSoal.id] === opt.val
                      ? (opt.val ? 'bg-green-500 text-white' : 'bg-red-500 text-white')
                      : 'bg-gray-100 text-gray-400'
                  ]">
                    <Icon :name="opt.icon" class="w-6 h-6" />
                  </div>
                  <span :class="[
                    'font-semibold text-sm',
                    answers[currentSoal.id] === opt.val
                      ? (opt.val ? 'text-green-700' : 'text-red-700')
                      : 'text-gray-500'
                  ]">
                    {{ opt.label }}
                  </span>
                </button>
              </div>

              <!-- ISIAN SINGKAT -->
              <div v-else-if="currentSoal.tipe === 'ISIAN_SINGKAT'" class="space-y-3">
                <label class="text-sm font-medium text-gray-600">Jawaban Anda:</label>
                <input
                  type="text"
                  :value="answers[currentSoal.id] || ''"
                  @input="onIsianInput"
                  placeholder="Ketik jawaban Anda..."
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                />
              </div>

              <!-- ESSAY -->
              <div v-else-if="currentSoal.tipe === 'ESSAY'" class="space-y-3">
                <label class="text-sm font-medium text-gray-600">Jawaban Anda:</label>
                <textarea
                  :value="essayText"
                  @input="onEssayInput"
                  placeholder="Tulis jawaban Anda di sini..."
                  rows="8"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition resize-y"
                />
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <!-- Camera Capture Button -->
                    <button
                      @click="openCamera"
                      type="button"
                      class="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition"
                    >
                      <Icon name="lucide:camera" class="w-4 h-4" />
                      Foto
                    </button>
                    <!-- Gallery Pick Button -->
                    <button
                      @click="openGallery"
                      type="button"
                      class="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition"
                    >
                      <Icon name="lucide:image" class="w-4 h-4" />
                      Galeri
                    </button>
                  </div>
                  <p class="text-xs text-gray-400">
                    {{ essayText.split(/\s+/).filter(Boolean).length }} kata
                  </p>
                </div>

                <!-- Uploading indicator -->
                <div v-if="isUploadingPhoto" class="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                  <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-orange-500" />
                  <span class="text-xs text-orange-600">Mengupload foto...</span>
                </div>

                <!-- Photo previews -->
                <div v-if="essayPhotos.length > 0" class="space-y-2">
                  <div class="text-xs font-medium text-gray-500">Foto Lampiran:</div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div
                      v-for="(photo, idx) in essayPhotos"
                      :key="idx"
                      class="relative group rounded-xl overflow-hidden border border-gray-200"
                    >
                      <img :src="photo" alt="Foto jawaban" class="w-full h-32 object-cover" />
                      <button
                        @click="removeEssayPhoto(idx)"
                        class="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="lucide:x" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Hidden file inputs -->
                <input
                  ref="cameraInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="onCameraCapture"
                />
                <input
                  ref="galleryInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="onGalleryPick"
                />
              </div>

              <!-- PENCOCOKAN -->
              <div v-else-if="currentSoal.tipe === 'PENCOCOKAN'" class="space-y-4">
                <p class="text-sm text-gray-500">Klik item di kolom kiri, lalu klik pasangannya di kolom kanan untuk menghubungkan.</p>
                <div ref="matchingContainer" class="relative">
                  <div class="grid grid-cols-2 gap-8 sm:gap-16">
                    <!-- Left Column -->
                    <div class="space-y-3">
                      <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pernyataan</div>
                      <button
                        v-for="item in matchingLeft"
                        :key="item.id"
                        :ref="(el) => setMatchRef('left', item.id, el)"
                        @click="onMatchLeftClick(item.id)"
                        :class="[
                          'w-full p-3 rounded-xl border-2 text-left text-sm transition-all',
                          selectedLeftId === item.id
                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                            : getMatchedRight(item.id)
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        ]"
                      >
                        <MathRenderer :content="item.text" />
                      </button>
                    </div>
                    <!-- Right Column -->
                    <div class="space-y-3">
                      <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pasangan</div>
                      <button
                        v-for="item in matchingRight"
                        :key="item.id"
                        :ref="(el) => setMatchRef('right', item.id, el)"
                        @click="onMatchRightClick(item.id)"
                        :class="[
                          'w-full p-3 rounded-xl border-2 text-left text-sm transition-all',
                          isRightMatched(item.id)
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        ]"
                      >
                        <MathRenderer :content="item.text" />
                      </button>
                    </div>
                  </div>
                </div>
                <!-- Matched pairs display -->
                <div v-if="Object.keys(currentMatchingAnswer).length > 0" class="pt-3 border-t border-gray-100">
                  <div class="text-xs font-medium text-gray-500 mb-2">Pasangan Anda:</div>
                  <div class="space-y-1.5">
                    <div
                      v-for="(rightId, leftId) in currentMatchingAnswer"
                      :key="leftId"
                      class="flex items-center gap-2 text-xs bg-green-50 rounded-lg px-3 py-2"
                    >
                      <span class="text-green-700 font-medium truncate flex-1">{{ getMatchItemText('left', String(leftId)) }}</span>
                      <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span class="text-green-700 font-medium truncate flex-1 text-right">{{ getMatchItemText('right', String(rightId)) }}</span>
                      <button @click="removeMatch(String(leftId))" class="ml-1 text-red-400 hover:text-red-600 flex-shrink-0">
                        <Icon name="lucide:x" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navigation Footer -->
            <div class="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                @click="prevSoal"
                :disabled="currentIndex === 0"
                :class="[
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition',
                  currentIndex === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                ]"
              >
                <Icon name="lucide:chevron-left" class="w-4 h-4" />
                Sebelumnya
              </button>
              <span class="text-xs text-gray-400">{{ currentIndex + 1 }} / {{ soalList.length }}</span>
              <button
                v-if="currentIndex < soalList.length - 1"
                @click="nextSoal"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-orange-600 hover:bg-orange-50 transition"
              >
                Selanjutnya
                <Icon name="lucide:chevron-right" class="w-4 h-4" />
              </button>
              <button
                v-else
                @click="showSubmitDialog = true"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition"
              >
                <Icon name="lucide:send" class="w-4 h-4" />
                Kumpulkan
              </button>
            </div>
          </div>
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <div class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div class="px-4 py-2">
          <button
            @click="showMobileNav = !showMobileNav"
            class="w-full flex items-center justify-between px-3 py-2 text-sm"
          >
            <span class="text-gray-500">Soal {{ currentIndex + 1 }}/{{ soalList.length }}</span>
            <span class="text-xs text-gray-400">{{ answeredCount }} dijawab</span>
            <Icon :name="showMobileNav ? 'lucide:chevron-down' : 'lucide:chevron-up'" class="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <!-- Mobile Nav Grid -->
        <Transition name="slide-up">
          <div v-if="showMobileNav" class="px-4 pb-4 pt-1 border-t border-gray-100 max-h-48 overflow-y-auto">
            <div class="grid grid-cols-8 gap-2">
              <button
                v-for="(soal, idx) in soalList"
                :key="soal.id"
                @click="goToSoal(idx); showMobileNav = false"
                :class="[
                  'aspect-square rounded-lg text-xs font-bold transition-all',
                  currentIndex === idx
                    ? 'bg-orange-500 text-white'
                    : isAnswered(soal.id)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                ]"
              >
                {{ idx + 1 }}
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Submit Confirmation Dialog -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="showSubmitDialog" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/50" @click="showSubmitDialog = false" />
            <div class="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div class="text-center space-y-3">
                <div class="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
                  <Icon name="lucide:send" class="w-8 h-8 text-orange-500" />
                </div>
                <h3 class="text-lg font-bold text-gray-900">Kumpulkan Ujian?</h3>
                <p class="text-sm text-gray-500">
                  Anda telah menjawab <strong class="text-gray-900">{{ answeredCount }}</strong> dari
                  <strong class="text-gray-900">{{ soalList.length }}</strong> soal.
                </p>
                <div v-if="unansweredCount > 0" class="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p class="text-xs text-yellow-700">
                    <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 inline -mt-0.5" />
                    Masih ada <strong>{{ unansweredCount }} soal</strong> yang belum dijawab.
                  </p>
                </div>
              </div>
              <div class="flex gap-3">
                <button
                  @click="showSubmitDialog = false"
                  class="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Periksa Lagi
                </button>
                <button
                  @click="submitUjian"
                  :disabled="isSubmitting"
                  class="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Mengirim...' : 'Ya, Kumpulkan' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'siswa',
})

const route = useRoute()
const ujianId = route.params.id as string

const isLoading = ref(true)
const error = ref<string | null>(null)
const ujianData = ref<any>(null)
const soalList = ref<any[]>([])
const answers = ref<Record<string, any>>({})
const currentIndex = ref(0)
const showSubmitDialog = ref(false)
const showMobileNav = ref(false)
const isSubmitting = ref(false)
const timeRemaining = ref(0)
const matchingContainer = ref<HTMLElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
const isUploadingPhoto = ref(false)

// LeaderLine refs
const matchRefs = ref<Record<string, HTMLElement | null>>({})
let leaderLines: any[] = []
let LeaderLine: any = null

useHead({
  title: computed(() => ujianData.value?.judul ? `${ujianData.value.judul} - Ujian` : 'Mengerjakan Ujian'),
})

// Timer
let timerInterval: ReturnType<typeof setInterval> | null = null

const timerWarning = computed(() => timeRemaining.value > 0 && timeRemaining.value <= 300)

const formattedTime = computed(() => {
  const t = timeRemaining.value
  if (t <= 0) return '00:00:00'
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const currentSoal = computed(() => soalList.value[currentIndex.value] || null)

const answeredCount = computed(() => {
  return soalList.value.filter(s => {
    const a = answers.value[s.id]
    if (a === undefined || a === null || a === '') return false
    if (typeof a === 'object' && Object.keys(a).length === 0) return false
    return true
  }).length
})

const unansweredCount = computed(() => soalList.value.length - answeredCount.value)

const progressPercent = computed(() => {
  if (soalList.value.length === 0) return 0
  return Math.round((answeredCount.value / soalList.value.length) * 100)
})

// PG options - handle both {opsi: [{label, text}]} and {options: [{id, text}]} formats
const pgOptions = computed(() => {
  if (!currentSoal.value || currentSoal.value.tipe !== 'PILIHAN_GANDA') return []
  const data = currentSoal.value.data
  if (!data) return []

  // Format 1: opsi array with label/text
  if (data.opsi && Array.isArray(data.opsi)) {
    return data.opsi.map((o: any) => ({
      id: o.label,
      label: o.label,
      text: o.text || '',
    }))
  }
  // Format 2: options array with id/text
  if (data.options && Array.isArray(data.options)) {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    return data.options.map((o: any, i: number) => ({
      id: o.id,
      label: labels[i] || String(i + 1),
      text: o.text || '',
    }))
  }
  return []
})

// Pencocokan data
const matchingLeft = computed(() => {
  if (!currentSoal.value || currentSoal.value.tipe !== 'PENCOCOKAN') return []
  return currentSoal.value.data?.itemKiri || []
})

const matchingRight = computed(() => {
  if (!currentSoal.value || currentSoal.value.tipe !== 'PENCOCOKAN') return []
  return currentSoal.value.data?.itemKanan || []
})

const currentMatchingAnswer = computed(() => {
  if (!currentSoal.value) return {}
  const a = answers.value[currentSoal.value.id]
  if (typeof a === 'object' && a !== null && !Array.isArray(a)) return a
  return {}
})

const selectedLeftId = ref<string | null>(null)

function setMatchRef(side: string, id: string, el: any) {
  const key = `${side}-${id}`
  if (el) {
    matchRefs.value[key] = el.$el || el
  }
}

function getMatchedRight(leftId: string): string | null {
  return currentMatchingAnswer.value[leftId] || null
}

function isRightMatched(rightId: string): boolean {
  return Object.values(currentMatchingAnswer.value).includes(rightId)
}

function getMatchItemText(side: string, id: string): string {
  const list = side === 'left' ? matchingLeft.value : matchingRight.value
  const item = list.find((i: any) => i.id === id)
  // Strip HTML tags for display
  const text = item?.text || id
  return text.replace(/<[^>]*>/g, '').trim()
}

function onMatchLeftClick(leftId: string) {
  if (selectedLeftId.value === leftId) {
    selectedLeftId.value = null
    return
  }
  selectedLeftId.value = leftId
}

function onMatchRightClick(rightId: string) {
  if (!selectedLeftId.value) return

  const current = { ...currentMatchingAnswer.value }

  // Remove any existing match to this right item
  for (const [k, v] of Object.entries(current)) {
    if (v === rightId) delete current[k]
  }

  // Set new match
  current[selectedLeftId.value] = rightId
  answers.value[currentSoal.value.id] = current
  selectedLeftId.value = null

  saveAnswer(currentSoal.value.id, current)
  nextTick(() => drawLeaderLines())
}

function removeMatch(leftId: string) {
  const current = { ...currentMatchingAnswer.value }
  delete current[leftId]
  answers.value[currentSoal.value.id] = current
  saveAnswer(currentSoal.value.id, current)
  nextTick(() => drawLeaderLines())
}

// LeaderLine drawing
function clearLeaderLines() {
  for (const line of leaderLines) {
    try { line.remove() } catch {}
  }
  leaderLines = []
}

function drawLeaderLines() {
  clearLeaderLines()
  if (!LeaderLine || !currentSoal.value || currentSoal.value.tipe !== 'PENCOCOKAN') return

  const mapping = currentMatchingAnswer.value
  for (const [leftId, rightId] of Object.entries(mapping)) {
    const startEl = matchRefs.value[`left-${leftId}`]
    const endEl = matchRefs.value[`right-${rightId}`]
    if (startEl && endEl) {
      try {
        const line = new LeaderLine(startEl, endEl, {
          color: 'rgba(249, 115, 22, 0.6)',
          size: 2.5,
          path: 'straight',
          startSocket: 'right',
          endSocket: 'left',
          startPlug: 'disc',
          endPlug: 'disc',
          startPlugSize: 1.5,
          endPlugSize: 1.5,
        })
        leaderLines.push(line)
      } catch {}
    }
  }
}

// Navigation
function goToSoal(idx: number) {
  clearLeaderLines()
  selectedLeftId.value = null
  currentIndex.value = idx
  window.scrollTo({ top: 0, behavior: 'smooth' })
  nextTick(() => {
    if (currentSoal.value?.tipe === 'PENCOCOKAN') {
      setTimeout(() => drawLeaderLines(), 100)
    }
  })
}

function prevSoal() {
  if (currentIndex.value > 0) goToSoal(currentIndex.value - 1)
}

function nextSoal() {
  if (currentIndex.value < soalList.value.length - 1) goToSoal(currentIndex.value + 1)
}

function isAnswered(soalId: string): boolean {
  const a = answers.value[soalId]
  if (a === undefined || a === null || a === '') return false
  if (typeof a === 'object' && Object.keys(a).length === 0) return false
  return true
}

// Answer handlers
function selectPG(optionId: string) {
  if (!currentSoal.value) return
  answers.value[currentSoal.value.id] = optionId
  saveAnswer(currentSoal.value.id, optionId)
}

function selectBS(val: boolean) {
  if (!currentSoal.value) return
  answers.value[currentSoal.value.id] = val
  saveAnswer(currentSoal.value.id, val)
}

let isianDebounce: ReturnType<typeof setTimeout> | null = null
function onIsianInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (!currentSoal.value) return
  answers.value[currentSoal.value.id] = val
  if (isianDebounce) clearTimeout(isianDebounce)
  isianDebounce = setTimeout(() => saveAnswer(currentSoal.value!.id, val), 500)
}

// Essay helpers — answer stored as { text: string, photos: string[] }
const essayText = computed(() => {
  if (!currentSoal.value) return ''
  const a = answers.value[currentSoal.value.id]
  if (!a) return ''
  if (typeof a === 'string') return a
  if (typeof a === 'object' && a.text !== undefined) return a.text
  return ''
})

const essayPhotos = computed<string[]>(() => {
  if (!currentSoal.value) return []
  const a = answers.value[currentSoal.value.id]
  if (!a || typeof a !== 'object') return []
  return Array.isArray(a.photos) ? a.photos : []
})

function getEssayAnswer(): { text: string; photos: string[] } {
  const a = answers.value[currentSoal.value?.id]
  if (!a) return { text: '', photos: [] }
  if (typeof a === 'string') return { text: a, photos: [] }
  return { text: a.text || '', photos: Array.isArray(a.photos) ? a.photos : [] }
}

function setEssayAnswer(data: { text: string; photos: string[] }) {
  if (!currentSoal.value) return
  answers.value[currentSoal.value.id] = data
  saveAnswer(currentSoal.value.id, data)
}

let essayDebounce: ReturnType<typeof setTimeout> | null = null
function onEssayInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  if (!currentSoal.value) return
  const current = getEssayAnswer()
  current.text = val
  answers.value[currentSoal.value.id] = { ...current }
  if (essayDebounce) clearTimeout(essayDebounce)
  essayDebounce = setTimeout(() => saveAnswer(currentSoal.value!.id, { ...current }), 1000)
}

// Camera & Gallery
function openCamera() {
  cameraInput.value?.click()
}

function openGallery() {
  galleryInput.value?.click()
}

async function onCameraCapture(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await uploadEssayPhoto(file)
  if (cameraInput.value) cameraInput.value.value = ''
}

async function onGalleryPick(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    await uploadEssayPhoto(file)
  }
  if (galleryInput.value) galleryInput.value.value = ''
}

async function uploadEssayPhoto(file: File) {
  isUploadingPhoto.value = true
  try {
    // Convert to base64
    const base64 = await fileToBase64(file)

    const response = await fetchApi('/api/upload/r2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        folder: 'jawaban',
        fileName: `jawaban_${Date.now()}`,
      }),
    })
    const data = await response.json()
    if (data.success && data.data?.url) {
      const current = getEssayAnswer()
      current.photos.push(data.data.url)
      setEssayAnswer(current)
      toast.success('Foto berhasil diupload')
    } else {
      toast.error('Gagal mengupload foto')
    }
  } catch (err) {
    console.error('Upload error:', err)
    toast.error('Gagal mengupload foto')
  } finally {
    isUploadingPhoto.value = false
  }
}

function removeEssayPhoto(idx: number) {
  const current = getEssayAnswer()
  current.photos.splice(idx, 1)
  setEssayAnswer({ ...current, photos: [...current.photos] })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Save individual answer to backend
async function saveAnswer(soalId: string, jawaban: any) {
  try {
    await fetchApi(`/api/siswa/ujian/${ujianId}/jawab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soalId, jawaban }),
    })
  } catch (err) {
    console.error('Failed to save answer:', err)
  }
}

// Submit ujian
async function submitUjian() {
  isSubmitting.value = true
  try {
    const response = await fetchApi(`/api/siswa/ujian/${ujianId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answers.value }),
    })
    const data = await response.json()
    if (data.success) {
      if (timerInterval) clearInterval(timerInterval)
      const msg = data.data?.hasEssay 
        ? 'Ujian berhasil dikumpulkan! Nilai essay akan dinilai oleh guru.' 
        : `Ujian berhasil dikumpulkan! Nilai: ${data.data?.nilai ?? '-'}`
      toast.success(msg)
      navigateTo(`/siswa/ujian/${ujianId}/hasil`)
    } else {
      toast.error(data.error || 'Gagal mengumpulkan ujian')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan saat mengumpulkan ujian')
  } finally {
    isSubmitting.value = false
    showSubmitDialog.value = false
  }
}

// Soal type helpers
function soalTypeLabel(tipe: string): string {
  const map: Record<string, string> = {
    PILIHAN_GANDA: 'Pilihan Ganda',
    ESSAY: 'Essay',
    ISIAN_SINGKAT: 'Isian Singkat',
    BENAR_SALAH: 'Benar / Salah',
    PENCOCOKAN: 'Pencocokan',
  }
  return map[tipe] || tipe
}

function soalTypeBadge(tipe: string): string {
  const map: Record<string, string> = {
    PILIHAN_GANDA: 'bg-blue-100 text-blue-700',
    ESSAY: 'bg-emerald-100 text-emerald-700',
    ISIAN_SINGKAT: 'bg-purple-100 text-purple-700',
    BENAR_SALAH: 'bg-amber-100 text-amber-700',
    PENCOCOKAN: 'bg-pink-100 text-pink-700',
  }
  return map[tipe] || 'bg-gray-100 text-gray-700'
}

// Fetch ujian data
async function fetchUjianData() {
  try {
    const response = await fetchApi(`/api/siswa/ujian/${ujianId}`)
    const data = await response.json()

    if (!data.success) {
      error.value = data.error || 'Gagal memuat ujian'
      return
    }

    ujianData.value = data.data.ujian
    soalList.value = (data.data.soal || []).map((s: any) => ({
      ...s,
      data: typeof s.data === 'string' ? JSON.parse(s.data) : s.data,
    }))

    // Shuffle if needed
    if (ujianData.value?.shuffleQuestions) {
      soalList.value = soalList.value.sort(() => Math.random() - 0.5)
    }

    // Set initial time
    timeRemaining.value = data.data.timeRemaining || 0

    // Load existing answers from submission
    if (data.data.submission?.id) {
      await loadExistingAnswers()
    }

    // Start timer
    startTimer()

    // Create submission if not exists (start the exam)
    if (!data.data.submission) {
      await startExam()
    }
  } catch (err) {
    error.value = 'Terjadi kesalahan saat memuat ujian'
  } finally {
    isLoading.value = false
  }
}

async function loadExistingAnswers() {
  try {
    const response = await fetchApi(`/api/siswa/ujian/${ujianId}/answers`)
    const data = await response.json()
    if (data.success && data.data?.answers) {
      for (const [soalId, jawaban] of Object.entries(data.data.answers)) {
        // Extract actual value from JSONB wrapper
        let val = jawaban as any
        if (typeof val === 'string') {
          try { val = JSON.parse(val) } catch {}
        }
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          // Could be {jawaban: x}, {value: x}, or a matching map {leftId: rightId}
          if ('jawaban' in val && Object.keys(val).length <= 2) val = val.jawaban
          else if ('value' in val && Object.keys(val).length <= 2) val = val.value
          // Otherwise keep as-is (pencocokan mapping)
        }
        if (val !== null && val !== undefined) {
          answers.value[soalId] = val
        }
      }
    }
  } catch (err) {
    console.error('Failed to load existing answers:', err)
  }
}

async function startExam() {
  try {
    // Save a dummy answer to trigger submission creation
    if (soalList.value.length > 0) {
      await fetchApi(`/api/siswa/ujian/${ujianId}/jawab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soalId: soalList.value[0].id, jawaban: null }),
      })
    }
  } catch {}
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      if (timerInterval) clearInterval(timerInterval)
      // Auto-submit when time runs out
      toast.warning('Waktu habis! Ujian akan dikumpulkan otomatis.')
      submitUjian()
    }
  }, 1000)
}

// Watch for soal change to redraw leader lines
watch(currentIndex, () => {
  nextTick(() => {
    if (currentSoal.value?.tipe === 'PENCOCOKAN') {
      setTimeout(() => drawLeaderLines(), 150)
    }
  })
})

onMounted(async () => {
  await fetchUjianData()

  // Dynamically import LeaderLine (it requires window/document)
  if (import.meta.client) {
    try {
      const mod = await import('leader-line-new')
      LeaderLine = mod.default || mod
    } catch (err) {
      console.warn('LeaderLine not available:', err)
    }
  }

  // Redraw lines on window resize
  window.addEventListener('resize', () => {
    if (currentSoal.value?.tipe === 'PENCOCOKAN') {
      drawLeaderLines()
    }
  })
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
  clearLeaderLines()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
