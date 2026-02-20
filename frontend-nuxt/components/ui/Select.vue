<template>
  <div class="relative">
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      :disabled="disabled"
      :class="[
        'w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        'transition-colors'
      ]"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <Icon
      name="lucide:chevron-down"
      class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
interface Option {
  label: string
  value: string | number
}

defineProps<{
  modelValue: string | number
  options: Option[]
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>
