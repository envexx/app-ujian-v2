<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-900 mb-4">{{ error?.statusCode || 500 }}</h1>
      <p class="text-xl text-gray-600 mb-8">{{ errorMessage }}</p>
      <Button @click="handleError">
        Kembali ke Beranda
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NuxtError {
  statusCode?: number
  message?: string
}

const props = defineProps<{
  error: NuxtError
}>()

const errorMessage = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Halaman tidak ditemukan'
  }
  return props.error?.message || 'Terjadi kesalahan'
})

const handleError = () => {
  clearError({ redirect: '/' })
}
</script>
