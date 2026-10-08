import axios from 'axios'

/**
 * Resolve API base URL for local (relative / Vite proxy) and Vercel → Hostinger.
 * If Vercel env is only the Hostinger origin (no /api/v1), append it automatically.
 */
function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw || '/api/v1').trim().replace(/\/+$/, '')

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return value.startsWith('/') ? value : `/${value}`
  }

  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/+$/, '') || '/'

    if (path === '/' || path === '/api' || !path.includes('/api/v1')) {
      url.pathname = '/api/v1'
    }

    url.search = ''
    url.hash = ''
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return '/api/v1'
  }
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL as string | undefined,
)

/** Laravel `/api` root (unversioned), e.g. `/api` or `https://host/api`. */
export const API_ROOT_URL = API_BASE_URL.replace(/\/v1$/, '')

export const AUTH_TOKEN_KEY = 'basms_token'
export const AUTH_SESSION_KEY = 'basms_session'

/**
 * "Remember me" keeps the session in localStorage; otherwise sessionStorage,
 * so it ends when the browser closes.
 */
export const tokenStore = {
  get(): string | null {
    return (
      localStorage.getItem(AUTH_TOKEN_KEY) ??
      sessionStorage.getItem(AUTH_TOKEN_KEY)
    )
  },
  storage(): Storage {
    return localStorage.getItem(AUTH_TOKEN_KEY) ? localStorage : sessionStorage
  },
  set(token: string, remember: boolean): void {
    this.clear()
    ;(remember ? localStorage : sessionStorage).setItem(AUTH_TOKEN_KEY, token)
  },
  clear(): void {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(AUTH_TOKEN_KEY)
      store.removeItem(AUTH_SESSION_KEY)
    }
  },
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

function isAuthFormRequest(config: { url?: string }): boolean {
  const url = config.url ?? ''
  return url.includes('/login') || url.includes('/register')
}

api.interceptors.request.use(
  (config) => {
    if (isAuthFormRequest(config)) {
      delete config.headers.Authorization
      return config
    }

    const token = tokenStore.get()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !isAuthFormRequest(error.config ?? {})
    ) {
      tokenStore.clear()
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  },
)

export default api
