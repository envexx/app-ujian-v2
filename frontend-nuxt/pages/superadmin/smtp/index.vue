<template>
  <div>
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900">Email Configuration</h2>
      <p class="text-sm text-gray-500">Konfigurasi layanan email untuk reset password dan notifikasi</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="lucide:loader-2" class="w-6 h-6 text-gray-400 animate-spin" />
    </div>

    <div v-else class="max-w-xl">
      <div class="bg-white rounded-xl border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Icon name="lucide:mail" class="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Resend API</h3>
            <p class="text-xs text-gray-500">Menggunakan Resend HTTP API untuk mengirim email</p>
          </div>
        </div>

        <form @submit.prevent="handleSave" class="space-y-4">
          <div class="space-y-2">
            <Label>Host</Label>
            <Input v-model="form.host" placeholder="api.resend.com" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Port</Label>
              <Input v-model.number="form.port" type="number" placeholder="443" />
            </div>
            <div class="space-y-2">
              <Label>Secure</Label>
              <select v-model="form.secure" class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option :value="true">Yes (SSL/TLS)</option>
                <option :value="false">No</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <Label>API Key / Password</Label>
            <Input v-model="form.pass" type="password" placeholder="re_xxxxxxxx" />
            <p class="text-xs text-gray-400">Resend API Key (dimulai dengan re_)</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>From Name</Label>
              <Input v-model="form.fromName" placeholder="Nilai Online" />
            </div>
            <div class="space-y-2">
              <Label>From Email</Label>
              <Input v-model="form.fromEmail" placeholder="noreply@nilai.online" />
            </div>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100">
            <Button type="submit" :loading="saving">
              <Icon name="lucide:save" class="w-4 h-4 mr-1.5" />
              Simpan Konfigurasi
            </Button>
          </div>
        </form>
      </div>

      <!-- Status -->
      <div v-if="currentConfig" class="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
        <div class="flex items-center gap-2">
          <Icon name="lucide:check-circle" class="w-5 h-5 text-green-600" />
          <span class="text-sm font-medium text-green-800">Email sudah dikonfigurasi</span>
        </div>
        <p class="text-xs text-green-600 mt-1">
          {{ currentConfig.fromName }} &lt;{{ currentConfig.fromEmail }}&gt; via {{ currentConfig.host }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'superadmin' })
useHead({ title: 'Email Configuration' })

const loading = ref(true)
const saving = ref(false)
const currentConfig = ref<any>(null)

const form = reactive({
  host: 'api.resend.com',
  port: 443,
  secure: true,
  user: 'resend',
  pass: '',
  fromName: 'Nilai Online',
  fromEmail: 'noreply@nilai.online',
})

function getSAHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function getBaseUrl() {
  return String(useRuntimeConfig().public.apiUrl || 'http://localhost:5000/api').replace(/\/api$/, '')
}

const fetchConfig = async () => {
  loading.value = true
  try {
    const res = await fetch(`${getBaseUrl()}/api/superadmin/smtp`, {
      headers: getSAHeaders(),
      credentials: 'include',
    })
    const data = await res.json()
    if (data.success && data.data) {
      currentConfig.value = data.data
      form.host = data.data.host || 'api.resend.com'
      form.port = data.data.port || 443
      form.secure = data.data.secure ?? true
      form.fromName = data.data.fromName || 'Nilai Online'
      form.fromEmail = data.data.fromEmail || 'noreply@nilai.online'
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = await fetch(`${getBaseUrl()}/api/superadmin/smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getSAHeaders() },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Konfigurasi email berhasil disimpan')
      currentConfig.value = data.data
    } else {
      toast.error(data.error || 'Gagal menyimpan')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    saving.value = false
  }
}

onMounted(fetchConfig)
</script>
