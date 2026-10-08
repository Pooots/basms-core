import type { PaginationMeta } from '@/types/pagination'

export type Customer = {
  id: number
  name: string
  /** Digits only, optionally with a leading `+`. */
  phone: string | null
  email: string | null
  appointments_count: number
  upcoming_appointments_count: number
  /** `YYYY-MM-DD` of the latest non-cancelled booking up to today. */
  last_visit: string | null
  created_at: string | null
  updated_at: string | null
}

export type CustomerListResponse = {
  data: Array<Customer>
  meta: PaginationMeta
}

export type CustomerPayload = {
  name: string
  phone: string | null
  email: string | null
}

export type CustomerFilters = {
  search?: string
  page?: number
  per_page?: number
}
