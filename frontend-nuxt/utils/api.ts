export function getApiUrl(path: string): string {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiUrl as string
  const cleanPath = path.replace(/^\/api/, '')
  return `${baseUrl}${cleanPath}`
}

export interface FetchApiOptions extends RequestInit {
  skipAuth?: boolean
}

export async function fetchApi(
  path: string,
  options: FetchApiOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options

  const url = path.startsWith('/api') ? getApiUrl(path) : path

  const existingHeaders = options.headers || {}
  const headers: Record<string, string> = {}

  if (existingHeaders instanceof Headers) {
    existingHeaders.forEach((value, key) => {
      headers[key] = value
    })
  } else if (Array.isArray(existingHeaders)) {
    existingHeaders.forEach(([key, value]) => {
      headers[key] = value
    })
  } else {
    Object.assign(headers, existingHeaders)
  }

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })
}

export async function fetchApiJson<T = any>(
  path: string,
  options: FetchApiOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  try {
    const response = await fetchApi(path, options)
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401 && import.meta.client) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login-admin'
      }

      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        status: response.status,
      }
    }

    return { success: true, data, status: response.status }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    }
  }
}
