<template>
  <header class="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
    <div class="max-w-lg mx-auto flex items-center justify-between">
      <NuxtLink to="/siswa" class="flex items-center gap-2">
        <img
          src="/icon/logo-no-bg-png-blue.png"
          alt="Logo"
          class="h-8 w-8 object-contain"
        />
        <span class="font-semibold text-gray-900">Nilai Online</span>
      </NuxtLink>
      
      <button
        @click="handleLogout"
        class="text-sm text-gray-500 hover:text-gray-700"
      >
        Keluar
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

const handleLogout = async () => {
  try {
    const response = await fetchApi('/api/auth/logout', {
      method: 'POST',
    })
    
    if (response.ok) {
      toast.success('Logout berhasil')
      window.location.href = '/'
    }
  } catch (error) {
    toast.error('Gagal logout')
  }
}
</script>
