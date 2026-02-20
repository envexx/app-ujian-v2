<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
  >
    <Icon v-if="loading" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
    <Icon v-else-if="icon" :name="icon" :class="['w-4 h-4', $slots.default ? 'mr-2' : '']" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
        link: 'text-orange-500 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: NonNullable<ButtonVariants['variant']>
  size?: NonNullable<ButtonVariants['size']>
  disabled?: boolean
  loading?: boolean
  icon?: string
}>(), {
  type: 'button',
  variant: 'default',
  size: 'default',
  disabled: false,
  loading: false,
})

const buttonClasses = computed(() => buttonVariants({ variant: props.variant, size: props.size }))
</script>
