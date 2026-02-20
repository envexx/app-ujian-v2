<template>
  <div class="min-h-screen flex items-center justify-center p-8" style="background-color: #f8f9fb;">
    <div class="w-full max-w-md">
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <Icon name="lucide:graduation-cap" class="w-7 h-7 text-orange-600" />
        </div>
        <span class="text-2xl font-bold text-gray-900">Nilai Online</span>
      </div>

      <div class="bg-white rounded-2xl p-8 card-shadow">
        <!-- Success State -->
        <div v-if="success" class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:check-circle" class="w-8 h-8 text-green-600" />
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Password Berhasil Direset</h2>
          <p class="text-gray-500 text-sm mb-6">
            Password Anda telah berhasil diubah. Silakan login dengan password baru.
          </p>
          <NuxtLink to="/login-admin">
            <Button class="w-full" size="lg">
              Login Sekarang
            </Button>
          </NuxtLink>
        </div>

        <!-- Invalid Token -->
        <div v-else-if="invalidToken" class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:alert-circle" class="w-8 h-8 text-red-600" />
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Link Tidak Valid</h2>
          <p class="text-gray-500 text-sm mb-6">
            Link reset password tidak valid atau sudah expired. Silakan request ulang.
          </p>
          <NuxtLink to="/login-admin/forgot-password">
            <Button class="w-full" size="lg" variant="outline">
              Request Ulang
            </Button>
          </NuxtLink>
        </div>

        <!-- Form State -->
        <div v-else>
          <div class="text-center mb-8">
            <div class="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="lucide:lock-keyhole" class="w-7 h-7 text-orange-600" />
            </div>
            <h2 class="text-xl font-bold text-gray-900">Reset Password</h2>
            <p class="text-gray-500 mt-2 text-sm">Masukkan password baru Anda</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Password Baru</label>
              <div class="relative">
                <Input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Minimal 6 karakter"
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

            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">Konfirmasi Password</label>
              <div class="relative">
                <Input
                  v-model="confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  placeholder="Ulangi password baru"
                  icon="lucide:lock"
                  size="lg"
                  :disabled="isLoading"
                />
                <button
                  type="button"
                  @click="showConfirm = !showConfirm"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon :name="showConfirm ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button
              type="submit"
              class="w-full"
              size="lg"
              :loading="isLoading"
            >
              Reset Password
            </Button>
          </form>
        </div>
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
  title: 'Reset Password',
})

const route = useRoute()
const token = computed(() => route.query.token as string || '')

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const isLoading = ref(false)
const success = ref(false)
const invalidToken = ref(false)

onMounted(() => {
  if (!token.value) {
    invalidToken.value = true
  }
})

const handleSubmit = async () => {
  if (!password.value || !confirmPassword.value) {
    toast.error('Isi semua field')
    return
  }

  if (password.value.length < 6) {
    toast.error('Password minimal 6 karakter')
    return
  }

  if (password.value !== confirmPassword.value) {
    toast.error('Password tidak cocok')
    return
  }

  isLoading.value = true
  try {
    const response = await fetchApi('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value, password: password.value }),
    })

    const data = await response.json()

    if (data.success) {
      success.value = true
    } else {
      if (data.error?.includes('expired') || data.error?.includes('tidak valid')) {
        invalidToken.value = true
      } else {
        toast.error(data.error || 'Terjadi kesalahan')
      }
    }
  } catch (error) {
    console.error('Reset password error:', error)
    toast.error('Terjadi kesalahan')
  } finally {
    isLoading.value = false
  }
}
</script>
