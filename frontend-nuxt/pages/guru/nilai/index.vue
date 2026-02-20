<template>
  <div>
    <!-- Filter Card -->
    <div class="bg-white rounded-2xl p-5 card-shadow mb-6">
      <div class="flex gap-4 items-center">
        <select
          v-model="filterUjian"
          class="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        >
          <option value="">Pilih Ujian</option>
          <option v-for="ujian in ujianList" :key="ujian.id" :value="ujian.id">
            {{ ujian.judul }}
          </option>
        </select>
        <select
          v-model="filterKelas"
          :disabled="!filterUjian || kelasList.length === 0"
          class="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm w-48 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Semua Kelas</option>
          <option v-for="kelas in kelasList" :key="kelas" :value="kelas">
            {{ kelas }}
          </option>
        </select>
        <Button
          v-if="filterUjian && nilaiList.length > 0"
          variant="outline"
          icon="lucide:download"
          @click="exportToCSV"
        >
          Export CSV
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
    </div>

    <!-- No Selection -->
    <div v-else-if="!filterUjian" class="bg-white rounded-2xl p-12 card-shadow text-center">
      <Icon name="lucide:bar-chart-3" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p class="text-gray-500">Pilih ujian untuk melihat nilai</p>
    </div>

    <!-- Content with Tabs -->
    <div v-else>
      <!-- Stats Cards -->
      <div v-if="stats" class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 card-shadow">
          <p class="text-sm text-gray-500">Total Siswa</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 card-shadow">
          <p class="text-sm text-gray-500">Selesai</p>
          <p class="text-2xl font-bold text-green-600">{{ stats.selesai }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 card-shadow">
          <p class="text-sm text-gray-500">Sedang Mengerjakan</p>
          <p class="text-2xl font-bold text-yellow-600">{{ stats.sedangMengerjakan }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 card-shadow">
          <p class="text-sm text-gray-500">Belum Mulai</p>
          <p class="text-2xl font-bold text-gray-400">{{ stats.belumMulai }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-2xl card-shadow overflow-hidden">
        <div class="flex border-b border-gray-200">
          <button
            @click="activeTab = 'siswa'"
            :class="[
              'px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'siswa' 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            Daftar Siswa
          </button>
          <button
            @click="activeTab = 'jawaban'"
            :class="[
              'px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'jawaban' 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            Jawaban Siswa
          </button>
          <button
            @click="activeTab = 'kategori'"
            :class="[
              'px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'kategori' 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            Nilai per Kategori
          </button>
        </div>

        <!-- Tab: Daftar Siswa -->
        <div v-show="activeTab === 'siswa'">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">NISN</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                <th class="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Nilai</th>
                <th class="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in nilaiList" :key="item.siswa?.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-sm text-gray-900">{{ item.siswa?.nisn }}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.siswa?.nama }}</td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ item.siswa?.kelas?.nama || '-' }}</td>
                <td class="px-6 py-4 text-center">
                  <span :class="['text-lg font-bold', getNilaiColor(item.nilai)]">
                    {{ item.nilai ?? '-' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span :class="getStatusClass(item.status)">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <Button
                    v-if="item.id"
                    @click="openDetailModal(item)"
                    variant="outline"
                    size="sm"
                    icon="lucide:eye"
                  >
                    Detail
                  </Button>
                  <span v-else class="text-sm text-gray-400">-</span>
                </td>
              </tr>
              <tr v-if="nilaiList.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                  <Icon name="lucide:inbox" class="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  Belum ada data nilai
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab: Jawaban Siswa -->
        <div v-show="activeTab === 'jawaban'" class="p-6">
          <div v-if="isLoadingJawaban" class="flex items-center justify-center py-12">
            <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
          </div>
          <div v-else-if="jawabanList.length === 0" class="text-center py-12">
            <Icon name="lucide:file-question" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p class="text-gray-500">Belum ada jawaban siswa</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 border-b border-gray-200">Siswa</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-600 border-b border-gray-200">Kelas</th>
                  <th 
                    v-for="soal in soalList" 
                    :key="soal.id"
                    class="px-4 py-3 text-center font-semibold text-gray-600 min-w-[150px] border-b border-gray-200"
                  >
                    Soal {{ soal.nomor }}
                    <span class="block text-xs font-normal text-gray-400">{{ getTipeLabel(soal.tipe) }} ({{ soal.poin }} poin)</span>
                  </th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-600 border-b border-gray-200">Total</th>
                </tr>
              </thead>
              <tbody>
                <!-- Kunci Jawaban Row -->
                <tr class="bg-blue-50 border-b-2 border-blue-200">
                  <td class="px-4 py-3 font-semibold text-blue-700 sticky left-0 bg-blue-50">
                    <Icon name="lucide:key" class="w-4 h-4 inline mr-1" />
                    Kunci Jawaban
                  </td>
                  <td class="px-4 py-3 text-center text-blue-600">-</td>
                  <td 
                    v-for="soal in soalList" 
                    :key="'kunci-' + soal.id"
                    class="px-4 py-3 text-center"
                  >
                    <div class="text-xs text-blue-700 max-w-[140px] mx-auto">
                      <template v-if="soal.tipe === 'PILIHAN_GANDA'">
                        <span class="font-bold">{{ soal.data?.kunciJawaban }}</span>
                      </template>
                      <template v-else-if="soal.tipe === 'BENAR_SALAH'">
                        <span class="font-bold">{{ soal.data?.kunciJawaban === true ? 'Benar' : 'Salah' }}</span>
                      </template>
                      <template v-else-if="soal.tipe === 'ISIAN_SINGKAT'">
                        <span class="font-bold">{{ (soal.data?.kunciJawaban || []).join(' / ') }}</span>
                      </template>
                      <template v-else-if="soal.tipe === 'ESSAY'">
                        <span class="italic text-blue-500">Manual</span>
                      </template>
                      <template v-else-if="soal.tipe === 'PENCOCOKAN'">
                        <div class="text-left">
                          <div v-for="pair in getDetailKunciPairs(soal)" :key="pair.left" class="text-xs">
                            {{ pair.leftText }} → {{ pair.rightText }}
                          </div>
                          <span v-if="!soal.data?.jawaban || Object.keys(soal.data?.jawaban || {}).length === 0" class="italic text-blue-500">-</span>
                        </div>
                      </template>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center text-blue-700 font-bold">-</td>
                </tr>
                <!-- Student Rows -->
                <tr v-for="jawaban in jawabanList" :key="jawaban.siswa.id" class="hover:bg-gray-50 border-b border-gray-100">
                  <td class="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">
                    {{ jawaban.siswa.nama || '-' }}
                  </td>
                  <td class="px-4 py-3 text-center text-gray-500">{{ jawaban.siswa.kelas || '-' }}</td>
                  <td 
                    v-for="soal in soalList" 
                    :key="soal.id"
                    class="px-4 py-3 text-center"
                  >
                    <template v-if="jawaban.jawaban[soal.id]">
                      <div class="flex flex-col items-center gap-1">
                        <!-- Jawaban Siswa -->
                        <div class="text-xs max-w-[140px] truncate" :title="formatJawaban(jawaban.jawaban[soal.id].jawaban, soal.tipe)">
                          {{ formatJawaban(jawaban.jawaban[soal.id].jawaban, soal.tipe) }}
                        </div>
                        <!-- Status/Nilai -->
                        <span 
                          :class="[
                            'inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium',
                            jawaban.jawaban[soal.id].benar 
                              ? 'bg-green-100 text-green-700' 
                              : jawaban.jawaban[soal.id].nilai !== null
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-600'
                          ]"
                        >
                          {{ jawaban.jawaban[soal.id].benar ? '✓ Benar' : jawaban.jawaban[soal.id].nilai !== null ? `${jawaban.jawaban[soal.id].nilai} poin` : '✗ Salah' }}
                        </span>
                      </div>
                    </template>
                    <span v-else class="text-gray-300">-</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span :class="['text-lg font-bold', getNilaiColor(jawaban.totalNilai)]">
                      {{ jawaban.totalNilai ?? '-' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab: Nilai per Kategori -->
        <div v-show="activeTab === 'kategori'" class="p-6">
          <div v-if="isLoadingJawaban" class="flex items-center justify-center py-12">
            <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
          </div>
          <div v-else-if="jawabanList.length === 0" class="text-center py-12">
            <Icon name="lucide:file-question" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p class="text-gray-500">Belum ada jawaban siswa</p>
          </div>
          <div v-else>
            <!-- Export Button -->
            <div class="flex justify-end mb-4">
              <Button variant="outline" icon="lucide:download" @click="exportKategoriCSV">
                Export CSV Kategori
              </Button>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div v-for="cat in kategoriTypes" :key="cat.tipe" class="bg-gray-50 rounded-xl p-3 text-center">
                <p class="text-xs text-gray-500 mb-1">{{ cat.label }}</p>
                <p class="text-lg font-bold text-gray-900">{{ cat.totalSoal }} soal</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 border-b border-gray-200">Siswa</th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600 border-b border-gray-200">Kelas</th>
                    <th
                      v-for="cat in kategoriTypes"
                      :key="'h-' + cat.tipe"
                      class="px-4 py-3 text-center font-semibold text-gray-600 border-b border-gray-200 min-w-[120px]"
                    >
                      {{ cat.label }}
                      <span class="block text-xs font-normal text-gray-400">{{ cat.totalSoal }} soal</span>
                    </th>
                    <th class="px-4 py-3 text-center font-semibold text-gray-600 border-b border-gray-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in kategoriData" :key="row.siswa.id" class="hover:bg-gray-50 border-b border-gray-100">
                    <td class="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">{{ row.siswa.nama }}</td>
                    <td class="px-4 py-3 text-center text-gray-500">{{ row.siswa.kelas || '-' }}</td>
                    <td
                      v-for="cat in kategoriTypes"
                      :key="cat.tipe"
                      class="px-4 py-3 text-center"
                    >
                      <div class="flex flex-col items-center gap-0.5">
                        <span class="text-green-600 font-semibold">{{ row.perTipe[cat.tipe]?.benar ?? 0 }}</span>
                        <span class="text-xs text-gray-400">/ {{ cat.totalSoal }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span :class="['text-lg font-bold', getNilaiColor(row.totalNilai)]">
                        {{ row.totalNilai ?? '-' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div 
      v-if="showDetailModal" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeDetailModal"
    >
      <div class="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Detail Jawaban Siswa</h2>
            <p class="text-sm text-gray-500">{{ selectedSubmission?.siswa?.nama }} - {{ selectedSubmission?.siswa?.kelas?.nama }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm text-gray-500">Nilai</p>
              <p :class="['text-2xl font-bold', getNilaiColor(selectedSubmission?.nilai)]">
                {{ selectedSubmission?.nilai ?? '-' }}
              </p>
            </div>
            <button @click="closeDetailModal" class="p-2 hover:bg-gray-100 rounded-lg">
              <Icon name="lucide:x" class="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="isLoadingDetail" class="flex items-center justify-center py-12">
            <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-orange-500" />
          </div>
          <div v-else class="space-y-6">
            <div 
              v-for="(item, idx) in detailJawaban" 
              :key="item.soal.id"
              class="border border-gray-200 rounded-xl p-5"
            >
              <!-- Soal Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-semibold text-sm">
                    {{ idx + 1 }}
                  </div>
                  <span :class="getTipeBadgeClass(item.soal.tipe)">
                    {{ getTipeLabel(item.soal.tipe) }}
                  </span>
                  <span class="text-sm text-gray-500">{{ item.soal.poin }} poin</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">Nilai:</span>
                  <input
                    v-if="item.soal.tipe === 'ESSAY'"
                    type="number"
                    v-model.number="item.jawaban.nilaiEdit"
                    :max="item.soal.poin"
                    min="0"
                    class="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <span v-else :class="['text-lg font-bold', item.jawaban?.benar ? 'text-green-600' : 'text-red-600']">
                    {{ item.jawaban?.nilai ?? 0 }} / {{ item.soal.poin }}
                  </span>
                </div>
              </div>

              <!-- Pertanyaan -->
              <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-1">Pertanyaan:</p>
                <div class="prose prose-sm max-w-none" v-html="item.soal.pertanyaan"></div>
              </div>

              <!-- Jawaban Siswa -->
              <div class="mb-4">
                <p class="text-xs text-gray-500 mb-2">Jawaban Siswa:</p>

                <!-- PILIHAN GANDA -->
                <div v-if="item.soal.tipe === 'PILIHAN_GANDA'" class="space-y-2">
                  <div
                    v-for="opsi in getDetailPgOptions(item.soal)"
                    :key="opsi.label"
                    :class="[
                      'flex items-start gap-3 p-3 rounded-xl border-2',
                      isDetailKunci(item.soal, opsi.label) && isDetailSiswa(item, opsi.label) ? 'border-green-500 bg-green-50' :
                      isDetailKunci(item.soal, opsi.label) ? 'border-green-400 bg-green-50' :
                      isDetailSiswa(item, opsi.label) ? 'border-red-400 bg-red-50' :
                      'border-gray-200'
                    ]"
                  >
                    <span :class="[
                      'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                      isDetailKunci(item.soal, opsi.label) ? 'bg-green-500 text-white' :
                      isDetailSiswa(item, opsi.label) ? 'bg-red-500 text-white' :
                      'bg-gray-100 text-gray-500'
                    ]">
                      {{ opsi.label }}
                    </span>
                    <div class="flex-1 text-sm prose prose-sm max-w-none" v-html="opsi.text"></div>
                    <div class="flex items-center gap-1 flex-shrink-0 pt-0.5">
                      <template v-if="isDetailKunci(item.soal, opsi.label) && isDetailSiswa(item, opsi.label)">
                        <Icon name="lucide:check-circle" class="w-4 h-4 text-green-500" />
                        <span class="text-xs text-green-600 font-medium">Benar</span>
                      </template>
                      <template v-else-if="isDetailKunci(item.soal, opsi.label)">
                        <Icon name="lucide:check" class="w-4 h-4 text-green-500" />
                        <span class="text-xs text-green-600 font-medium">Kunci</span>
                      </template>
                      <template v-else-if="isDetailSiswa(item, opsi.label)">
                        <Icon name="lucide:x" class="w-4 h-4 text-red-500" />
                        <span class="text-xs text-red-600 font-medium">Jawaban Siswa</span>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- BENAR SALAH -->
                <div v-else-if="item.soal.tipe === 'BENAR_SALAH'" class="flex gap-4">
                  <div
                    v-for="opt in [{ val: true, label: 'Benar', icon: 'lucide:check' }, { val: false, label: 'Salah', icon: 'lucide:x' }]"
                    :key="String(opt.val)"
                    :class="[
                      'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2',
                      isDetailBsKunci(item.soal, opt.val) && isDetailBsSiswa(item, opt.val) ? 'border-green-500 bg-green-50' :
                      isDetailBsKunci(item.soal, opt.val) ? 'border-green-400 bg-green-50' :
                      isDetailBsSiswa(item, opt.val) ? 'border-red-400 bg-red-50' :
                      'border-gray-200'
                    ]"
                  >
                    <div :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      isDetailBsKunci(item.soal, opt.val) ? 'bg-green-500 text-white' :
                      isDetailBsSiswa(item, opt.val) ? 'bg-red-500 text-white' :
                      'bg-gray-100 text-gray-400'
                    ]">
                      <Icon :name="opt.icon" class="w-5 h-5" />
                    </div>
                    <span class="font-semibold text-sm">{{ opt.label }}</span>
                    <div class="flex items-center gap-1 text-xs">
                      <template v-if="isDetailBsKunci(item.soal, opt.val) && isDetailBsSiswa(item, opt.val)">
                        <Icon name="lucide:check-circle" class="w-3.5 h-3.5 text-green-500" />
                        <span class="text-green-600">Benar</span>
                      </template>
                      <template v-else-if="isDetailBsKunci(item.soal, opt.val)">
                        <span class="text-green-600">Kunci</span>
                      </template>
                      <template v-else-if="isDetailBsSiswa(item, opt.val)">
                        <span class="text-red-600">Jawaban Siswa</span>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- ISIAN SINGKAT -->
                <div v-else-if="item.soal.tipe === 'ISIAN_SINGKAT'" class="space-y-2">
                  <div class="p-3 rounded-xl border-2" :class="item.jawaban?.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'">
                    <p class="text-sm font-medium">{{ item.jawaban?.jawaban || '-' }}</p>
                    <span v-if="item.jawaban?.isCorrect" class="text-xs text-green-600">✓ Benar</span>
                    <span v-else class="text-xs text-red-600">✗ Salah</span>
                  </div>
                  <div class="p-3 rounded-xl border-2 border-green-300 bg-green-50">
                    <p class="text-xs text-green-700 font-medium mb-1">Kunci Jawaban:</p>
                    <p class="text-sm font-medium text-green-800">{{ (item.soal.data?.kunciJawaban || []).join(', ') }}</p>
                  </div>
                </div>

                <!-- ESSAY -->
                <div v-else-if="item.soal.tipe === 'ESSAY'" class="space-y-3">
                  <div class="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                    <p v-if="getDetailEssayText(item)" class="text-sm text-gray-800 whitespace-pre-wrap">{{ getDetailEssayText(item) }}</p>
                    <p v-else class="text-sm text-gray-400 italic">Tidak dijawab</p>
                    <div v-if="getDetailEssayPhotos(item).length > 0" class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <img v-for="(photo, pi) in getDetailEssayPhotos(item)" :key="pi" :src="photo" class="w-full h-24 object-cover rounded-lg border" />
                    </div>
                  </div>
                </div>

                <!-- PENCOCOKAN -->
                <div v-else-if="item.soal.tipe === 'PENCOCOKAN'" class="space-y-3">
                  <div class="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                    <div v-if="getDetailMatchPairs(item).length > 0" class="space-y-1.5">
                      <div
                        v-for="pair in getDetailMatchPairs(item)"
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
                  <!-- Kunci Jawaban Pencocokan -->
                  <div class="p-4 rounded-xl border-2 border-green-300 bg-green-50">
                    <p class="text-xs text-green-700 font-medium mb-2">Kunci Jawaban:</p>
                    <div class="space-y-1.5">
                      <div
                        v-for="pair in getDetailKunciPairs(item.soal)"
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
              </div>

              <!-- Feedback untuk Essay -->
              <div v-if="item.soal.tipe === 'ESSAY'" class="space-y-2">
                <p class="text-xs text-gray-500">Feedback (opsional):</p>
                <textarea
                  v-model="item.jawaban.feedbackEdit"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="Berikan feedback untuk siswa..."
                ></textarea>
              </div>

              <!-- Kunci Jawaban Essay -->
              <div v-if="item.soal.tipe === 'ESSAY' && item.soal.data?.kunciJawaban" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-xs text-blue-600 font-medium mb-1">Kunci Jawaban (Referensi):</p>
                <div class="prose prose-sm max-w-none text-blue-900" v-html="item.soal.data.kunciJawaban"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" @click="closeDetailModal">Tutup</Button>
          <Button :loading="isSavingGrade" @click="saveGrades">Simpan Nilai</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'guru',
})

useHead({
  title: 'Nilai Siswa',
})

const isLoading = ref(true)
const isLoadingJawaban = ref(false)
const isLoadingDetail = ref(false)
const isSavingGrade = ref(false)
const filterUjian = ref('')
const filterKelas = ref('')
const activeTab = ref('siswa')
const ujianList = ref<any[]>([])
const nilaiList = ref<any[]>([])
const kelasList = ref<string[]>([])
const stats = ref<any>(null)
const soalList = ref<any[]>([])
const jawabanList = ref<any[]>([])

// Detail modal
const showDetailModal = ref(false)
const selectedSubmission = ref<any>(null)
const detailJawaban = ref<any[]>([])

const getNilaiColor = (nilai: number | null) => {
  if (nilai === null) return 'text-gray-400'
  if (nilai >= 80) return 'text-green-600'
  if (nilai >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    selesai: 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-600',
    sedang_mengerjakan: 'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600',
    belum_mulai: 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600',
  }
  return classes[status] || classes.belum_mulai
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    selesai: 'Selesai',
    sedang_mengerjakan: 'Mengerjakan',
    belum_mulai: 'Belum Mulai',
  }
  return labels[status] || status
}

const getTipeLabel = (tipe: string) => {
  const labels: Record<string, string> = {
    PILIHAN_GANDA: 'PG',
    ESSAY: 'Essay',
    ISIAN_SINGKAT: 'Isian',
    BENAR_SALAH: 'B/S',
    PENCOCOKAN: 'Cocok',
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

const getJawabanPreview = (jawaban: any) => {
  if (!jawaban) return '-'
  if (typeof jawaban.jawaban === 'string') return jawaban.jawaban.substring(0, 50)
  return JSON.stringify(jawaban.jawaban).substring(0, 50)
}

// ── Detail Modal Helpers ──
function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

function normMatchVal(v: any): string {
  if (Array.isArray(v)) return v[0] || ''
  return String(v || '')
}

function getDetailPgOptions(soal: any): { label: string; text: string }[] {
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

function isDetailKunci(soal: any, label: string): boolean {
  return String(soal.data?.kunciJawaban) === label
}

function isDetailSiswa(item: any, label: string): boolean {
  const jawaban = item.jawaban?.jawaban
  return String(jawaban || '') === label
}

function isDetailBsKunci(soal: any, val: boolean): boolean {
  const k = soal.data?.kunciJawaban
  return (k === true || k === 'true') === val
}

function isDetailBsSiswa(item: any, val: boolean): boolean {
  const a = item.jawaban?.jawaban
  if (a === true || a === 'true') return val === true
  if (a === false || a === 'false') return val === false
  return false
}

function getDetailEssayText(item: any): string {
  const j = item.jawaban?.jawaban
  if (!j) return ''
  if (typeof j === 'string') return j
  if (typeof j === 'object' && j.text) return j.text
  return ''
}

function getDetailEssayPhotos(item: any): string[] {
  const j = item.jawaban?.jawaban
  if (!j || typeof j !== 'object') return []
  return Array.isArray(j.photos) ? j.photos : []
}

function getDetailMatchPairs(item: any): { left: string; leftText: string; rightText: string; correct: boolean }[] {
  const answer = item.jawaban?.jawaban
  if (!answer || typeof answer !== 'object') return []
  const kunci = item.soal.data?.jawaban || {}
  const pairs: { left: string; leftText: string; rightText: string; correct: boolean }[] = []
  for (const [leftId, rightVal] of Object.entries(answer)) {
    const rightId = normMatchVal(rightVal)
    if (!rightId) continue
    const leftItem = item.soal.data?.itemKiri?.find((i: any) => i.id === leftId)
    const rightItem = item.soal.data?.itemKanan?.find((i: any) => i.id === rightId)
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

function getDetailKunciPairs(soal: any): { left: string; leftText: string; rightText: string }[] {
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

const formatJawaban = (jawabanData: any, tipe: string): string => {
  if (jawabanData === null || jawabanData === undefined) return '-'
  
  // Extract actual value - backend stores as { value: X } or { jawaban: X } or direct value
  let value = jawabanData
  if (typeof jawabanData === 'object' && jawabanData !== null) {
    if ('value' in jawabanData) value = jawabanData.value
    else if ('jawaban' in jawabanData) value = jawabanData.jawaban
  }
  
  // If value is still an object with nested structure, extract again
  if (typeof value === 'object' && value !== null) {
    if ('value' in value) value = value.value
    else if ('jawaban' in value) value = value.jawaban
    else if ('text' in value) value = value.text
    else if ('answer' in value) value = value.answer
    else if ('selected' in value) value = value.selected
  }
  
  if (tipe === 'PILIHAN_GANDA') {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    return '-'
  }
  
  if (tipe === 'BENAR_SALAH') {
    if (value === true || value === 'true' || value === 'Benar') return 'Benar'
    if (value === false || value === 'false' || value === 'Salah') return 'Salah'
    return '-'
  }
  
  if (tipe === 'ISIAN_SINGKAT') {
    if (typeof value === 'string') return value || '-'
    if (typeof value === 'number') return String(value)
    return '-'
  }
  
  if (tipe === 'ESSAY') {
    let text = ''
    if (typeof value === 'string') {
      text = value
    } else if (typeof value === 'object' && value !== null) {
      // Essay stored as {text: "...", photos: [...]}
      text = value.text || ''
    } else {
      text = String(value ?? '')
    }
    // Strip HTML tags for preview
    text = text.replace(/<[^>]*>/g, '').trim()
    return text.length > 30 ? text.substring(0, 30) + '...' : (text || '-')
  }
  
  if (tipe === 'PENCOCOKAN') {
    // For pencocokan, the original jawabanData might have the pairs
    let pairs = jawabanData
    if (typeof jawabanData === 'object' && jawabanData !== null) {
      if ('value' in jawabanData) pairs = jawabanData.value
      else if ('jawaban' in jawabanData) pairs = jawabanData.jawaban
    }
    if (typeof pairs === 'object' && pairs !== null && !Array.isArray(pairs)) {
      const entries = Object.entries(pairs)
      if (entries.length === 0) return '-'
      return `${entries.length} pasangan`
    }
    return '-'
  }
  
  // Fallback
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    const str = JSON.stringify(value)
    return str.length > 30 ? str.substring(0, 30) + '...' : str
  }
  return String(value)
}

const getKiriText = (itemKiri: any[], kiriId: string) => {
  const item = itemKiri?.find((i: any) => i.id === kiriId)
  return item?.text?.replace(/<[^>]*>/g, '').substring(0, 20) || kiriId
}

const getKananText = (itemKanan: any[], kananId: string) => {
  const item = itemKanan?.find((i: any) => i.id === kananId)
  return item?.text?.replace(/<[^>]*>/g, '').substring(0, 20) || kananId
}

const getKiriTextFromSoal = (soal: any, kiriId: string) => {
  const itemKiri = soal?.data?.itemKiri || []
  const item = itemKiri.find((i: any) => i.id === kiriId)
  return item?.text?.replace(/<[^>]*>/g, '').substring(0, 15) || kiriId
}

const getKananTextFromSoal = (soal: any, kananId: string) => {
  const itemKanan = soal?.data?.itemKanan || []
  const item = itemKanan.find((i: any) => i.id === kananId)
  return item?.text?.replace(/<[^>]*>/g, '').substring(0, 15) || kananId
}

const fetchUjian = async () => {
  const response = await fetchApi('/api/guru/ujian')
  const data = await response.json()
  if (data.success) {
    ujianList.value = data.data?.ujian || data.data || []
  }
}

const fetchNilai = async () => {
  if (!filterUjian.value) {
    nilaiList.value = []
    kelasList.value = []
    stats.value = null
    return
  }
  
  let url = `/api/guru/ujian/${filterUjian.value}/hasil`
  if (filterKelas.value) {
    url += `?kelas=${encodeURIComponent(filterKelas.value)}`
  }
  
  const response = await fetchApi(url)
  const data = await response.json()
  if (data.success) {
    nilaiList.value = data.data?.siswa || []
    kelasList.value = data.data?.kelasList || []
    stats.value = data.data?.stats || null
  }
}

const fetchJawaban = async () => {
  if (!filterUjian.value) return
  
  isLoadingJawaban.value = true
  try {
    const response = await fetchApi(`/api/guru/ujian/${filterUjian.value}/nilai`)
    const data = await response.json()
    if (data.success) {
      soalList.value = data.data?.soal || []
      
      // Transform submissions to jawaban list
      const submissions = data.data?.submissions || []
      jawabanList.value = submissions.map((sub: any) => {
        const jawabanMap: Record<string, any> = {}
        for (const j of sub.jawaban || []) {
          jawabanMap[j.soalId] = {
            nilai: j.nilai,
            benar: j.isCorrect,
            jawaban: j.jawaban,
          }
        }
        return {
          siswa: {
            id: sub.siswaId,
            nama: sub.siswa,
            kelas: sub.kelas,
          },
          jawaban: jawabanMap,
          totalNilai: sub.nilaiTotal,
        }
      })
    }
  } catch (err) {
    console.error('Error fetching jawaban:', err)
  } finally {
    isLoadingJawaban.value = false
  }
}

const openDetailModal = async (item: any) => {
  selectedSubmission.value = item
  showDetailModal.value = true
  isLoadingDetail.value = true
  
  try {
    const response = await fetchApi(`/api/guru/ujian/${filterUjian.value}/nilai`)
    const data = await response.json()
    if (data.success) {
      const soal = data.data?.soal || []
      const submission = data.data?.submissions?.find((s: any) => s.id === item.id)
      
      if (submission) {
        detailJawaban.value = soal.map((s: any) => {
          const jawaban = submission.jawaban?.find((j: any) => j.soalId === s.id) || {}
          return {
            soal: s,
            jawaban: {
              id: jawaban.id,
              soalId: s.id,
              jawaban: jawaban.jawaban,
              nilai: jawaban.nilai,
              isCorrect: jawaban.isCorrect,
              feedback: jawaban.feedback,
              nilaiEdit: jawaban.nilai ?? 0,
              feedbackEdit: jawaban.feedback || '',
            },
          }
        })
        
        // Update selectedSubmission with full data
        selectedSubmission.value = {
          ...item,
          nilai: submission.nilaiTotal,
        }
      }
    }
  } catch (err) {
    console.error('Error fetching detail:', err)
  } finally {
    isLoadingDetail.value = false
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSubmission.value = null
  detailJawaban.value = []
}

const saveGrades = async () => {
  if (!selectedSubmission.value) return
  
  isSavingGrade.value = true
  try {
    const grades = detailJawaban.value
      .filter(item => item.soal.tipe === 'ESSAY')
      .map(item => ({
        jawabanId: item.jawaban.id,
        nilai: item.jawaban.nilaiEdit,
        feedback: item.jawaban.feedbackEdit,
      }))
    
    const response = await fetchApi(`/api/guru/ujian/${filterUjian.value}/nilai`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissionId: selectedSubmission.value.id,
        grades,
      }),
    })
    
    const data = await response.json()
    if (data.success) {
      toast.success('Nilai berhasil disimpan')
      closeDetailModal()
      await fetchNilai()
      if (activeTab.value === 'jawaban') {
        await fetchJawaban()
      }
    } else {
      toast.error(data.error || 'Gagal menyimpan nilai')
    }
  } catch (err) {
    console.error('Error saving grades:', err)
    toast.error('Terjadi kesalahan saat menyimpan nilai')
  } finally {
    isSavingGrade.value = false
  }
}

const exportToCSV = async () => {
  if (jawabanList.value.length === 0 && soalList.value.length === 0) {
    // Fetch jawaban data first if not loaded
    await fetchJawaban()
  }
  
  if (jawabanList.value.length === 0) {
    toast.error('Tidak ada data jawaban untuk diexport')
    return
  }
  
  const selectedUjian = ujianList.value.find(u => u.id === filterUjian.value)
  const filename = `jawaban_${selectedUjian?.judul?.replace(/\s+/g, '_') || 'ujian'}_${new Date().toISOString().split('T')[0]}.csv`
  
  // Build headers: NISN, Nama, Kelas, Soal1 Jawaban, Soal1 Nilai, Soal2 Jawaban, Soal2 Nilai, ..., Total
  const headers = ['NISN', 'Nama', 'Kelas']
  for (const soal of soalList.value) {
    headers.push(`Soal ${soal.nomor} (${getTipeLabel(soal.tipe)}) - Jawaban`)
    headers.push(`Soal ${soal.nomor} - Nilai`)
  }
  headers.push('Total Nilai')
  
  // Build kunci jawaban row
  const kunciRow = ['', 'KUNCI JAWABAN', '']
  for (const soal of soalList.value) {
    let kunci = ''
    if (soal.tipe === 'PILIHAN_GANDA') {
      kunci = soal.data?.kunciJawaban || ''
    } else if (soal.tipe === 'BENAR_SALAH') {
      kunci = soal.data?.kunciJawaban === true ? 'Benar' : 'Salah'
    } else if (soal.tipe === 'ISIAN_SINGKAT') {
      kunci = (soal.data?.kunciJawaban || []).join(' / ')
    } else if (soal.tipe === 'ESSAY') {
      kunci = 'Manual'
    } else if (soal.tipe === 'PENCOCOKAN') {
      kunci = 'Lihat Detail'
    }
    kunciRow.push(kunci)
    kunciRow.push(String(soal.poin))
  }
  kunciRow.push('')
  
  // Build student rows
  const rows = jawabanList.value.map(item => {
    const row = [
      '', // NISN not available in jawabanList
      item.siswa?.nama || '',
      item.siswa?.kelas || '',
    ]
    
    for (const soal of soalList.value) {
      const jawaban = item.jawaban[soal.id]
      if (jawaban) {
        row.push(formatJawabanForCSV(jawaban.jawaban, soal.tipe))
        row.push(jawaban.nilai !== null ? String(jawaban.nilai) : (jawaban.benar ? String(soal.poin) : '0'))
      } else {
        row.push('-')
        row.push('-')
      }
    }
    
    row.push(item.totalNilai !== null ? String(item.totalNilai) : '-')
    return row
  })
  
  const csvContent = [
    headers.join(','),
    kunciRow.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
  
  toast.success('File CSV berhasil diunduh')
}

const formatJawabanForCSV = (jawabanData: any, tipe: string): string => {
  if (jawabanData === null || jawabanData === undefined) return '-'
  
  // Extract actual value - backend stores as { value: X } or { jawaban: X }
  let value = jawabanData
  if (typeof jawabanData === 'object' && jawabanData !== null) {
    if ('value' in jawabanData) value = jawabanData.value
    else if ('jawaban' in jawabanData) value = jawabanData.jawaban
  }
  
  // If value is still an object with nested structure, extract again
  if (typeof value === 'object' && value !== null) {
    if ('value' in value) value = value.value
    else if ('jawaban' in value) value = value.jawaban
    else if ('text' in value) value = value.text
  }
  
  if (tipe === 'PILIHAN_GANDA') {
    if (typeof value === 'string') return value
    return '-'
  }
  if (tipe === 'BENAR_SALAH') {
    if (value === true || value === 'true' || value === 'Benar') return 'Benar'
    if (value === false || value === 'false' || value === 'Salah') return 'Salah'
    return '-'
  }
  if (tipe === 'ISIAN_SINGKAT') {
    if (typeof value === 'string') return value
    return '-'
  }
  if (tipe === 'ESSAY') {
    let text = typeof value === 'string' ? value : JSON.stringify(value)
    // Strip HTML tags
    return text.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim() || '-'
  }
  if (tipe === 'PENCOCOKAN') {
    let pairs = jawabanData
    if (typeof jawabanData === 'object' && jawabanData !== null) {
      if ('value' in jawabanData) pairs = jawabanData.value
      else if ('jawaban' in jawabanData) pairs = jawabanData.jawaban
    }
    if (typeof pairs === 'object' && pairs !== null && !Array.isArray(pairs)) {
      const entries = Object.entries(pairs)
      if (entries.length === 0) return '-'
      return entries.map(([k, v]) => `${k}=${v}`).join('; ')
    }
    return '-'
  }
  return '-'
}

// ── Kategori Tab Computed ──
const TIPE_ORDER = ['PILIHAN_GANDA', 'BENAR_SALAH', 'ISIAN_SINGKAT', 'ESSAY', 'PENCOCOKAN'] as const
const TIPE_LABELS: Record<string, string> = {
  PILIHAN_GANDA: 'Pilihan Ganda',
  BENAR_SALAH: 'Benar/Salah',
  ISIAN_SINGKAT: 'Isian Singkat',
  ESSAY: 'Essay',
  PENCOCOKAN: 'Pencocokan',
}

const kategoriTypes = computed(() => {
  const counts: Record<string, number> = {}
  for (const s of soalList.value) {
    counts[s.tipe] = (counts[s.tipe] || 0) + 1
  }
  return TIPE_ORDER
    .filter(t => counts[t])
    .map(t => ({ tipe: t, label: TIPE_LABELS[t] || t, totalSoal: counts[t] }))
})

const kategoriData = computed(() => {
  // Build soal-id-to-tipe map
  const soalTipeMap: Record<string, string> = {}
  for (const s of soalList.value) {
    soalTipeMap[s.id] = s.tipe
  }

  return jawabanList.value.map(item => {
    const perTipe: Record<string, { benar: number; total: number }> = {}
    for (const cat of kategoriTypes.value) {
      perTipe[cat.tipe] = { benar: 0, total: cat.totalSoal }
    }

    for (const [soalId, jawaban] of Object.entries(item.jawaban) as [string, any][]) {
      const tipe = soalTipeMap[soalId]
      if (tipe && perTipe[tipe] && jawaban?.benar) {
        perTipe[tipe].benar++
      }
    }

    return {
      siswa: item.siswa,
      perTipe,
      totalNilai: item.totalNilai,
    }
  })
})

const exportKategoriCSV = async () => {
  if (jawabanList.value.length === 0 && soalList.value.length === 0) {
    await fetchJawaban()
  }
  if (jawabanList.value.length === 0) {
    toast.error('Tidak ada data untuk diexport')
    return
  }

  const selectedUjian = ujianList.value.find(u => u.id === filterUjian.value)
  const filename = `kategori_${selectedUjian?.judul?.replace(/\s+/g, '_') || 'ujian'}_${new Date().toISOString().split('T')[0]}.csv`

  const cats = kategoriTypes.value
  const headers = ['Nama', 'Kelas', ...cats.map(c => `${c.label} (${c.totalSoal} soal)`), 'Total Nilai']

  const rows = kategoriData.value.map(row => {
    const cells = [
      row.siswa.nama || '',
      row.siswa.kelas || '',
      ...cats.map(c => `${row.perTipe[c.tipe]?.benar ?? 0} dari ${c.totalSoal}`),
      row.totalNilai !== null && row.totalNilai !== undefined ? String(row.totalNilai) : '-',
    ]
    return cells
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)

  toast.success('File CSV Kategori berhasil diunduh')
}

watch(filterUjian, () => {
  filterKelas.value = ''
  activeTab.value = 'siswa'
  jawabanList.value = []
  soalList.value = []
  fetchNilai()
})

watch(filterKelas, () => {
  fetchNilai()
})

watch(activeTab, (newTab) => {
  if ((newTab === 'jawaban' || newTab === 'kategori') && jawabanList.value.length === 0 && filterUjian.value) {
    fetchJawaban()
  }
})

onMounted(async () => {
  try {
    await fetchUjian()
  } catch (err) {
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
