<template>
  <div class="min-h-screen flex" style="background-color: #f8f9fb;">
    <!-- Left Side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 p-12 flex-col justify-between">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon name="lucide:graduation-cap" class="w-7 h-7 text-white" />
          </div>
          <span class="text-2xl font-bold text-white">Nilai Online</span>
        </div>
      </div>
      <div>
        <h1 class="text-4xl font-bold text-white mb-4">
          Selamat Datang di<br />Nilai Online
        </h1>
        <p class="text-white/80 text-lg">
          Platform ujian dan pembelajaran digital untuk siswa, guru, dan administrator sekolah.
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex -space-x-3">
          <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <Icon name="lucide:user" class="w-5 h-5 text-white" />
          </div>
          <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <Icon name="lucide:user" class="w-5 h-5 text-white" />
          </div>
          <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <Icon name="lucide:user" class="w-5 h-5 text-white" />
          </div>
        </div>
        <p class="text-white/80 text-sm">Bergabung dengan ribuan pengguna lainnya</p>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center justify-center gap-3 mb-8">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Icon name="lucide:graduation-cap" class="w-7 h-7 text-orange-600" />
          </div>
          <span class="text-2xl font-bold text-gray-900">Nilai Online</span>
        </div>

        <div class="bg-white rounded-2xl p-8 card-shadow">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900">Login Siswa</h2>
            <p class="text-gray-500 mt-2">Masuk dengan NISN untuk melanjutkan</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">NISN</label>
              <Input
                v-model="nisn"
                placeholder="Masukkan NISN Anda"
                icon="lucide:hash"
                size="lg"
                :disabled="isLoading"
              />
              <p class="text-xs text-gray-400">Nomor Induk Siswa Nasional</p>
            </div>

            <Button 
              type="submit" 
              class="w-full"
              size="lg"
              :loading="isLoading"
            >
              Masuk
            </Button>
          </form>

          <div class="mt-8 pt-6 border-t border-gray-100 text-center">
            <p class="text-sm text-gray-500">
              Bukan siswa?
              <NuxtLink 
                to="/login-admin" 
                class="text-orange-500 font-medium hover:text-orange-600"
              >
                Login sebagai Guru/Admin
              </NuxtLink>
            </p>
          </div>
        </div>

        <p class="text-center text-xs text-gray-400 mt-6">
          © 2025 PT Core Solution Digital. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Login Siswa',
})

const router = useRouter()
const nisn = ref('')
const isLoading = ref(false)
const schoolInfo = ref<any>(null)

onMounted(async () => {
  try {
    const response = await fetchApi('/api/school/info')
    const data = await response.json()
    if (data.success && data.data) {
      schoolInfo.value = data.data
    }
  } catch (err) {
    console.error('Error fetching school info:', err)
  }
})

const handleSubmit = async () => {
  if (!nisn.value) {
    toast.error('Masukkan NISN Anda')
    return
  }

  if (!/^\d+$/.test(nisn.value)) {
    toast.error('NISN harus berupa angka')
    return
  }

  isLoading.value = true
  try {
    const response = await fetchApi('/api/auth/siswa-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nisn: nisn.value }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      toast.success('Login berhasil!')
      navigateTo('/siswa')
    } else {
      toast.error(data.error || 'NISN tidak ditemukan')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error('Terjadi kesalahan saat login')
  } finally {
    isLoading.value = false
  }
}
</script>
