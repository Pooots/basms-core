import type {
  AccountSession,
  LoginCredentials,
  LoginResponse,
} from '@/types/auth'
import api, { AUTH_SESSION_KEY, tokenStore } from '@/lib/api'

function persistSession(session: AccountSession): void {
  tokenStore
    .storage()
    .setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ type: session.type, user: session.user }),
    )
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    tokenStore.clear()
    const { data } = await api.post<LoginResponse>('/admin/login', credentials)
    tokenStore.set(data.access_token, credentials.remember)
    persistSession(data)
    return data
  },

  async me(): Promise<AccountSession> {
    const { data } = await api.get<AccountSession>('/admin/me')
    persistSession(data)
    return data
  },

  async logout(): Promise<void> {
    try {
      if (this.isAuthenticated()) await api.post('/admin/logout')
    } catch {
      // Token may already be expired; the local session is cleared either way.
    } finally {
      tokenStore.clear()
    }
  },

  getSession(): AccountSession | null {
    const raw = tokenStore.storage().getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AccountSession
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return Boolean(tokenStore.get())
  },

  isAdmin(): boolean {
    return this.isAuthenticated() && this.getSession()?.type === 'admin'
  },
}
