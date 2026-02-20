import { defineStore } from 'pinia'

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
  nama?: string
  schoolName?: string
  foto?: string
  profile: UserProfile | null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as SessionData | null,
    isLoading: true,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userRole: (state) => state.user?.role || null,
    userProfile: (state) => state.user?.profile || null,
  },

  actions: {
    setUser(user: SessionData | null) {
      this.user = user
    },
    setLoading(loading: boolean) {
      this.isLoading = loading
    },
    clearUser() {
      this.user = null
    },
  },
})
