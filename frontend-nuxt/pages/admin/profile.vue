<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Profile Card -->
    <div class="bg-white rounded-2xl card-shadow overflow-hidden">
      <!-- Cover -->
      <div class="h-32 bg-gradient-to-r from-orange-400 to-orange-600"></div>
      
      <!-- Profile Info -->
      <div class="px-4 sm:px-6 pb-6">
        <div class="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
          <!-- Avatar -->
          <div class="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0">
            <div class="w-full h-full rounded-xl bg-orange-100 flex items-center justify-center">
              <Icon name="lucide:shield-check" class="w-10 h-10 text-orange-600" />
            </div>
          </div>
          
          <!-- Name & Info -->
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-gray-900">{{ profile.schoolName || 'Administrator' }}</h2>
            <p class="text-gray-500 truncate">{{ profile.email }}</p>
            <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{{ profile.role }}</span>
          </div>
          
          <!-- Stats -->
          <div class="flex gap-4 sm:gap-6 flex-shrink-0">
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">{{ profile.stats?.totalSiswa || 0 }}</p>
              <p class="text-xs text-gray-500">Siswa</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">{{ profile.stats?.totalGuru || 0 }}</p>
              <p class="text-xs text-gray-500">Guru</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">{{ profile.stats?.totalUjian || 0 }}</p>
              <p class="text-xs text-gray-500">Ujian</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- School Information -->
      <div class="bg-white rounded-2xl card-shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Informasi Sekolah</h3>
          <button 
            v-if="!isEditingProfile"
            @click="startEditProfile"
            class="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Edit
          </button>
        </div>

        <form v-if="isEditingProfile" @submit.prevent="saveProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
            <input 
              v-model="editForm.schoolName"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <input 
              v-model="editForm.schoolAlamat"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
            <input 
              v-model="editForm.schoolNoTelp"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Sekolah</label>
            <input 
              v-model="editForm.schoolEmail"
              type="email"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Login</label>
            <input 
              :value="profile.email"
              type="email"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
              disabled
            />
            <p class="text-xs text-gray-400 mt-1">Email login tidak dapat diubah</p>
          </div>
          <div class="flex gap-3 pt-2">
            <Button type="submit" :loading="isSavingProfile" class="flex-1">Simpan</Button>
            <Button type="button" variant="outline" @click="cancelEditProfile">Batal</Button>
          </div>
        </form>

        <div v-else class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:school" class="w-5 h-5 text-orange-600" />
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-500">Nama Sekolah</p>
              <p class="font-medium text-gray-900 truncate">{{ profile.schoolName || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:map-pin" class="w-5 h-5 text-blue-600" />
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-500">Alamat</p>
              <p class="font-medium text-gray-900 truncate">{{ profile.schoolAlamat || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:phone" class="w-5 h-5 text-green-600" />
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-500">No. Telepon</p>
              <p class="font-medium text-gray-900">{{ profile.schoolNoTelp || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Icon name="lucide:mail" class="w-5 h-5 text-purple-600" />
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-500">Email</p>
              <p class="font-medium text-gray-900 truncate">{{ profile.email || '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Password -->
      <div class="bg-white rounded-2xl card-shadow p-6">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Icon name="lucide:lock" class="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Ubah Password</h3>
            <p class="text-sm text-gray-500">Perbarui password akun Anda</p>
          </div>
        </div>

        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
            <div class="relative">
              <input 
                v-model="passwordForm.oldPassword"
                :type="showOldPassword ? 'text' : 'password'"
                class="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
              />
              <button 
                type="button"
                @click="showOldPassword = !showOldPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon :name="showOldPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <div class="relative">
              <input 
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                class="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
                minlength="6"
              />
              <button 
                type="button"
                @click="showNewPassword = !showNewPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon :name="showNewPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <div class="relative">
              <input 
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                class="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                required
                minlength="6"
              />
              <button 
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Icon :name="showConfirmPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>
          <Button 
            type="submit" 
            :loading="isChangingPassword"
            class="w-full"
            variant="outline"
          >
            <Icon name="lucide:key" class="w-4 h-4 mr-2" />
            Ubah Password
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'admin',
})

useHead({
  title: 'Profil Admin',
})

const authStore = useAuthStore()

const isEditingProfile = ref(false)
const isSavingProfile = ref(false)
const isChangingPassword = ref(false)

const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const profile = ref<any>({
  email: '',
  role: '',
  schoolName: '',
  schoolAlamat: '',
  schoolNoTelp: '',
  schoolEmail: '',
  stats: {},
})

const editForm = ref({
  schoolName: '',
  schoolAlamat: '',
  schoolNoTelp: '',
  schoolEmail: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const fetchProfile = async () => {
  try {
    const response = await fetchApi('/api/admin/profile')
    const data = await response.json()
    if (data.success) {
      profile.value = data.data
    }
  } catch (err) {
    console.error('Error fetching profile:', err)
  }
}

const startEditProfile = () => {
  editForm.value = {
    schoolName: profile.value.schoolName || '',
    schoolAlamat: profile.value.schoolAlamat || '',
    schoolNoTelp: profile.value.schoolNoTelp || '',
    schoolEmail: profile.value.schoolEmail || '',
  }
  isEditingProfile.value = true
}

const saveProfile = async () => {
  isSavingProfile.value = true
  try {
    const response = await fetchApi('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm.value),
    })
    const data = await response.json()
    if (data.success) {
      toast.success('Profil berhasil diperbarui')
      profile.value.schoolName = editForm.value.schoolName
      profile.value.schoolAlamat = editForm.value.schoolAlamat
      profile.value.schoolNoTelp = editForm.value.schoolNoTelp
      profile.value.schoolEmail = editForm.value.schoolEmail
      isEditingProfile.value = false
    } else {
      toast.error(data.error || 'Gagal memperbarui profil')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isSavingProfile.value = false
  }
}

const cancelEditProfile = () => {
  isEditingProfile.value = false
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('Konfirmasi password tidak cocok')
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    toast.error('Password minimal 6 karakter')
    return
  }

  isChangingPassword.value = true
  try {
    const response = await fetchApi('/api/admin/profile/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: passwordForm.value.oldPassword,
        newPassword: passwordForm.value.newPassword,
      }),
    })
    const data = await response.json()
    
    if (data.success) {
      toast.success('Password berhasil diubah')
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      toast.error(data.error || 'Gagal mengubah password')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan')
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>
