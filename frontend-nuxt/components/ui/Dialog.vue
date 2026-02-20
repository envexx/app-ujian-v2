<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="fixed inset-0 bg-black/50"
          @click="$emit('update:modelValue', false)"
        />
        <div
          :class="cn(
            'relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg',
            props.class
          )"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  class?: string
}

const props = defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
