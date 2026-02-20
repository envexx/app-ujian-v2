<template>
  <div class="min-h-screen" style="background-color: #f8f9fb;">
    <!-- Sidebar -->
    <Sidebar
      :menu-items="menuItems"
      :school-name="schoolName"
      @logout="handleLogout"
      @toggle="handleSidebarToggle"
      ref="sidebarRef"
    />

    <!-- Main Content -->
    <div
      :class="[
        'transition-all duration-300 ease-in-out min-h-screen',
        sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
      ]"
    >
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white h-14" style="border-bottom: 1px solid #eef0f4;">
        <div class="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Mobile hamburger -->
            <button
              class="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              @click="sidebarRef?.openMobile()"
            >
              <Icon name="lucide:menu" class="w-5 h-5 text-gray-600" />
            </button>
            <div class="min-w-0">
              <h1 class="text-base font-semibold text-gray-900 truncate">{{ pageTitle }}</h1>
              <p class="text-xs text-gray-400 truncate hidden sm:block">{{ pageDescription }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <NotificationBell />
            <!-- User Profile - Clickable -->
            <NuxtLink
              to="/admin/profile"
              class="flex items-center gap-2.5 pl-3 border-l border-gray-200 hover:bg-gray-50 -my-1 py-1 pr-2 rounded-lg transition-colors cursor-pointer"
            >
              <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Icon name="lucide:shield-check" class="w-4 h-4 text-orange-600" />
              </div>
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium text-gray-900 leading-tight">{{ userName }}</p>
                <p class="text-[11px] text-gray-400">Admin</p>
              </div>
              <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
            </NuxtLink>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- Toast -->
    <Toaster position="top-right" :rich-colors="true" />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'

const route = useRoute()
const authStore = useAuthStore()

const sidebarRef = ref()
const sidebarCollapsed = ref(false)

const userName = computed(() => authStore.user?.nama || 'Admin')
const schoolName = computed(() => authStore.user?.schoolName || 'Nilai Online')

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/siswa': 'Manajemen Siswa',
    '/admin/guru': 'Manajemen Guru',
    '/admin/kelas': 'Manajemen Kelas',
    '/admin/mapel': 'Mata Pelajaran',
    '/admin/ujian': 'Manajemen Ujian',
    '/admin/profile': 'Profil Admin',
  }
  return titles[route.path] || 'Admin Panel'
})

const pageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    '/admin': 'Selamat datang di panel administrasi',
    '/admin/siswa': 'Kelola data siswa dengan mudah',
    '/admin/guru': 'Kelola data guru dan pengajar',
    '/admin/kelas': 'Atur kelas dan pembagian siswa',
    '/admin/mapel': 'Kelola mata pelajaran',
    '/admin/ujian': 'Kelola ujian dan ujian susulan',
    '/admin/profile': 'Kelola profil dan keamanan akun',
  }
  return descriptions[route.path] || ''
})

const menuItems = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/admin' },
  { label: 'Ujian', icon: 'lucide:file-text', to: '/admin/ujian' },
  { label: 'Siswa', icon: 'lucide:users', to: '/admin/siswa' },
  { label: 'Guru', icon: 'lucide:graduation-cap', to: '/admin/guru' },
  { label: 'Kelas', icon: 'lucide:school', to: '/admin/kelas' },
  { label: 'Mata Pelajaran', icon: 'lucide:book-open', to: '/admin/mapel' },
]

const handleSidebarToggle = (collapsed: boolean) => {
  sidebarCollapsed.value = collapsed
}

const handleLogout = async () => {
  try {
    const response = await fetchApi('/api/auth/logout', {
      method: 'POST',
    })
    
    if (response.ok) {
      window.location.href = '/login-admin'
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>
