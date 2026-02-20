<template>
  <Modal
    v-model="isOpen"
    :title="title"
    :description="description"
    size="sm"
    :close-on-backdrop="false"
  >
    <div class="flex items-center justify-center py-4">
      <div :class="['w-16 h-16 rounded-full flex items-center justify-center', iconBgClass]">
        <Icon :name="iconName" :class="['w-8 h-8', iconClass]" />
      </div>
    </div>
    
    <p class="text-center text-gray-600 mb-6">{{ message }}</p>
    
    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <Button variant="outline" @click="cancel">
          {{ cancelText }}
        </Button>
        <Button :variant="confirmVariant" :loading="loading" @click="confirm">
          {{ confirmText }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  message: string
  type?: 'danger' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
  loading?: boolean
}>(), {
  title: 'Konfirmasi',
  type: 'danger',
  confirmText: 'Ya, Lanjutkan',
  cancelText: 'Batal',
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const iconName = computed(() => {
  const icons = {
    danger: 'lucide:trash-2',
    warning: 'lucide:alert-triangle',
    info: 'lucide:info'
  }
  return icons[props.type]
})

const iconBgClass = computed(() => {
  const classes = {
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100'
  }
  return classes[props.type]
})

const iconClass = computed(() => {
  const classes = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }
  return classes[props.type]
})

const confirmVariant = computed(() => {
  return props.type === 'danger' ? 'destructive' : 'default'
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
  isOpen.value = false
}
</script>
