<template>
  <aside class="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
    <div class="p-4 border-b border-sidebar-border">
      <NuxtLink to="/admin" class="flex items-center gap-2">
        <img
          src="/icon/logo-no-bg-png-blue.png"
          alt="Logo"
          class="h-8 w-8 object-contain"
        />
        <span class="font-semibold text-sidebar-foreground">Admin Panel</span>
      </NuxtLink>
    </div>
    
    <nav class="flex-1 p-4 space-y-1">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.href"
        :to="item.href"
        :class="[
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive(item.href)
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        ]"
      >
        <Icon :name="item.icon" class="w-5 h-5" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
    
    <div class="p-4 border-t border-sidebar-border">
      <button
        @click="handleLogout"
        class="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <Icon name="ph:sign-out" class="w-5 h-5" />
        <span>Keluar</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

const route = useRoute()

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: 'ph:house-duotone' },
  { href: '/admin/siswa', label: 'Siswa', icon: 'ph:users-duotone' },
  { href: '/admin/guru', label: 'Guru', icon: 'ph:chalkboard-teacher-duotone' },
  { href: '/admin/kelas', label: 'Kelas', icon: 'ph:buildings-duotone' },
  { href: '/admin/mapel', label: 'Mata Pelajaran', icon: 'ph:book-open-duotone' },
  { href: '/admin/token-ujian', label: 'Token Ujian', icon: 'ph:key-duotone' },
  { href: '/admin/settings', label: 'Pengaturan', icon: 'ph:gear-duotone' },
]

const isActive = (href: string) => {
  if (href === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(href)
}

const handleLogout = async () => {
  try {
    const response = await fetchApi('/api/auth/logout', {
      method: 'POST',
    })
    
    if (response.ok) {
      toast.success('Logout berhasil')
      window.location.href = '/login-admin'
    }
  } catch (error) {
    toast.error('Gagal logout')
  }
}
</script>
