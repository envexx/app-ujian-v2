<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Profile Card -->
    <div class="bg-white rounded-2xl card-shadow overflow-hidden">
      <!-- Cover -->
      <div class="h-32 bg-gradient-to-r from-orange-400 to-orange-600"></div>
      
      <!-- Profile Info -->
      <div class="px-6 pb-6">
        <div class="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
          <!-- Avatar -->
          <div class="relative">
            <div class="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
              <div class="w-full h-full rounded-xl bg-orange-100 flex items-center justify-center overflow-hidden">
                <img 
                  v-if="profile.foto" 
                  :src="profile.foto" 
                  :alt="profile.nama"
                  class="w-full h-full object-cover"
                />
                <Icon v-else name="lucide:user" class="w-10 h-10 text-orange-600" />
              </div>
            </div>
            <label 
              class="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-md"
            >
              <Icon name="lucide:camera" class="w-4 h-4" />
              <input 
                type="file" 
                accept="image/*" 
                class="hidden" 
                @change="handlePhotoUpload"
                :disabled="isUploadingPhoto"
              />
            </label>
          </div>
          
          <!-- Name & Info -->
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900">{{ profile.nama }}</h2>
            <p class="text-gray-500">{{ profile.email }}</p>
          </div>
          
          <!-- Stats -->
          <div class="flex gap-6">
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalUjian }}</p>
              <p class="text-xs text-gray-500">Ujian</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalSoal }}</p>
              <p class="text-xs text-gray-500">Soal</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Profile Information -->
      <div class="bg-white rounded-2xl card-shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Informasi Profil</h3>
          <button 
            v-if="!isEditingProfile"
            @click="isEditingProfile = true"
            class="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            Edit
          </button>
        </div>

        <form v-if="isEditingProfile" @submit.prevent="saveProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input 
              v-model="editForm.nama"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">NIP</label>
            <input 
              v-model="editForm.nip"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              v-model="editForm.email"
              type="email"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"
              disabled
            />
            <p class="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
          </div>
          <div class="flex gap-3 pt-2">
            <Button 
              type="submit" 
              :loading="isSavingProfile"
              class="flex-1"
            >
              Simpan
            </Button>
            <Button 
              type="button" 
              variant="outline"
              @click="cancelEditProfile"
            >
              Batal
            </Button>
          </div>
        </form>

        <div v-else class="space-y-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Icon name="lucide:user" class="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p class="text-xs text-gray-500">Nama Lengkap</p>
              <p class="font-medium text-gray-900">{{ profile.nama }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Icon name="lucide:id-card" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="text-xs text-gray-500">NIP</p>
              <p class="font-medium text-gray-900">{{ profile.nip || '-' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Icon name="lucide:mail" class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-xs text-gray-500">Email</p>
              <p class="font-medium text-gray-900">{{ profile.email }}</p>
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
  layout: 'guru',
})

useHead({
  title: 'Profil Saya',
})

const authStore = useAuthStore()

const isEditingProfile = ref(false)
const isSavingProfile = ref(false)
const isUploadingPhoto = ref(false)
const isChangingPassword = ref(false)

const showOldPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const profile = ref({
  nama: '',
  email: '',
  nip: '',
  foto: '',
})

const stats = ref({
  totalUjian: 0,
  totalSoal: 0,
})

const editForm = ref({
  nama: '',
  nip: '',
  email: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const fetchProfile = async () => {
  try {
    const response = await fetchApi('/api/guru/profile')
    const data = await response.json()
    if (data.success) {
      profile.value = {
        nama: data.data.nama || '',
        email: data.data.email || '',
        nip: data.data.nip || '',
        foto: data.data.foto || '',
      }
      stats.value = {
        totalUjian: data.data.totalUjian || 0,
        totalSoal: data.data.totalSoal || 0,
      }
      editForm.value = {
        nama: profile.value.nama,
        nip: profile.value.nip,
        email: profile.value.email,
      }
    }
  } catch (err) {
    console.error('Error fetching profile:', err)
  }
}

const saveProfile = async () => {
  isSavingProfile.value = true
  try {
    const response = await fetchApi('/api/guru/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama: editForm.value.nama,
        nip: editForm.value.nip,
      }),
    })
    const data = await response.json()
    if (data.success) {
      toast.success('Profil berhasil diperbarui')
      profile.value.nama = editForm.value.nama
      profile.value.nip = editForm.value.nip
      isEditingProfile.value = false
      // Update auth store
      if (authStore.user) {
        authStore.user.nama = editForm.value.nama
      }
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
  editForm.value = {
    nama: profile.value.nama,
    nip: profile.value.nip,
    email: profile.value.email,
  }
  isEditingProfile.value = false
}

const handlePhotoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Ukuran file maksimal 2MB')
    return
  }

  isUploadingPhoto.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetchApi('/api/upload', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    
    if (data.success && data.data?.url) {
      // Update profile photo
      const updateResponse = await fetchApi('/api/guru/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto: data.data.url }),
      })
      const updateData = await updateResponse.json()
      
      if (updateData.success) {
        toast.success('Foto profil berhasil diperbarui')
        profile.value.foto = data.data.url
        if (authStore.user) {
          authStore.user.foto = data.data.url
        }
      } else {
        toast.error('Gagal memperbarui foto profil')
      }
    } else {
      toast.error('Gagal mengupload foto')
    }
  } catch (err) {
    toast.error('Terjadi kesalahan saat upload')
  } finally {
    isUploadingPhoto.value = false
    input.value = ''
  }
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
    const response = await fetchApi('/api/guru/profile/password', {
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
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      }
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
