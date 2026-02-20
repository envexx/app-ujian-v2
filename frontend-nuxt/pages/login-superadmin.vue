<template>
  <div class="min-h-screen flex" style="background-color: #f8f9fb;">
    <!-- Left Side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-between">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon name="lucide:shield" class="w-7 h-7 text-white" />
          </div>
          <span class="text-2xl font-bold text-white">Super Admin</span>
        </div>
      </div>
      <div>
        <h1 class="text-4xl font-bold text-white mb-4">
          Platform<br />Management
        </h1>
        <p class="text-white/80 text-lg">
          Kelola seluruh sekolah, paket langganan, dan konfigurasi platform dari satu dashboard terpusat.
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex -space-x-3">
          <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <Icon name="lucide:school" class="w-5 h-5 text-white" />
          </div>
          <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <Icon name="lucide:school" class="w-5 h-5 text-white" />
          </div>
          <div class="w-10 h-10 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
            <Icon name="lucide:school" class="w-5 h-5 text-white" />
          </div>
        </div>
        <p class="text-white/80 text-sm">Multi-tenant school management</p>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center justify-center gap-3 mb-8">
          <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Icon name="lucide:shield" class="w-7 h-7 text-indigo-600" />
          </div>
          <span class="text-2xl font-bold text-gray-900">Super Admin</span>
        </div>

        <div class="bg-white rounded-2xl p-8 card-shadow">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900">Login Super Admin</h2>
            <p class="text-gray-500 mt-2">Akses manajemen platform</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Email</label>
              <input
                v-model="email"
                type="email"
                placeholder="superadmin@platform.com"
                class="w-full h-11 px-4 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                :disabled="isLoading"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Password</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Masukkan password"
                  class="w-full h-11 px-4 pr-12 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon v-if="isLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              {{ isLoading ? 'Memproses...' : 'Masuk' }}
            </button>
          </form>

          <div v-if="errorMsg" class="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
            {{ errorMsg }}
          </div>
        </div>

        <p class="text-center text-xs text-gray-400 mt-6">
          © 2025 PT Core Solution Digital. Super Admin Access.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Login Super Admin',
})

const { login, isLoggedIn, checkSession } = useSuperAdminAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  await checkSession()
  if (isLoggedIn.value) {
    navigateTo('/superadmin')
  }
})

const handleSubmit = async () => {
  if (!email.value || !password.value) return
  isLoading.value = true
  errorMsg.value = ''

  try {
    const result = await login(email.value, password.value)
    if (result.success) {
      navigateTo('/superadmin')
    } else {
      errorMsg.value = result.error || 'Login gagal'
    }
  } catch (err) {
    errorMsg.value = 'Terjadi kesalahan saat login'
  } finally {
    isLoading.value = false
  }
}
</script>
