<template>
  <h2 :class="cn('text-lg font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h2>
</template>

<script setup lang="ts">
interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {})
</script>
