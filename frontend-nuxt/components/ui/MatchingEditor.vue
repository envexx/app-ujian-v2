<template>
  <div class="matching-editor">
    <!-- Header Row -->
    <div class="grid grid-cols-2 gap-6 mb-4">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">Item Kiri</Label>
        <button 
          type="button"
          @click="addItem('kiri')"
          class="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded-lg"
        >
          <Icon name="lucide:plus" class="w-3.5 h-3.5" />
          Tambah
        </button>
      </div>
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">Item Kanan</Label>
        <button 
          type="button"
          @click="addItem('kanan')"
          class="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded-lg"
        >
          <Icon name="lucide:plus" class="w-3.5 h-3.5" />
          Tambah
        </button>
      </div>
    </div>

    <!-- Items Grid -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Left Items -->
      <div class="space-y-3">
        <div 
          v-for="(item, idx) in localItemKiri" 
          :key="item.id"
          class="relative group"
        >
          <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div 
              :ref="el => setItemRef('kiri', item.id, el)"
              :class="[
                'w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold cursor-pointer transition-all shrink-0 select-none',
                selectedItem?.id === item.id && selectedItem?.side === 'kiri'
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200 scale-110' 
                  : isKiriConnected(item.id) 
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-300 hover:scale-105'
              ]"
              @click="handleItemClick(item.id, 'kiri')"
            >
              {{ idx + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <TiptapEditor 
                :modelValue="item.text"
                @update:modelValue="(val: string) => updateItem('kiri', idx, val)"
                placeholder="Ketik item kiri..."
                mini
              />
            </div>
            <button
              type="button"
              @click="removeItem('kiri', idx)"
              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="Hapus item"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Right Items -->
      <div class="space-y-3">
        <div 
          v-for="(item, idx) in localItemKanan" 
          :key="item.id"
          class="relative group"
        >
          <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div 
              :ref="el => setItemRef('kanan', item.id, el)"
              :class="[
                'w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold cursor-pointer transition-all shrink-0 select-none',
                selectedItem?.id === item.id && selectedItem?.side === 'kanan'
                  ? 'bg-green-500 text-white ring-4 ring-green-200 scale-110' 
                  : isKananConnected(item.id) 
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-300 hover:scale-105',
                selectedItem && selectedItem.side !== 'kanan' ? 'ring-2 ring-orange-300' : ''
              ]"
              @click="handleItemClick(item.id, 'kanan')"
            >
              {{ String.fromCharCode(65 + idx) }}
            </div>
            <div class="flex-1 min-w-0">
              <TiptapEditor 
                :modelValue="item.text"
                @update:modelValue="(val: string) => updateItem('kanan', idx, val)"
                placeholder="Ketik item kanan..."
                mini
              />
            </div>
            <button
              type="button"
              @click="removeItem('kanan', idx)"
              class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="Hapus item"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Indicator -->
    <div v-if="selectedItem" class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
      <div class="flex items-center gap-2 text-sm text-orange-700">
        <Icon name="lucide:info" class="w-4 h-4" />
        <span>
          Item <strong>{{ selectedItem.side === 'kiri' ? (getKiriIndex(selectedItem.id) + 1) : String.fromCharCode(65 + getKananIndex(selectedItem.id)) }}</strong> dipilih. 
          Klik item di {{ selectedItem.side === 'kiri' ? 'kolom kanan' : 'kolom kiri' }} untuk menghubungkan.
        </span>
        <button @click="selectedItem = null" class="ml-auto text-orange-500 hover:text-orange-700">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Connection Legend -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600">
          <span class="font-medium">Kunci Jawaban:</span>
          <span class="ml-2 text-gray-500">Klik nomor/huruf dari salah satu sisi, lalu klik sisi lainnya</span>
        </div>
        <button 
          v-if="Object.keys(localJawaban).length > 0"
          type="button"
          @click="clearAllConnections"
          class="text-xs text-red-500 hover:text-red-600"
        >
          Reset Semua
        </button>
      </div>
      
      <!-- Connection Summary -->
      <div v-if="allConnections.length > 0" class="flex flex-wrap gap-2 mt-3">
        <div 
          v-for="conn in allConnections" 
          :key="`conn-${conn.kiriId}-${conn.kananId}`"
          class="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg text-sm"
        >
          <span class="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded text-xs font-medium">
            {{ getKiriIndex(conn.kiriId) + 1 }}
          </span>
          <Icon name="lucide:arrow-right" class="w-3 h-3 text-orange-500" />
          <span class="w-5 h-5 flex items-center justify-center bg-green-500 text-white rounded text-xs font-medium">
            {{ String.fromCharCode(65 + getKananIndex(conn.kananId)) }}
          </span>
          <button 
            type="button"
            @click="removeSingleConnection(conn.kiriId, conn.kananId)"
            class="ml-1 text-gray-400 hover:text-red-500"
          >
            <Icon name="lucide:x" class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MatchItem {
  id: string
  text: string
}

// Connection is stored as array of {kiriId, kananId} pairs
// This allows multiple connections per item
interface Connection {
  kiriId: string
  kananId: string
}

const props = defineProps<{
  itemKiri: MatchItem[]
  itemKanan: MatchItem[]
  jawaban: Record<string, string | string[]> // Support both old format and new array format
}>()

const emit = defineEmits<{
  'update:itemKiri': [value: MatchItem[]]
  'update:itemKanan': [value: MatchItem[]]
  'update:jawaban': [value: Record<string, string[]>]
}>()

const selectedItem = ref<{ id: string; side: 'kiri' | 'kanan' } | null>(null)
const itemRefs = ref<Record<string, HTMLElement | null>>({})

// Local copies for reactivity
const localItemKiri = ref<MatchItem[]>([...props.itemKiri])
const localItemKanan = ref<MatchItem[]>([...props.itemKanan])

// Convert jawaban to new format (arrays)
const normalizeJawaban = (jawaban: Record<string, string | string[]>): Record<string, string[]> => {
  const result: Record<string, string[]> = {}
  for (const [kiriId, value] of Object.entries(jawaban)) {
    if (Array.isArray(value)) {
      result[kiriId] = value
    } else if (value) {
      result[kiriId] = [value]
    }
  }
  return result
}

const localJawaban = ref<Record<string, string[]>>(normalizeJawaban(props.jawaban))

// Watch for prop changes
watch(() => props.itemKiri, (val) => { localItemKiri.value = [...val] }, { deep: true })
watch(() => props.itemKanan, (val) => { localItemKanan.value = [...val] }, { deep: true })
watch(() => props.jawaban, (val) => { localJawaban.value = normalizeJawaban(val) }, { deep: true })

const setItemRef = (side: 'kiri' | 'kanan', id: string, el: any) => {
  if (el) {
    itemRefs.value[`${side}-${id}`] = el
  }
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const addItem = (side: 'kiri' | 'kanan') => {
  const newItem = { id: generateId(), text: '' }
  if (side === 'kiri') {
    localItemKiri.value.push(newItem)
    emit('update:itemKiri', localItemKiri.value)
  } else {
    localItemKanan.value.push(newItem)
    emit('update:itemKanan', localItemKanan.value)
  }
}

const removeItem = (side: 'kiri' | 'kanan', idx: number) => {
  if (side === 'kiri') {
    const removedId = localItemKiri.value[idx].id
    localItemKiri.value.splice(idx, 1)
    // Remove any connections from this item
    if (localJawaban.value[removedId]) {
      delete localJawaban.value[removedId]
      emit('update:jawaban', { ...localJawaban.value })
    }
    emit('update:itemKiri', localItemKiri.value)
  } else {
    const removedId = localItemKanan.value[idx].id
    localItemKanan.value.splice(idx, 1)
    // Remove this item from all connections
    for (const kiriId of Object.keys(localJawaban.value)) {
      const connections = localJawaban.value[kiriId]
      const filtered = connections.filter(id => id !== removedId)
      if (filtered.length === 0) {
        delete localJawaban.value[kiriId]
      } else {
        localJawaban.value[kiriId] = filtered
      }
    }
    emit('update:jawaban', { ...localJawaban.value })
    emit('update:itemKanan', localItemKanan.value)
  }
}

const updateItem = (side: 'kiri' | 'kanan', idx: number, text: string) => {
  if (side === 'kiri') {
    localItemKiri.value[idx].text = text
    emit('update:itemKiri', localItemKiri.value)
  } else {
    localItemKanan.value[idx].text = text
    emit('update:itemKanan', localItemKanan.value)
  }
}

// Check if a connection exists between kiri and kanan
const hasConnection = (kiriId: string, kananId: string): boolean => {
  return localJawaban.value[kiriId]?.includes(kananId) || false
}

// Get all kanan IDs connected to a kiri item
const getConnectedKanan = (kiriId: string): string[] => {
  return localJawaban.value[kiriId] || []
}

// Get all kiri IDs connected to a kanan item
const getConnectedKiriForKanan = (kananId: string): string[] => {
  const result: string[] = []
  for (const [kiriId, kananIds] of Object.entries(localJawaban.value)) {
    if (kananIds.includes(kananId)) {
      result.push(kiriId)
    }
  }
  return result
}

// Handle click on either side - bidirectional selection with toggle
const handleItemClick = (id: string, side: 'kiri' | 'kanan') => {
  if (!selectedItem.value) {
    // First selection
    selectedItem.value = { id, side }
  } else if (selectedItem.value.id === id && selectedItem.value.side === side) {
    // Clicked same item - deselect
    selectedItem.value = null
  } else if (selectedItem.value.side === side) {
    // Clicked same side - switch selection
    selectedItem.value = { id, side }
  } else {
    // Clicked opposite side - toggle connection
    let kiriId: string
    let kananId: string
    
    if (selectedItem.value.side === 'kiri') {
      kiriId = selectedItem.value.id
      kananId = id
    } else {
      kiriId = id
      kananId = selectedItem.value.id
    }
    
    // Toggle connection
    if (hasConnection(kiriId, kananId)) {
      // Remove connection
      const connections = localJawaban.value[kiriId].filter(id => id !== kananId)
      if (connections.length === 0) {
        delete localJawaban.value[kiriId]
      } else {
        localJawaban.value[kiriId] = connections
      }
    } else {
      // Add connection
      if (!localJawaban.value[kiriId]) {
        localJawaban.value[kiriId] = []
      }
      localJawaban.value[kiriId].push(kananId)
    }
    
    emit('update:jawaban', { ...localJawaban.value })
    selectedItem.value = null
  }
}

const getConnectedKiri = (kananId: string): string | null => {
  for (const [kiriId, kananIds] of Object.entries(localJawaban.value)) {
    if (kananIds.includes(kananId)) return kiriId
  }
  return null
}

// Check if kanan item has any connections
const isKananConnected = (kananId: string): boolean => {
  return getConnectedKiriForKanan(kananId).length > 0
}

// Check if kiri item has any connections
const isKiriConnected = (kiriId: string): boolean => {
  return (localJawaban.value[kiriId]?.length || 0) > 0
}

// Get all connections as flat array for display
const allConnections = computed(() => {
  const result: { kiriId: string; kananId: string }[] = []
  for (const [kiriId, kananIds] of Object.entries(localJawaban.value)) {
    for (const kananId of kananIds) {
      result.push({ kiriId, kananId })
    }
  }
  return result
})

const removeSingleConnection = (kiriId: string, kananId: string) => {
  const connections = localJawaban.value[kiriId]?.filter(id => id !== kananId) || []
  if (connections.length === 0) {
    delete localJawaban.value[kiriId]
  } else {
    localJawaban.value[kiriId] = connections
  }
  emit('update:jawaban', { ...localJawaban.value })
}

const removeConnection = (kiriId: string) => {
  delete localJawaban.value[kiriId]
  emit('update:jawaban', { ...localJawaban.value })
}

const clearAllConnections = () => {
  localJawaban.value = {}
  emit('update:jawaban', {})
}

const getKiriIndex = (id: string) => localItemKiri.value.findIndex(item => item.id === id)
const getKananIndex = (id: string) => localItemKanan.value.findIndex(item => item.id === id)

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.matching-editor')) {
    selectedItem.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Force re-render lines when items change
const forceUpdate = ref(0)
watch([localItemKiri, localItemKanan, localJawaban], () => {
  forceUpdate.value++
}, { deep: true })
</script>

<style scoped>
.matching-editor {
  @apply relative p-4 bg-white border border-gray-200 rounded-xl;
}

/* Make connection area visible */
.matching-editor :deep(svg) {
  overflow: visible;
}

/* Ensure items align properly */
.matching-editor :deep(.tiptap-editor) {
  @apply border-gray-200;
}

.matching-editor :deep(.tiptap-mini .ProseMirror) {
  @apply min-h-[50px] text-sm;
}
</style>
