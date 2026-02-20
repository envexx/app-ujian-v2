<template>
  <div class="relative">
    <button
      @click="open = !open"
      class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <Icon name="lucide:bell" class="w-5 h-5 text-gray-500" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-900">Notifikasi</h3>
          <span v-if="unreadCount > 0" class="text-xs text-orange-500 font-medium">
            {{ unreadCount }} belum dibaca
          </span>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <div v-if="loading" class="p-6 text-center">
            <Icon name="lucide:loader-2" class="w-5 h-5 text-gray-400 animate-spin mx-auto" />
          </div>

          <div v-else-if="notifications.length === 0" class="p-6 text-center">
            <Icon name="lucide:bell-off" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p class="text-sm text-gray-400">Tidak ada notifikasi</p>
          </div>

          <div v-else>
            <button
              v-for="notif in notifications"
              :key="notif.id"
              @click="markAsRead(notif)"
              :class="[
                'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                !notif.isRead ? 'bg-orange-50/50' : ''
              ]"
            >
              <div class="flex items-start gap-3">
                <div
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                    typeStyles[notif.tipe]?.bg || 'bg-blue-100'
                  ]"
                >
                  <Icon
                    :name="typeStyles[notif.tipe]?.icon || 'lucide:info'"
                    :class="['w-4 h-4', typeStyles[notif.tipe]?.text || 'text-blue-600']"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ notif.judul }}</p>
                  <p class="text-xs text-gray-500 line-clamp-2 mt-0.5">{{ notif.pesan }}</p>
                  <p class="text-[10px] text-gray-400 mt-1">{{ formatTime(notif.publishedAt) }}</p>
                </div>
                <div v-if="!notif.isRead" class="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Click outside to close -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />
  </div>
</template>

<script setup lang="ts">
interface PlatformNotification {
  id: string
  judul: string
  pesan: string
  tipe: string
  priority: string
  publishedAt: string
  isRead: boolean
}

const open = ref(false)
const loading = ref(false)
const notifications = ref<PlatformNotification[]>([])
const unreadCount = ref(0)

const typeStyles: Record<string, { bg: string; text: string; icon: string }> = {
  info: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'lucide:info' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'lucide:alert-triangle' },
  update: { bg: 'bg-green-100', text: 'text-green-600', icon: 'lucide:sparkles' },
  maintenance: { bg: 'bg-red-100', text: 'text-red-600', icon: 'lucide:wrench' },
  promo: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'lucide:gift' },
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} jam lalu`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const response = await fetchApi('/api/notifications/platform')
    const data = await response.json()
    if (data.success) {
      notifications.value = data.data || []
      unreadCount.value = data.unreadCount || 0
    }
  } catch (err) {
    console.error('Error fetching notifications:', err)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (notif: PlatformNotification) => {
  if (notif.isRead) return
  try {
    await fetchApi('/api/notifications/platform/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: notif.id }),
    })
    notif.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (err) {
    console.error('Error marking notification:', err)
  }
}

onMounted(() => {
  fetchNotifications()
})

// Refresh every 60 seconds
let interval: ReturnType<typeof setInterval>
onMounted(() => {
  interval = setInterval(fetchNotifications, 60000)
})
onUnmounted(() => {
  clearInterval(interval)
})
</script>
