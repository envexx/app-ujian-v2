<template>
  <div class="flex items-center justify-center">
    <div
      :class="cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        props.class
      )"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}
</script>
