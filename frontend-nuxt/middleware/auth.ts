export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for public routes
  const publicRoutes = ['/', '/login-admin', '/admin-guru', '/login-admin/forgot-password', '/login-superadmin', '/reset-password']
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Superadmin routes handle their own auth via layout + composable
  if (to.path.startsWith('/superadmin')) {
    return
  }

  // Check if we're on client side
  if (import.meta.client) {
    try {
      const response = await fetch(getApiUrl('/api/auth/session'), {
        credentials: 'include',
      })

      if (response.status === 401) {
        // Redirect based on path
        if (to.path.startsWith('/siswa')) {
          return navigateTo('/')
        }
        return navigateTo('/login-admin')
      }

      const data = await response.json()
      
      if (!data.success || !data.isLoggedIn) {
        if (to.path.startsWith('/siswa')) {
          return navigateTo('/')
        }
        return navigateTo('/login-admin')
      }

      // Check role-based access
      const role = data.data?.role?.toLowerCase()
      
      if (to.path.startsWith('/admin') && role !== 'admin') {
        return navigateTo(`/${role}`)
      }
      
      if (to.path.startsWith('/guru') && role !== 'guru') {
        return navigateTo(`/${role}`)
      }
      
      if (to.path.startsWith('/siswa') && role !== 'siswa') {
        return navigateTo(`/${role}`)
      }
    } catch (error) {
      console.error('Auth middleware error:', error)
      if (to.path.startsWith('/siswa')) {
        return navigateTo('/')
      }
      return navigateTo('/login-admin')
    }
  }
})

function getApiUrl(path: string): string {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiUrl as string
  const cleanPath = path.replace(/^\/api/, '')
  return `${baseUrl}${cleanPath}`
}
