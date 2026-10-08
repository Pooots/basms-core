import type { PaginationMeta } from '@/types/pagination'

export type AppointmentStatus =
  'pending' | 'confirmed' | 'completed' | 'cancelled'

export type ServiceOption = {
  id: number
  name: string
  duration_min_minutes: number
  /** Bookings reserve this much time. */
  duration_max_minutes: number
  price_min: number
  price_max: number
}

export type StaffOption = {
  id: number
  name: string
  /** Services they specialise in, alphabetical. */
  specialties: Array<{ id: number; name: string }>
}

export type CustomerOption = {
  id: number
  name: string
}

export type Appointment = {
  id: number
  customer: CustomerOption
  service: ServiceOption
  staff: { id: number; name: string }
  /** `YYYY-MM-DD` */
  date: string
  /** `HH:mm`, 24-hour */
  start_time: string
  end_time: string
  status: AppointmentStatus
  created_at: string | null
  updated_at: string | null
}

export type AppointmentCounts = Record<'all' | AppointmentStatus, number>

export type AppointmentListResponse = {
  data: Array<Appointment>
  meta: PaginationMeta
  counts: AppointmentCounts
}

export type AppointmentOptions = {
  services: Array<ServiceOption>
  staff: Array<StaffOption>
  customers: Array<CustomerOption>
  statuses: Array<{ value: AppointmentStatus; label: string }>
}

export type AppointmentPayload = {
  customer_name: string
  service_id: number
  staff_id: number
  date: string
  start_time: string
  status: AppointmentStatus
}

/** Every booking (any status) dated within `from`–`to`, sorted by date then time. */
export type CalendarResponse = {
  from: string
  to: string
  data: Array<Appointment>
}

export type AppointmentFilters = {
  status?: AppointmentStatus
  search?: string
  page?: number
  per_page?: number
}
