<template>
  <!-- Mobile Backdrop -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 bg-black/30 z-40 lg:hidden"
    @click="closeMobile"
  />

  <aside
    :class="[
      'fixed left-0 top-0 z-50 h-screen bg-white transition-all duration-300 ease-in-out flex flex-col overflow-hidden',
      isCollapsed ? 'w-[68px]' : 'w-[240px]',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
    style="border-right: 1px solid #eef0f4;"
  >
    <!-- Header / Logo -->
    <div :class="['flex items-center border-b border-gray-100', isCollapsed ? 'justify-center h-14 px-2' : 'h-14 px-4']">
      <div :class="['flex items-center gap-2.5 overflow-hidden', isCollapsed ? 'justify-center' : '']">
        <div class="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
          <Icon name="lucide:graduation-cap" class="w-4 h-4 text-white" />
        </div>
        <div
          :class="[
            'whitespace-nowrap transition-all duration-300 leading-tight',
            isCollapsed ? 'hidden' : 'opacity-100'
          ]"
        >
          <p class="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Platform</p>
          <p class="font-bold text-gray-900 text-sm -mt-0.5">{{ schoolName || 'Nilai Online' }}</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav :class="['flex-1 py-3 overflow-y-auto overflow-x-hidden', isCollapsed ? 'px-2' : 'px-3']">
      <p
        :class="[
          'px-2 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider transition-opacity duration-300',
          isCollapsed ? 'hidden' : 'opacity-100'
        ]"
      >
        Menu
      </p>
      <ul class="space-y-0.5">
        <li v-for="item in menuItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="[
              'flex items-center gap-2.5 h-10 rounded-lg text-[13px] font-medium transition-all duration-200',
              isCollapsed ? 'justify-center px-0' : 'px-2.5',
              isActive(item.to)
                ? 'bg-orange-50 text-orange-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                isActive(item.to) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
              ]"
            >
              <Icon :name="item.icon" class="w-4 h-4" />
            </div>
            <span
              :class="[
                'whitespace-nowrap transition-all duration-300',
                isCollapsed ? 'hidden' : 'opacity-100'
              ]"
            >
              {{ item.label }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Bottom Section -->
    <div :class="['border-t border-gray-100', isCollapsed ? 'p-2' : 'px-3 py-2']">
      <!-- Collapse Toggle -->
      <button
        @click="toggleSidebar"
        :class="[
          'w-full flex items-center gap-2.5 h-9 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors',
          isCollapsed ? 'justify-center px-0' : 'px-2.5'
        ]"
      >
        <Icon :name="isCollapsed ? 'lucide:panel-right-close' : 'lucide:panel-left-close'" class="w-4 h-4 flex-shrink-0" />
        <span
          :class="[
            'text-xs transition-all duration-300',
            isCollapsed ? 'hidden' : 'opacity-100'
          ]"
        >Collapse</span>
      </button>

      <!-- Logout -->
      <button
        @click="handleLogout"
        :class="[
          'w-full flex items-center gap-2.5 h-9 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors',
          isCollapsed ? 'justify-center px-0' : 'px-2.5'
        ]"
      >
        <Icon name="lucide:log-out" class="w-4 h-4 flex-shrink-0" />
        <span
          :class="[
            'text-xs transition-all duration-300',
            isCollapsed ? 'hidden' : 'opacity-100'
          ]"
        >Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface MenuItem {
  label: string
  icon: string
  to: string
}

const props = defineProps<{
  menuItems: MenuItem[]
  schoolName?: string
  userEmail?: string
}>()

const emit = defineEmits<{
  logout: []
  toggle: [collapsed: boolean]
}>()

const route = useRoute()
const isCollapsed = ref(false)
const mobileOpen = ref(false)

const isActive = (path: string) => {
  if (path === '/admin' || path === '/guru') {
    return route.path === path
  }
  return route.path.startsWith(path)
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggle', isCollapsed.value)
}

const openMobile = () => {
  mobileOpen.value = true
}

const closeMobile = () => {
  mobileOpen.value = false
}

const handleLogout = () => {
  emit('logout')
}

// Close mobile sidebar on route change
watch(() => route.path, () => {
  mobileOpen.value = false
})

defineExpose({
  isCollapsed,
  openMobile,
  closeMobile,
  mobileOpen
})
</script>
