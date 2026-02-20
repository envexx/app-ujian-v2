import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// Superadmin-specific fetch that uses the superadmin token
async function saFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const apiUrl = useRuntimeConfig().public.apiUrl || 'http://localhost:5000/api'
  // apiUrl already ends with /api, so we append /superadmin/...
  const baseUrl = String(apiUrl).replace(/\/api$/, '')
  const res = await fetch(`${baseUrl}/api/superadmin${path}`, { ...options, headers, credentials: 'include' })
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('superadmin_token')
      window.location.href = '/login-superadmin'
    }
    throw new Error('Unauthorized')
  }
  return res
}

async function saFetchJson(path: string, options: RequestInit = {}) {
  const res = await saFetch(path, options)
  return res.json()
}

// ── Auth ──
export function useSuperAdminAuth() {
  const isLoggedIn = ref(false)
  const user = ref<any>(null)
  const isChecking = ref(true)

  async function checkSession() {
    isChecking.value = true
    try {
      const data = await saFetchJson('/auth/session')
      isLoggedIn.value = data.isLoggedIn === true
      user.value = data.data || null
    } catch {
      isLoggedIn.value = false
      user.value = null
    } finally {
      isChecking.value = false
    }
  }

  async function login(email: string, password: string) {
    const res = await saFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (data.success && data.token) {
      localStorage.setItem('superadmin_token', data.token)
      isLoggedIn.value = true
      user.value = data.data
    }
    return data
  }

  async function logout() {
    try {
      await saFetch('/auth/logout', { method: 'POST' })
    } catch {}
    localStorage.removeItem('superadmin_token')
    isLoggedIn.value = false
    user.value = null
  }

  return { isLoggedIn, user, isChecking, checkSession, login, logout }
}

// ── Dashboard Stats ──
export function useSuperAdminStats() {
  return useQuery({
    queryKey: ['superadmin', 'stats'],
    queryFn: () => saFetchJson('/stats').then(d => d.data),
  })
}

// ── Schools ──
export function useSuperAdminSchools() {
  return useQuery({
    queryKey: ['superadmin', 'schools'],
    queryFn: () => saFetchJson('/schools').then(d => d.data),
  })
}

export function useSuperAdminSchoolDetail(id: Ref<string> | string) {
  const schoolId = isRef(id) ? id : ref(id)
  return useQuery({
    queryKey: ['superadmin', 'schools', schoolId],
    queryFn: () => saFetchJson(`/schools/${schoolId.value}`).then(d => d.data),
    enabled: () => !!schoolId.value,
  })
}

export function useCreateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: any) => saFetchJson('/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'schools'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'stats'] })
    },
  })
}

export function useUpdateSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: any) => saFetchJson(`/schools/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'schools'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'stats'] })
    },
  })
}

export function useDeleteSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => saFetchJson(`/schools/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'schools'] })
      qc.invalidateQueries({ queryKey: ['superadmin', 'stats'] })
    },
  })
}

// ── Tiers ──
export function useSuperAdminTiers() {
  return useQuery({
    queryKey: ['superadmin', 'tiers'],
    queryFn: () => saFetchJson('/tiers').then(d => d.data),
  })
}

export function useCreateTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: any) => saFetchJson('/tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'tiers'] })
    },
  })
}

export function useUpdateTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: any) => saFetchJson(`/tiers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'tiers'] })
    },
  })
}

export function useDeleteTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => saFetchJson(`/tiers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin', 'tiers'] })
    },
  })
}
