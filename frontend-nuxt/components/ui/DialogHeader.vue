<template>
  <div :class="cn('flex flex-col space-y-1.5 text-center sm:text-left', props.class)">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {})
</script>
