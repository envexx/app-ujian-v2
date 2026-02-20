<template>
  <div class="relative">
    <Icon
      v-if="icon"
      :name="icon"
      class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
    />
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="[
        'flex w-full rounded-xl border border-gray-200 bg-white text-sm transition-all duration-200',
        'placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500',
        'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50',
        icon ? 'pl-11 pr-4' : 'px-4',
        sizeClasses
      ]"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: string
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  icon?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  type: 'text',
  size: 'md'
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'h-8 py-1.5',
    md: 'h-10 py-2',
    lg: 'h-12 py-3'
  }
  return sizes[props.size]
})
</script>
