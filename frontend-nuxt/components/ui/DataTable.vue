<template>
  <div class="bg-white rounded-2xl overflow-hidden card-shadow">
    <!-- Header -->
    <div v-if="title || $slots.header" class="px-6 py-5 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <div>
          <h3 v-if="title" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
        </div>
        <slot name="header" />
      </div>
    </div>

    <!-- Search & Filters -->
    <div v-if="searchable || $slots.filters" class="px-6 py-4 border-b border-gray-100">
      <div class="flex items-center gap-4">
        <div v-if="searchable" class="relative flex-1 max-w-sm">
          <Icon name="lucide:search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
          />
        </div>
        <slot name="filters" />
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right'
              ]"
              :style="column.width ? { width: column.width } : {}"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(row, index) in paginatedData"
            :key="index"
            class="hover:bg-gray-50/50 transition-colors"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-4 text-sm',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right'
              ]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                <span class="text-gray-900">{{ row[column.key] ?? '-' }}</span>
              </slot>
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td :colspan="columns.length" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center">
                <Icon name="lucide:inbox" class="w-12 h-12 text-gray-300 mb-3" />
                <p class="text-gray-500">{{ emptyText }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="paginated && totalPages > 1" class="px-6 py-4 border-t border-gray-100">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">
          Menampilkan {{ startIndex + 1 }} - {{ endIndex }} dari {{ filteredData.length }} data
        </p>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
          </button>
          <div class="flex items-center gap-1">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-9 h-9 rounded-xl text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-orange-500 text-white'
                  : 'hover:bg-gray-100 text-gray-600'
              ]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

const props = withDefaults(defineProps<{
  columns: Column[]
  data: any[]
  title?: string
  subtitle?: string
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  paginated?: boolean
  pageSize?: number
  emptyText?: string
}>(), {
  searchable: false,
  searchPlaceholder: 'Cari...',
  searchKeys: () => [],
  paginated: true,
  pageSize: 10,
  emptyText: 'Tidak ada data'
})

const searchQuery = ref('')
const currentPage = ref(1)

const filteredData = computed(() => {
  if (!searchQuery.value || props.searchKeys.length === 0) {
    return props.data
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.data.filter(row => {
    return props.searchKeys.some(key => {
      const value = row[key]
      return value && String(value).toLowerCase().includes(query)
    })
  })
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / props.pageSize))

const startIndex = computed(() => (currentPage.value - 1) * props.pageSize)
const endIndex = computed(() => Math.min(startIndex.value + props.pageSize, filteredData.value.length))

const paginatedData = computed(() => {
  if (!props.paginated) return filteredData.value
  return filteredData.value.slice(startIndex.value, endIndex.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(() => props.data, () => {
  currentPage.value = 1
})
</script>
