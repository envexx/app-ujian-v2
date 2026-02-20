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
  if (path === '/admin') return 'Dashboard'
  if (path.includes('/siswa')) return 'Manajemen Siswa'
  if (path.includes('/guru')) return 'Manajemen Guru'
  if (path.includes('/kelas')) return 'Manajemen Kelas'
  if (path.includes('/mapel')) return 'Mata Pelajaran'
  if (path.includes('/token-ujian')) return 'Token Ujian'
  if (path.includes('/settings')) return 'Pengaturan'
  return 'Admin'
})

const userName = ref('Admin')
</script>
