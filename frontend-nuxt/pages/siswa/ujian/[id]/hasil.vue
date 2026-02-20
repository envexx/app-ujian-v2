<template>
  <div class="min-h-screen bg-[#E8F4F8] p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        variant="ghost"
        size="sm"
        icon="lucide:arrow-left"
        @click="navigateTo('/siswa/ujian')"
      />
      <div>
        <h1 class="text-xl font-bold text-gray-900">Hasil Ujian</h1>
        <p class="text-sm text-gray-500">{{ ujian?.judul || 'Ujian' }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-white rounded-2xl p-12 text-center">
      <Icon name="lucide:alert-circle" class="w-16 h-16 mx-auto text-red-400 mb-4" />
      <p class="text-gray-600">{{ error }}</p>
      <Button class="mt-4" @click="navigateTo('/siswa/ujian')">
        Kembali ke Daftar Ujian
      </Button>
    </div>

    <div v-else class="space-y-6">
      <!-- Essay Pending Banner -->
      <div v-if="hasEssayPending" class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
        <Icon name="lucide:clock" class="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <p class="text-yellow-800 font-semibold text-sm">Menunggu Penilaian Guru</p>
          <p class="text-yellow-600 text-xs">Soal essay belum dinilai. Nilai akhir dan status kelulusan akan muncul setelah guru menilai semua jawaban essay.</p>
        </div>
      </div>

      <!-- Score Card -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <!-- Score Circle -->
          <div class="relative">
            <div :class="[
              'w-32 h-32 rounded-full flex items-center justify-center',
              hasEssayPending ? 'bg-yellow-100' : isPassed ? 'bg-green-100' : 'bg-red-100'
            ]">
              <div class="text-center">
                <p :class="[
                  'text-4xl font-bold',
                  hasEssayPending ? 'text-yellow-600' : isPassed ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ hasEssayPending ? '?' : hasScore ? Math.round(submission?.nilai || 0) : '-' }}
                </p>
                <p class="text-sm text-gray-500">dari 100</p>
              </div>
            </div>
            <div :class="[
              'absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium',
              hasEssayPending ? 'bg-yellow-500 text-white' : isPassed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            ]">
              {{ hasEssayPending ? 'MENUNGGU' : isPassed ? 'LULUS' : 'TIDAK LULUS' }}
            </div>
          </div>

          <!-- Stats -->
          <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-xl">
              <Icon name="lucide:check-circle" class="w-6 h-6 mx-auto text-green-500 mb-2" />
              <p class="text-2xl font-bold text-gray-900">{{ correctCount }}</p>
              <p class="text-xs text-gray-500">Benar</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-xl">
              <Icon name="lucide:x-circle" class="w-6 h-6 mx-auto text-red-500 mb-2" />
              <p class="text-2xl font-bold text-gray-900">{{ wrongCount }}</p>
              <p class="text-xs text-gray-500">Salah</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-xl">
              <Icon name="lucide:hourglass" class="w-6 h-6 mx-auto text-yellow-500 mb-2" />
              <p class="text-2xl font-bold text-gray-900">{{ pendingCount }}</p>
              <p class="text-xs text-gray-500">Belum Dinilai</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-xl">
              <Icon name="lucide:minus-circle" class="w-6 h-6 mx-auto text-gray-400 mb-2" />
              <p class="text-2xl font-bold text-gray-900">{{ unansweredCount }}</p>
              <p class="text-xs text-gray-500">Tidak Dijawab</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Exam Info -->
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-4">Informasi Ujian</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500">Mata Pelajaran</p>
            <p class="font-medium text-gray-900">{{ ujian?.mapel || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Kelas</p>
            <p class="font-medium text-gray-900">{{ formatKelas(ujian?.kelas) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Tanggal Ujian</p>
            <p class="font-medium text-gray-900">{{ formatDate(ujian?.startUjian) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Waktu Selesai</p>
            <p class="font-medium text-gray-900">{{ formatDateTime(submission?.submittedAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Answer Review -->
      <div v-if="ujian?.showScore" class="space-y-4">
        <h3 class="font-semibold text-gray-900 text-lg">Review Jawaban</h3>
        
        <div 
          v-for="(soal, index) in soalList" 
          :key="soal.id"
          class="bg-white rounded-2xl border border-gray-200 overflow-hidden"
        >
          <!-- Soal Header -->
          <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                getAnswerStatus(soal.id) === 'correct' ? 'bg-green-100 text-green-700' :
                getAnswerStatus(soal.id) === 'wrong' ? 'bg-red-100 text-red-700' :
                getAnswerStatus(soal.id) === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              ]">
                {{ index + 1 }}
              </span>
              <span :class="getTipeBadgeClass(soal.tipe)">{{ getTipeLabel(soal.tipe) }}</span>
              <span class="text-xs text-gray-400">{{ soal.poin }} poin</span>
            </div>
            <div :class="[
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
              getAnswerStatus(soal.id) === 'correct' ? 'bg-green-100 text-green-700' :
              getAnswerStatus(soal.id) === 'wrong' ? 'bg-red-100 text-red-700' :
              getAnswerStatus(soal.id) === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-500'
            ]">
              <Icon 
                :name="getAnswerStatus(soal.id) === 'correct' ? 'lucide:check-circle' : 
                       getAnswerStatus(soal.id) === 'wrong' ? 'lucide:x-circle' :
                       getAnswerStatus(soal.id) === 'pending' ? 'lucide:clock' : 'lucide:minus-circle'"
                class="w-3.5 h-3.5"
              />
              {{ getAnswerStatus(soal.id) === 'correct' ? 'Benar' : 
                 getAnswerStatus(soal.id) === 'wrong' ? 'Salah' :
                 getAnswerStatus(soal.id) === 'pending' ? 'Belum Dinilai' : 'Tidak Dijawab' }}
            </div>
          </div>

          <!-- Pertanyaan -->
          <div class="px-5 py-4">
            <MathRenderer :content="soal.pertanyaan || 'Tidak ada pertanyaan'" class="text-gray-800 leading-relaxed" />
          </div>

          <!-- Answer Area -->
          <div class="px-5 pb-5">
            <!-- PILIHAN GANDA: Show all options with indicators -->
            <template v-if="soal.tipe === 'PILIHAN_GANDA'">
              <div class="space-y-2">
                <div
                  v-for="opsi in getPgOptions(soal)"
                  :key="opsi.label"
                  :class="[
                    'flex items-start gap-3 p-3 rounded-xl border-2 transition-all',
                    pgOptionClass(soal, opsi.label)
                  ]"
                >
                  <span :class="[
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    pgBulletClass(soal, opsi.label)
                  ]">
                    {{ opsi.label }}
                  </span>
                  <MathRenderer :content="opsi.text" class="flex-1 text-sm pt-0.5" />
                  <!-- Indicators -->
                  <div class="flex items-center gap-1 flex-shrink-0 pt-0.5">
                    <Icon v-if="isKunci(soal, opsi.label)" name="lucide:check" class="w-4 h-4 text-green-500" />
                    <span v-if="isKunci(soal, opsi.label)" class="text-xs text-green-600 font-medium">Kunci</span>
                    <Icon v-if="isSiswaAnswer(soal, opsi.label) && !isKunci(soal, opsi.label)" name="lucide:x" class="w-4 h-4 text-red-500" />
                    <span v-if="isSiswaAnswer(soal, opsi.label) && !isKunci(soal, opsi.label)" class="text-xs text-red-600 font-medium">Jawaban Anda</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- BENAR SALAH: Show both options with indicators -->
            <template v-else-if="soal.tipe === 'BENAR_SALAH'">
              <div class="flex gap-4">
                <div
                  v-for="opt in [{ val: true, label: 'Benar', icon: 'lucide:check' }, { val: false, label: 'Salah', icon: 'lucide:x' }]"
                  :key="String(opt.val)"
                  :class="[
                    'flex-1 flex flex-col items-center gap-2 p-5 rounded-xl border-2',
                    bsOptionClass(soal, opt.val)
                  ]"
                >
                  <div :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    bsBulletClass(soal, opt.val)
                  ]">
                    <Icon :name="opt.icon" class="w-5 h-5" />
                  </div>
                  <span class="font-semibold text-sm">{{ opt.label }}</span>
                  <div class="flex items-center gap-1">
                    <template v-if="isBsKunci(soal, opt.val) && isBsSiswa(soal, opt.val)">
                      <Icon name="lucide:check-circle" class="w-3.5 h-3.5 text-green-500" />
                      <span class="text-xs text-green-600">Benar</span>
                    </template>
                    <template v-else-if="isBsKunci(soal, opt.val)">
                      <Icon name="lucide:check" class="w-3.5 h-3.5 text-green-500" />
                      <span class="text-xs text-green-600">Kunci</span>
                    </template>
                    <template v-else-if="isBsSiswa(soal, opt.val)">
                      <Icon name="lucide:x" class="w-3.5 h-3.5 text-red-500" />
                      <span class="text-xs text-red-600">Jawaban Anda</span>
                    </template>
                  </div>
                </div>
              </div>
            </template>

            <!-- ISIAN SINGKAT -->
            <template v-else-if="soal.tipe === 'ISIAN_SINGKAT'">
              <div class="space-y-3">
                <div class="p-3 rounded-xl border-2" :class="getAnswerStatus(soal.id) === 'correct' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'">
                  <p class="text-xs font-medium text-gray-500 mb-1">Jawaban Anda:</p>
                  <p class="text-sm font-medium">{{ getStudentAnswer(soal) || '-' }}</p>
                </div>
                <div class="p-3 rounded-xl border-2 border-green-300 bg-green-50">
                  <p class="text-xs font-medium text-green-700 mb-1">Kunci Jawaban:</p>
                  <p class="text-sm font-medium text-green-800">{{ getCorrectAnswer(soal) }}</p>
                </div>
              </div>
            </template>

            <!-- ESSAY -->
            <template v-else-if="soal.tipe === 'ESSAY'">
              <div class="space-y-3">
                <div class="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                  <p class="text-xs font-medium text-gray-500 mb-2">Jawaban Anda:</p>
                  <p v-if="getEssayText(soal.id)" class="text-sm text-gray-800 whitespace-pre-wrap">{{ getEssayText(soal.id) }}</p>
                  <p v-else class="text-sm text-gray-400 italic">Tidak dijawab</p>
                  <div v-if="getEssayPhotos(soal.id).length > 0" class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <img v-for="(photo, pi) in getEssayPhotos(soal.id)" :key="pi" :src="photo" class="w-full h-28 object-cover rounded-lg border" />
                  </div>
                </div>
                <div v-if="getAnswerStatus(soal.id) === 'pending'" class="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                  <p class="text-xs font-medium text-yellow-700">
                    <Icon name="lucide:clock" class="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                    Menunggu penilaian guru. Kunci jawaban akan ditampilkan setelah dinilai.
                  </p>
                </div>
                <div v-else class="p-3 rounded-xl border-2 border-green-300 bg-green-50">
                  <p class="text-xs font-medium text-green-700 mb-1">Kunci Jawaban:</p>
                  <div class="text-sm text-green-800" v-html="getCorrectAnswer(soal)"></div>
                </div>
              </div>
            </template>

            <!-- PENCOCOKAN -->
            <template v-else-if="soal.tipe === 'PENCOCOKAN'">
              <div class="space-y-3">
                <!-- Siswa's matching pairs -->
                <div class="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                  <p class="text-xs font-medium text-gray-500 mb-2">Jawaban Anda:</p>
                  <div v-if="getMatchingPairs(soal.id).length > 0" class="space-y-1.5">
                    <div 
                      v-for="pair in getMatchingPairsWithStatus(soal)" 
                      :key="pair.left"
                      :class="[
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                        pair.correct ? 'bg-green-100' : 'bg-red-100'
                      ]"
                    >
                      <Icon :name="pair.correct ? 'lucide:check' : 'lucide:x'" :class="['w-3.5 h-3.5 flex-shrink-0', pair.correct ? 'text-green-600' : 'text-red-500']" />
                      <span class="font-medium">{{ pair.leftText }}</span>
                      <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{{ pair.rightText }}</span>
                    </div>
                  </div>
                  <p v-else class="text-sm text-gray-400 italic">Tidak dijawab</p>
                </div>
                <!-- Kunci jawaban -->
                <div class="p-4 rounded-xl border-2 border-green-300 bg-green-50">
                  <p class="text-xs font-medium text-green-700 mb-2">Kunci Jawaban:</p>
                  <div class="space-y-1.5">
                    <div 
                      v-for="pair in getKunciMatchingPairs(soal)" 
                      :key="pair.left"
                      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 text-sm"
                    >
                      <span class="font-medium text-green-800">{{ pair.leftText }}</span>
                      <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span class="text-green-800">{{ pair.rightText }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="flex justify-center">
        <Button @click="navigateTo('/siswa/ujian')" variant="outline">
          <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
          Kembali ke Daftar Ujian
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// date formatting uses toLocaleString with Asia/Jakarta timezone

definePageMeta({
  layout: 'siswa',
})

useHead({
  title: 'Hasil Ujian',
})

const route = useRoute()
const ujianId = route.params.id as string

const isLoading = ref(true)
const error = ref<string | null>(null)
const ujian = ref<any>(null)
const submission = ref<any>(null)
const soalList = ref<any[]>([])
const answers = ref<Record<string, any>>({})
const jawabanDetails = ref<Record<string, any>>({})

// Computed
const hasEssayPending = computed(() => submission.value?.hasEssayPending === true)
const hasScore = computed(() => submission.value?.nilai !== null && submission.value?.nilai !== undefined)
const isPassed = computed(() => !hasEssayPending.value && hasScore.value && (submission.value?.nilai || 0) >= 75)

const correctCount = computed(() => {
  return soalList.value.filter(soal => {
    const detail = jawabanDetails.value[soal.id]
    return detail?.isCorrect === true
  }).length
})

const wrongCount = computed(() => {
  return soalList.value.filter(soal => {
    const detail = jawabanDetails.value[soal.id]
    return detail && detail.isCorrect === false
  }).length
})

const pendingCount = computed(() => {
  return soalList.value.filter(soal => {
    const detail = jawabanDetails.value[soal.id]
    return detail && detail.isCorrect === null
  }).length
})

const unansweredCount = computed(() => {
  return soalList.value.filter(soal => {
    return !jawabanDetails.value[soal.id]
  }).length
})

const timeSpent = computed(() => {
  if (!submission.value?.startedAt || !submission.value?.submittedAt) return null
  const start = new Date(submission.value.startedAt)
  const end = new Date(submission.value.submittedAt)
  const diff = end.getTime() - start.getTime()
  if (diff > 0 && diff < 86400000) {
    return Math.round(diff / 60000)
  }
  return null
})

// Helper functions
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
}

const formatKelas = (kelas: any) => {
  if (!kelas) return '-'
  if (Array.isArray(kelas)) return kelas.join(', ')
  return kelas
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

const getAnswerStatus = (soalId: string): string => {
  const detail = jawabanDetails.value[soalId]
  if (!detail) return 'unanswered'
  if (detail.isCorrect === null || detail.isCorrect === undefined) return 'pending'
  return detail.isCorrect ? 'correct' : 'wrong'
}

// ── PG Helpers ──
function getPgOptions(soal: any): { label: string; text: string }[] {
  const data = soal.data
  if (!data) return []
  if (data.opsi && Array.isArray(data.opsi)) {
    return data.opsi.map((o: any) => ({ label: o.label, text: o.text || '' }))
  }
  if (data.options && Array.isArray(data.options)) {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    return data.options.map((o: any, i: number) => ({ label: labels[i] || String(i + 1), text: o.text || '' }))
  }
  return []
}

function isKunci(soal: any, label: string): boolean {
  return String(soal.data?.kunciJawaban) === label
}

function isSiswaAnswer(soal: any, label: string): boolean {
  return String(answers.value[soal.id] || '') === label
}

function pgOptionClass(soal: any, label: string): string {
  const kunci = isKunci(soal, label)
  const siswa = isSiswaAnswer(soal, label)
  if (kunci && siswa) return 'border-green-500 bg-green-50'
  if (kunci) return 'border-green-400 bg-green-50'
  if (siswa) return 'border-red-400 bg-red-50'
  return 'border-gray-200'
}

function pgBulletClass(soal: any, label: string): string {
  const kunci = isKunci(soal, label)
  const siswa = isSiswaAnswer(soal, label)
  if (kunci && siswa) return 'bg-green-500 text-white'
  if (kunci) return 'bg-green-500 text-white'
  if (siswa) return 'bg-red-500 text-white'
  return 'bg-gray-100 text-gray-500'
}

// ── BS Helpers ──
function isBsKunci(soal: any, val: boolean): boolean {
  const k = soal.data?.kunciJawaban
  return (k === true || k === 'true') === val
}

function isBsSiswa(soal: any, val: boolean): boolean {
  const a = answers.value[soal.id]
  if (a === true || a === 'true') return val === true
  if (a === false || a === 'false') return val === false
  return false
}

function bsOptionClass(soal: any, val: boolean): string {
  const kunci = isBsKunci(soal, val)
  const siswa = isBsSiswa(soal, val)
  if (kunci && siswa) return val ? 'border-green-500 bg-green-50' : 'border-green-500 bg-green-50'
  if (kunci) return 'border-green-400 bg-green-50'
  if (siswa) return 'border-red-400 bg-red-50'
  return 'border-gray-200'
}

function bsBulletClass(soal: any, val: boolean): string {
  const kunci = isBsKunci(soal, val)
  const siswa = isBsSiswa(soal, val)
  if (kunci && siswa) return 'bg-green-500 text-white'
  if (kunci) return 'bg-green-500 text-white'
  if (siswa) return 'bg-red-500 text-white'
  return 'bg-gray-100 text-gray-400'
}

// ── Pencocokan Helpers ──
function getMatchingPairsWithStatus(soal: any): { left: string; leftText: string; rightText: string; correct: boolean }[] {
  const answer = answers.value[soal.id]
  if (!answer || typeof answer !== 'object') return []
  const kunci = soal.data?.jawaban || {}
  const pairs: { left: string; leftText: string; rightText: string; correct: boolean }[] = []
  for (const [leftId, rightVal] of Object.entries(answer)) {
    const rightId = normMatchVal(rightVal)
    if (!rightId) continue
    const leftItem = soal.data?.itemKiri?.find((i: any) => i.id === leftId)
    const rightItem = soal.data?.itemKanan?.find((i: any) => i.id === rightId)
    const correctRight = normMatchVal(kunci[leftId])
    pairs.push({
      left: leftId,
      leftText: stripHtml(leftItem?.text || leftId),
      rightText: stripHtml(rightItem?.text || rightId),
      correct: rightId === correctRight,
    })
  }
  return pairs
}

function getKunciMatchingPairs(soal: any): { left: string; leftText: string; rightText: string }[] {
  const kunci = soal.data?.jawaban || {}
  const pairs: { left: string; leftText: string; rightText: string }[] = []
  for (const [leftId, rightVal] of Object.entries(kunci)) {
    const rightId = normMatchVal(rightVal)
    if (!rightId) continue
    const leftItem = soal.data?.itemKiri?.find((i: any) => i.id === leftId)
    const rightItem = soal.data?.itemKanan?.find((i: any) => i.id === rightId)
    pairs.push({
      left: leftId,
      leftText: stripHtml(leftItem?.text || leftId),
      rightText: stripHtml(rightItem?.text || rightId),
    })
  }
  return pairs
}

const getStudentAnswer = (soal: any): string => {
  const answer = answers.value[soal.id]
  if (answer === null || answer === undefined) return ''
  
  if (soal.tipe === 'PILIHAN_GANDA') {
    const label = String(answer)
    const opsi = soal.data?.opsi?.find((o: any) => o.label === label)
    if (opsi) return `${opsi.label}. ${stripHtml(opsi.text)}`
    return label
  }
  if (soal.tipe === 'BENAR_SALAH') {
    if (answer === true || answer === 'true') return 'Benar'
    if (answer === false || answer === 'false') return 'Salah'
    return String(answer)
  }
  if (soal.tipe === 'ISIAN_SINGKAT') {
    return String(answer)
  }
  if (typeof answer === 'string') return answer
  return ''
}

function getEssayText(soalId: string): string {
  const answer = answers.value[soalId]
  if (!answer) return ''
  if (typeof answer === 'string') return answer
  if (typeof answer === 'object' && answer.text) return answer.text
  return ''
}

function getEssayPhotos(soalId: string): string[] {
  const answer = answers.value[soalId]
  if (!answer || typeof answer !== 'object') return []
  return Array.isArray(answer.photos) ? answer.photos : []
}

// Normalize pencocokan value: could be "id" or ["id"]
function normMatchVal(v: any): string {
  if (Array.isArray(v)) return v[0] || ''
  return String(v || '')
}

function getMatchingPairs(soalId: string): { left: string; leftText: string; rightText: string }[] {
  const answer = answers.value[soalId]
  if (!answer || typeof answer !== 'object') return []
  const soal = soalList.value.find((s: any) => s.id === soalId)
  if (!soal) return []
  const pairs: { left: string; leftText: string; rightText: string }[] = []
  for (const [leftId, rightVal] of Object.entries(answer)) {
    const rightId = normMatchVal(rightVal)
    if (!rightId) continue
    const leftItem = soal.data?.itemKiri?.find((i: any) => i.id === leftId)
    const rightItem = soal.data?.itemKanan?.find((i: any) => i.id === rightId)
    pairs.push({
      left: leftId,
      leftText: stripHtml(leftItem?.text || leftId),
      rightText: stripHtml(rightItem?.text || rightId),
    })
  }
  return pairs
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

const getCorrectAnswer = (soal: any): string => {
  const data = soal.data
  if (!data) return '-'
  
  switch (soal.tipe) {
    case 'PILIHAN_GANDA': {
      const opsi = data.opsi?.find((o: any) => o.label === data.kunciJawaban)
      return opsi ? `${opsi.label}. ${opsi.text}` : (data.kunciJawaban || '-')
    }
    case 'ESSAY':
      return data.kunciJawaban || '-'
    case 'ISIAN_SINGKAT':
      return Array.isArray(data.kunciJawaban) ? data.kunciJawaban.join(', ') : (data.kunciJawaban || '-')
    case 'BENAR_SALAH':
      return (data.kunciJawaban === true || data.kunciJawaban === 'true') ? 'Benar' : 'Salah'
    case 'PENCOCOKAN': {
      if (!data.jawaban || !data.itemKiri || !data.itemKanan) return '-'
      const lines: string[] = []
      for (const [leftId, rightVal] of Object.entries(data.jawaban)) {
        const rightId = normMatchVal(rightVal)
        if (!rightId) continue
        const left = data.itemKiri.find((i: any) => i.id === leftId)
        const right = data.itemKanan.find((i: any) => i.id === rightId)
        lines.push(`${stripHtml(left?.text || leftId)} → ${stripHtml(right?.text || rightId)}`)
      }
      return lines.join('<br>')
    }
    default:
      return '-'
  }
}

// Fetch data
const fetchData = async () => {
  try {
    const response = await fetchApi(`/api/siswa/ujian/${ujianId}/hasil`)
    const data = await response.json()

    if (data.success && data.data) {
      ujian.value = data.data.ujian
      submission.value = data.data.submission
      soalList.value = data.data.soal || []
      answers.value = data.data.answers || {}
      jawabanDetails.value = data.data.jawabanDetails || {}
    } else {
      error.value = data.error || 'Gagal memuat hasil ujian'
    }
  } catch (err) {
    console.error('Error fetching hasil:', err)
    error.value = 'Terjadi kesalahan saat memuat hasil ujian'
  }
}

onMounted(async () => {
  try {
    await fetchData()
  } catch (err) {
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
