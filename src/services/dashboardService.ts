import type { DashboardResponse } from '@/types/dashboard'
import api from '@/lib/api'

export const dashboardService = {
  async get(search?: string): Promise<DashboardResponse> {
    const { data } = await api.get<DashboardResponse>('/admin/dashboard', {
      params: { search: search?.trim() || undefined },
    })
    return data
  },
}
