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
          Portal Guru &<br />Administrator
        </h1>
        <p class="text-white/80 text-lg">
          Kelola pembelajaran, ujian, dan data siswa dengan mudah melalui dashboard yang intuitif.
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
        <p class="text-white/80 text-sm">Tim pengajar yang berdedikasi</p>
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
            <h2 class="text-2xl font-bold text-gray-900">Login Guru/Admin</h2>
            <p class="text-gray-500 mt-2">Masuk dengan email dan password</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Email</label>
              <Input
                v-model="email"
                type="email"
                placeholder="Masukkan email Anda"
                icon="lucide:mail"
                size="lg"
                :disabled="isLoading"
              />
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Password</label>
              <div class="relative">
                <Input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password"
                  icon="lucide:lock"
                  size="lg"
                  :disabled="isLoading"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="flex items-center justify-end">
              <NuxtLink
                to="/login-admin/forgot-password"
                class="text-sm text-orange-500 hover:text-orange-600"
              >
                Lupa Password?
              </NuxtLink>
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
              Siswa?
              <NuxtLink 
                to="/" 
                class="text-orange-500 font-medium hover:text-orange-600"
              >
                Login dengan NISN
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
  alias: ['/admin-guru'],
})

useHead({
  title: 'Login Admin/Guru',
})

const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
  if (!email.value || !password.value) {
    return
  }

  isLoading.value = true
  try {
    const response = await fetchApi('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      toast.success('Login berhasil')
      const role = result.data.role.toLowerCase()
      window.location.href = `/${role}`
    } else {
      toast.error(result.error || 'Login gagal')
    }
  } catch (error) {
    console.error('Login error:', error)
    toast.error('Terjadi kesalahan saat login')
  } finally {
    isLoading.value = false
  }
}
</script>
