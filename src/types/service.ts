import type { PaginationMeta } from '@/types/pagination'

export type Service = {
  id: number
  name: string
  duration_min_minutes: number
  /** Bookings reserve this much time. */
  duration_max_minutes: number
  price_min: number
  price_max: number
  appointments_count: number
  upcoming_appointments_count: number
  /** Team members who list this service among their specialties. */
  specialists_count: number
  created_at: string | null
  updated_at: string | null
}

export type ServiceListResponse = {
  data: Array<Service>
  meta: PaginationMeta
}

export type ServicePayload = {
  name: string
  duration_min_minutes: number
  duration_max_minutes: number
  price_min: number
  price_max: number
}

export type ServiceFilters = {
  search?: string
  page?: number
  per_page?: number
}
