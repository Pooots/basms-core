import type { PaginationMeta } from '@/types/pagination'

export type StaffMember = {
  id: number
  name: string
  /** Digits only, optionally with a leading `+`. */
  phone: string | null
  /** Services this team member specialises in, alphabetical. */
  specialties: Array<{ id: number; name: string }>
  appointments_count: number
  upcoming_appointments_count: number
  created_at: string | null
  updated_at: string | null
}

export type StaffListResponse = {
  data: Array<StaffMember>
  meta: PaginationMeta
}

export type StaffOptions = {
  services: Array<{ id: number; name: string }>
}

export type StaffPayload = {
  name: string
  service_ids: Array<number>
  phone: string
}

export type StaffFilters = {
  search?: string
  page?: number
  per_page?: number
}
