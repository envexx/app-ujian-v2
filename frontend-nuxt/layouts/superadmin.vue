<template>
  <div class="min-h-screen" style="background-color: #f8f9fb;">
    <!-- Mobile Backdrop -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/30 z-40 lg:hidden"
      @click="mobileOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed left-0 top-0 z-50 h-screen bg-white transition-all duration-300 ease-in-out flex flex-col overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[240px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
      style="border-right: 1px solid #eef0f4;"
    >
      <!-- Logo -->
      <div :class="['flex items-center border-b border-gray-100', collapsed ? 'justify-center h-14 px-2' : 'h-14 px-4']">
        <div :class="['flex items-center gap-2.5 overflow-hidden', collapsed ? 'justify-center' : '']">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Icon name="lucide:shield" class="w-4 h-4 text-white" />
          </div>
          <div :class="['whitespace-nowrap leading-tight', collapsed ? 'hidden' : '']">
            <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Super Admin</p>
            <p class="font-bold text-gray-900 text-sm -mt-0.5">Nilai Online</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav :class="['flex-1 py-3 overflow-y-auto overflow-x-hidden', collapsed ? 'px-2' : 'px-3']">
        <p :class="['px-2 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider', collapsed ? 'hidden' : '']">
          Menu
        </p>
        <ul class="space-y-0.5">
          <li v-for="item in menuItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              :class="[
                'flex items-center gap-2.5 h-10 rounded-lg text-[13px] font-medium transition-all duration-200',
                collapsed ? 'justify-center px-0' : 'px-2.5',
                isActive(item.to)
                  ? 'bg-indigo-100 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              ]"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                  isActive(item.to) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                ]"
              >
                <Icon :name="item.icon" class="w-4 h-4" />
              </div>
              <span :class="['whitespace-nowrap', collapsed ? 'hidden' : '']">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Bottom -->
      <div :class="['border-t border-gray-100', collapsed ? 'p-2' : 'px-3 py-2']">
        <button
          @click="collapsed = !collapsed"
          :class="['w-full flex items-center gap-2.5 h-9 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors', collapsed ? 'justify-center px-0' : 'px-2.5']"
        >
          <Icon :name="collapsed ? 'lucide:panel-right-close' : 'lucide:panel-left-close'" class="w-4 h-4 flex-shrink-0" />
          <span :class="['text-xs', collapsed ? 'hidden' : '']">Collapse</span>
        </button>
        <button
          @click="handleLogout"
          :class="['w-full flex items-center gap-2.5 h-9 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors', collapsed ? 'justify-center px-0' : 'px-2.5']"
        >
          <Icon name="lucide:log-out" class="w-4 h-4 flex-shrink-0" />
          <span :class="['text-xs', collapsed ? 'hidden' : '']">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div :class="['transition-all duration-300 min-h-screen', collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]']">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white h-14" style="border-bottom: 1px solid #eef0f4;">
        <div class="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-3 min-w-0">
            <button class="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors" @click="mobileOpen = true">
              <Icon name="lucide:menu" class="w-5 h-5 text-gray-600" />
            </button>
            <div class="min-w-0">
              <h1 class="text-base font-semibold text-gray-900 truncate">{{ pageTitle }}</h1>
              <p class="text-xs text-gray-400 truncate hidden sm:block">{{ pageDescription }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Icon name="lucide:shield-check" class="w-4 h-4 text-indigo-600" />
              </div>
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium text-gray-900 leading-tight">{{ userName }}</p>
                <p class="text-[11px] text-gray-400">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <Toaster position="top-right" :rich-colors="true" />
  </div>
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner'

const route = useRoute()
const { user, isLoggedIn, isChecking, checkSession, logout } = useSuperAdminAuth()

const collapsed = ref(false)
const mobileOpen = ref(false)

const userName = computed(() => user.value?.nama || 'Super Admin')

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/superadmin': 'Dashboard',
    '/superadmin/schools': 'Manajemen Sekolah',
    '/superadmin/schools/create': 'Tambah Sekolah',
    '/superadmin/tiers': 'Paket Langganan',
    '/superadmin/notifications': 'Platform Notifications',
    '/superadmin/smtp': 'Email Configuration',
  }
  return titles[route.path] || 'Super Admin'
})

const pageDescription = computed(() => {
  const desc: Record<string, string> = {
    '/superadmin': 'Overview platform multi-tenant',
    '/superadmin/schools': 'Kelola semua sekolah terdaftar',
    '/superadmin/schools/create': 'Daftarkan sekolah baru',
    '/superadmin/tiers': 'Kelola paket dan batasan fitur',
    '/superadmin/notifications': 'Kelola notifikasi untuk semua pengguna',
    '/superadmin/smtp': 'Konfigurasi email Resend/SMTP',
  }
  return desc[route.path] || ''
})

const menuItems = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/superadmin' },
  { label: 'Sekolah', icon: 'lucide:school', to: '/superadmin/schools' },
  { label: 'Paket', icon: 'lucide:crown', to: '/superadmin/tiers' },
  { label: 'Notifikasi', icon: 'lucide:bell', to: '/superadmin/notifications' },
  { label: 'Email Config', icon: 'lucide:mail-cog', to: '/superadmin/smtp' },
]

const isActive = (path: string) => {
  if (path === '/superadmin') return route.path === '/superadmin'
  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await logout()
  navigateTo('/login-superadmin')
}

onMounted(async () => {
  await checkSession()
  if (!isLoggedIn.value) {
    navigateTo('/login-superadmin')
  }
})
</script>
