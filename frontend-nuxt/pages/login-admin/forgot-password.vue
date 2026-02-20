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
        <div v-if="sent" class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:mail-check" class="w-8 h-8 text-green-600" />
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Email Terkirim</h2>
          <p class="text-gray-500 text-sm mb-6">
            Jika email terdaftar, kami telah mengirimkan link untuk reset password. Silakan cek inbox Anda.
          </p>
          <NuxtLink
            to="/login-admin"
            class="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            <Icon name="lucide:arrow-left" class="w-4 h-4" />
            Kembali ke Login
          </NuxtLink>
        </div>

        <!-- Form State -->
        <div v-else>
          <div class="text-center mb-8">
            <div class="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="lucide:key-round" class="w-7 h-7 text-orange-600" />
            </div>
            <h2 class="text-xl font-bold text-gray-900">Lupa Password?</h2>
            <p class="text-gray-500 mt-2 text-sm">
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
            </p>
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

            <Button
              type="submit"
              class="w-full"
              size="lg"
              :loading="isLoading"
            >
              Kirim Link Reset
            </Button>
          </form>

          <div class="mt-6 text-center">
            <NuxtLink
              to="/login-admin"
              class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <Icon name="lucide:arrow-left" class="w-4 h-4" />
              Kembali ke Login
            </NuxtLink>
          </div>
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
  title: 'Lupa Password',
})

const email = ref('')
const isLoading = ref(false)
const sent = ref(false)

const handleSubmit = async () => {
  if (!email.value) {
    toast.error('Masukkan email Anda')
    return
  }

  isLoading.value = true
  try {
    const response = await fetchApi('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })

    const data = await response.json()

    if (data.success) {
      sent.value = true
    } else {
      toast.error(data.error || 'Terjadi kesalahan')
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    toast.error('Terjadi kesalahan')
  } finally {
    isLoading.value = false
  }
}
</script>
