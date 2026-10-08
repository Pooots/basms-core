import type {
  StaffFilters,
  StaffListResponse,
  StaffMember,
  StaffOptions,
  StaffPayload,
} from '@/types/staff'
import api from '@/lib/api'

export const staffService = {
  async list(filters: StaffFilters): Promise<StaffListResponse> {
    const { data } = await api.get<StaffListResponse>('/admin/staff', {
      params: {
        search: filters.search?.trim() || undefined,
        page: filters.page,
        per_page: filters.per_page,
      },
    })
    return data
  },

  async options(): Promise<StaffOptions> {
    const { data } = await api.get<StaffOptions>('/admin/staff/options')
    return data
  },

  async create(payload: StaffPayload): Promise<StaffMember> {
    const { data } = await api.post<{ data: StaffMember }>(
      '/admin/staff',
      payload,
    )
    return data.data
  },

  async update(id: number, payload: StaffPayload): Promise<StaffMember> {
    const { data } = await api.put<{ data: StaffMember }>(
      `/admin/staff/${id}`,
      payload,
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/staff/${id}`)
  },

  async exportCsv(search?: string): Promise<Blob> {
    const { data } = await api.get<Blob>('/admin/staff/export', {
      params: { search: search?.trim() || undefined },
      responseType: 'blob',
    })
    return data
  },
}
