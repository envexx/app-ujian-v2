<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Platform Notifications</h2>
        <p class="text-sm text-gray-500">Kelola notifikasi untuk semua pengguna platform</p>
      </div>
      <Button @click="showCreate = true" size="sm">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        Buat Notifikasi
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="lucide:loader-2" class="w-6 h-6 text-gray-400 animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="notifications.length === 0" class="text-center py-16 bg-white rounded-xl border border-gray-100">
      <Icon name="lucide:bell-off" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">Belum ada notifikasi platform</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', typeColor(notif.tipe)]">
              <Icon :name="typeIcon(notif.tipe)" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-sm font-semibold text-gray-900 truncate">{{ notif.judul }}</h3>
                <Badge :variant="notif.isPublished ? 'success' : 'default'" size="sm">
                  {{ notif.isPublished ? 'Published' : 'Draft' }}
                </Badge>
                <Badge variant="info" size="sm">{{ notif.tipe }}</Badge>
              </div>
              <p class="text-sm text-gray-500 line-clamp-2">{{ notif.pesan }}</p>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>Target: {{ notif.targetRole?.join(', ') || 'ALL' }}</span>
                <span>Priority: {{ notif.priority }}</span>
                <span v-if="notif.readCount">{{ notif.readCount }} dibaca</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              v-if="!notif.isPublished"
              @click="publishNotif(notif)"
              class="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
              title="Publish"
            >
              <Icon name="lucide:send" class="w-4 h-4" />
            </button>
            <button
              @click="deleteNotif(notif.id)"
              class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Hapus"
            >
              <Icon name="lucide:trash-2" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <Modal v-model="showCreate" title="Buat Notifikasi Baru">
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div class="space-y-2">
          <Label>Judul</Label>
          <Input v-model="form.judul" placeholder="Judul notifikasi" />
        </div>
        <div class="space-y-2">
          <Label>Pesan</Label>
          <textarea
            v-model="form.pesan"
            rows="4"
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Isi pesan notifikasi..."
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Tipe</Label>
            <select v-model="form.tipe" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="update">Update</option>
              <option value="maintenance">Maintenance</option>
              <option value="promo">Promo</option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Priority</Label>
            <select v-model="form.priority" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="form.isPublished" id="publish" class="rounded border-gray-300" />
          <label for="publish" class="text-sm text-gray-700">Langsung publish</label>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" @click="showCreate = false">Batal</Button>
          <Button type="submit" :loading="creating">Buat</Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'superadmin' })
useHead({ title: 'Platform Notifications' })

const loading = ref(true)
const creating = ref(false)
const showCreate = ref(false)
const notifications = ref<any[]>([])

const form = reactive({
  judul: '',
  pesan: '',
  tipe: 'info',
  priority: 'normal',
  targetRole: ['ALL'],
  isPublished: false,
})

const typeIcon = (tipe: string) => {
  const icons: Record<string, string> = {
    info: 'lucide:info', warning: 'lucide:alert-triangle', update: 'lucide:sparkles',
    maintenance: 'lucide:wrench', promo: 'lucide:gift',
  }
  return icons[tipe] || 'lucide:info'
}

const typeColor = (tipe: string) => {
  const colors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600', warning: 'bg-amber-100 text-amber-600',
    update: 'bg-green-100 text-green-600', maintenance: 'bg-red-100 text-red-600',
    promo: 'bg-purple-100 text-purple-600',
  }
  return colors[tipe] || 'bg-blue-100 text-blue-600'
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null
    const apiUrl = String(useRuntimeConfig().public.apiUrl || 'http://localhost:5000/api').replace(/\/api$/, '')
    const res = await fetch(`${apiUrl}/api/superadmin/notifications`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    })
    const data = await res.json()
    if (data.success) notifications.value = data.data || []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!form.judul || !form.pesan) {
    toast.error('Judul dan pesan wajib diisi')
    return
  }
  creating.value = true
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null
    const apiUrl = String(useRuntimeConfig().public.apiUrl || 'http://localhost:5000/api').replace(/\/api$/, '')
    const res = await fetch(`${apiUrl}/api/superadmin/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Notifikasi berhasil dibuat')
      showCreate.value = false
      form.judul = ''
      form.pesan = ''
      form.tipe = 'info'
      form.priority = 'normal'
      form.isPublished = false
      await fetchNotifications()
    } else {
      toast.error(data.error || 'Gagal membuat notifikasi')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    creating.value = false
  }
}

const publishNotif = async (notif: any) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null
    const apiUrl = String(useRuntimeConfig().public.apiUrl || 'http://localhost:5000/api').replace(/\/api$/, '')
    const res = await fetch(`${apiUrl}/api/superadmin/notifications/${notif.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      credentials: 'include',
      body: JSON.stringify({ isPublished: true }),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Notifikasi dipublish')
      await fetchNotifications()
    }
  } catch (err) {
    toast.error('Gagal publish')
  }
}

const deleteNotif = async (id: string) => {
  if (!confirm('Hapus notifikasi ini?')) return
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null
    const apiUrl = String(useRuntimeConfig().public.apiUrl || 'http://localhost:5000/api').replace(/\/api$/, '')
    const res = await fetch(`${apiUrl}/api/superadmin/notifications/${id}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Notifikasi dihapus')
      notifications.value = notifications.value.filter(n => n.id !== id)
    }
  } catch (err) {
    toast.error('Gagal menghapus')
  }
}

onMounted(fetchNotifications)
</script>
