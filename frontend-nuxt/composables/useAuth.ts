import { toast } from 'vue-sonner'

interface UserProfile {
  id: string
  nama?: string
  nis?: string
  nisn?: string
  nip?: string
  kelasId?: string
  kelas?: any
  jenisKelamin?: string
  foto?: string
  email?: string
  mapel?: any[]
  role?: string
}

interface SessionData {
  userId: string
  email: string
  role: 'ADMIN' | 'GURU' | 'SISWA'
  profile: UserProfile | null
}

interface SessionResponse {
  success: boolean
  isLoggedIn: boolean
  data: SessionData | null
}

export const useAuth = (requireAuth = true) => {
  const router = useRouter()
  const user = ref<SessionData | null>(null)
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  const fetchSession = async () => {
    try {
      isLoading.value = true
      const response = await fetchApi('/api/auth/session')

      if (response.status === 401) {
        user.value = null
        return
      }

      const data: SessionResponse = await response.json()
      if (data.success && data.isLoggedIn) {
        user.value = data.data
      } else {
        user.value = null
      }
    } catch (err) {
      error.value = err as Error
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        await fetchSession()
        toast.success('Login berhasil')

        const role = result.data.role.toLowerCase()
        window.location.href = `/${role}`

        return { success: true, data: result.data }
      } else {
        toast.error(result.error || 'Login gagal')
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error('Terjadi kesalahan saat login')
      return { success: false, error: 'Terjadi kesalahan saat login' }
    }
  }

  const logout = async () => {
    try {
      const response = await fetchApi('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        user.value = null
        toast.success('Logout berhasil')
        window.location.href = '/login-admin'
        return { success: true }
      } else {
        toast.error('Logout gagal')
        return { success: false }
      }
    } catch (err) {
      console.error('Logout error:', err)
      toast.error('Terjadi kesalahan saat logout')
      return { success: false }
    }
  }

  onMounted(() => {
    fetchSession()
  })

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refresh: fetchSession,
  }
}

export const useRequireRole = (allowedRoles: Array<'ADMIN' | 'GURU' | 'SISWA'>) => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  watch([user, isLoading], ([userData, loading]) => {
    if (!loading && userData && !allowedRoles.includes(userData.role)) {
      router.push(`/${userData.role.toLowerCase()}`)
    }
  })

  return { user, isLoading }
}

export const useUserId = () => {
  const { user, isLoading } = useAuth()

  return {
    userId: computed(() => user.value?.userId || null),
    profileId: computed(() => user.value?.profile?.id || null),
    isLoading,
  }
}
