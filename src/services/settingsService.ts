import type {
  DigestType,
  NotificationKey,
  NotificationListResponse,
  PaymentMethod,
  ProfilePayload,
  SettingsResponse,
} from '@/types/settings'
import api, { API_ROOT_URL } from '@/lib/api'

type SettingsUpdate = SettingsResponse & { message: string }

/** Resolves an `/api/...` path against the API host (relative in dev, absolute in production). */
export function apiAssetUrl(path: string): string {
  return path.startsWith('/api/')
    ? `${API_ROOT_URL.replace(/\/api$/, '')}${path}`
    : path
}

export const settingsService = {
  async get(): Promise<SettingsResponse> {
    const { data } = await api.get<SettingsResponse>('/admin/settings')
    return data
  },

  async updateProfile(payload: ProfilePayload): Promise<SettingsUpdate> {
    const { data } = await api.put<SettingsUpdate>(
      '/admin/settings/profile',
      payload,
    )
    return data
  },

  async uploadLogo(file: File): Promise<SettingsUpdate> {
    const form = new FormData()
    form.append('logo', file)
    const { data } = await api.post<SettingsUpdate>(
      '/admin/settings/logo',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  async removeLogo(): Promise<SettingsUpdate> {
    const { data } = await api.delete<SettingsUpdate>('/admin/settings/logo')
    return data
  },

  async updatePayments(method: PaymentMethod): Promise<SettingsUpdate> {
    const { data } = await api.put<SettingsUpdate>('/admin/settings/payments', {
      method,
    })
    return data
  },

  async updateNotifications(
    changes: Partial<Record<NotificationKey, boolean>>,
  ): Promise<SettingsUpdate> {
    const { data } = await api.put<SettingsUpdate>(
      '/admin/settings/notifications',
      changes,
    )
    return data
  },

  async sendTest(type: DigestType): Promise<string> {
    const { data } = await api.post<{ message: string }>(
      '/admin/settings/notifications/test',
      { type },
    )
    return data.message
  },
}

export const notificationService = {
  async list(): Promise<NotificationListResponse> {
    const { data } = await api.get<NotificationListResponse>(
      '/admin/notifications',
    )
    return data
  },

  async markRead(id: string): Promise<void> {
    await api.post(`/admin/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await api.post('/admin/notifications/read-all')
  },
}
