import type {
  Customer,
  CustomerFilters,
  CustomerListResponse,
  CustomerPayload,
} from '@/types/customer'
import api from '@/lib/api'

export const customerService = {
  async list(filters: CustomerFilters): Promise<CustomerListResponse> {
    const { data } = await api.get<CustomerListResponse>('/admin/customers', {
      params: {
        search: filters.search?.trim() || undefined,
        page: filters.page,
        per_page: filters.per_page,
      },
    })
    return data
  },

  async create(payload: CustomerPayload): Promise<Customer> {
    const { data } = await api.post<{ data: Customer }>(
      '/admin/customers',
      payload,
    )
    return data.data
  },

  async update(id: number, payload: CustomerPayload): Promise<Customer> {
    const { data } = await api.put<{ data: Customer }>(
      `/admin/customers/${id}`,
      payload,
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/customers/${id}`)
  },

  async exportCsv(search?: string): Promise<Blob> {
    const { data } = await api.get<Blob>('/admin/customers/export', {
      params: { search: search?.trim() || undefined },
      responseType: 'blob',
    })
    return data
  },
}
