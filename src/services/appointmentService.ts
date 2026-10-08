import type {
  Appointment,
  AppointmentFilters,
  AppointmentListResponse,
  AppointmentOptions,
  AppointmentPayload,
  CalendarResponse,
} from '@/types/appointment'
import api from '@/lib/api'

export const appointmentService = {
  async list(filters: AppointmentFilters): Promise<AppointmentListResponse> {
    const { data } = await api.get<AppointmentListResponse>(
      '/admin/appointments',
      {
        params: {
          status: filters.status,
          search: filters.search?.trim() || undefined,
          page: filters.page,
          per_page: filters.per_page,
        },
      },
    )
    return data
  },

  async calendar(params: {
    from: string
    to: string
    search?: string
  }): Promise<CalendarResponse> {
    const { data } = await api.get<CalendarResponse>('/admin/calendar', {
      params: {
        from: params.from,
        to: params.to,
        search: params.search?.trim() || undefined,
      },
    })
    return data
  },

  async options(): Promise<AppointmentOptions> {
    const { data } = await api.get<AppointmentOptions>(
      '/admin/appointments/options',
    )
    return data
  },

  async create(payload: AppointmentPayload): Promise<Appointment> {
    const { data } = await api.post<{ data: Appointment }>(
      '/admin/appointments',
      payload,
    )
    return data.data
  },

  async update(id: number, payload: AppointmentPayload): Promise<Appointment> {
    const { data } = await api.put<{ data: Appointment }>(
      `/admin/appointments/${id}`,
      payload,
    )
    return data.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/admin/appointments/${id}`)
  },
}
