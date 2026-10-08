import type {
  Service,
  ServiceFilters,
  ServiceListResponse,
  ServicePayload,
} from '@/types/service'
import api from '@/lib/api'

export const serviceService = {
  async list(filters: ServiceFilters): Promise<ServiceListResponse> {
    const { data } = await api.get<ServiceListResponse>('/admin/services', {
      params: {
        search: filters.search?.trim() || undefined,
        page: filters.page,
        per_page: filters.per_page,
      },
    })
    return data
  },

  async create(payload: ServicePayload): Promise<Service> {
    const { data } = await api.post<{ data: Service }>(
      '/admin/services',
      payload,
    )
    return data.data
  },

  async update(id: number, payload: ServicePayload): Promise<Service> {
    const { data } = await api.put<{ data: Service }>(
      `/admin/services/${id}`,
      payload,
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/services/${id}`)
  },

  async exportCsv(search?: string): Promise<Blob> {
    const { data } = await api.get<Blob>('/admin/services/export', {
      params: { search: search?.trim() || undefined },
      responseType: 'blob',
    })
    return data
  },
}
