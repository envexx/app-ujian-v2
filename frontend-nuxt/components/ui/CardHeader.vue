<template>
  <div
    :class="cn(
      'grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6',
      props.class
    )"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {})
</script>
