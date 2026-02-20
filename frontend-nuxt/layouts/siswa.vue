<template>
  <div class="min-h-screen bg-gray-50">
    <slot />
    <Toaster position="top-right" :rich-colors="true" />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>
