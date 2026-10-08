export type BusinessProfile = {
  name: string
  /** Digits with an optional leading `+`, as stored. */
  phone: string
  email: string
  address: string | null
  /** API path that changes on every upload; null when no logo is set. */
  logo_url: string | null
}

export type PaymentMethod = 'push' | 'pull'

export type NotificationKey =
  'new_appointment' | 'cancellation' | 'daily_summary' | 'weekly_report'

export type DigestType = Extract<
  NotificationKey,
  'daily_summary' | 'weekly_report'
>

export type SettingsResponse = {
  profile: BusinessProfile
  payments: {
    method: PaymentMethod
    methods: Array<{ value: PaymentMethod; label: string; description: string }>
  }
  notifications: Array<{
    key: NotificationKey
    label: string
    description: string
    enabled: boolean
  }>
}

export type ProfilePayload = Omit<BusinessProfile, 'logo_url'>

export type AdminNotification = {
  id: string
  type: 'appointment_booked' | 'appointment_cancelled' | string
  title: string
  message: string
  /** Booking date (`YYYY-MM-DD`), used to open the calendar. */
  date: string | null
  read: boolean
  created_at: string | null
}

export type NotificationListResponse = {
  data: Array<AdminNotification>
  unread_count: number
}
