<template>
  <header class="sticky top-0 z-40 bg-background border-b border-border px-6 py-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold text-foreground">
        {{ pageTitle }}
      </h1>
      
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground">
          {{ userName }}
        </span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()

const pageTitle = computed(() => {
  const path = route.path
  if (path === '/guru') return 'Dashboard'
  if (path.includes('/ujian')) return 'Manajemen Ujian'
  if (path.includes('/bank-soal')) return 'Bank Soal'
  if (path.includes('/nilai')) return 'Nilai Siswa'
  if (path.includes('/settings')) return 'Pengaturan'
  return 'Guru'
})

const userName = ref('Guru')
</script>
