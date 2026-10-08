import axios from 'axios'
import type { ReportFormat, ReportParams, ReportSummary } from '@/types/report'
import api from '@/lib/api'

function toQuery(params: ReportParams) {
  return {
    from: params.from,
    to: params.to,
    search: params.search?.trim() || undefined,
  }
}

export const reportService = {
  async summary(params: ReportParams): Promise<ReportSummary> {
    const { data } = await api.get<ReportSummary>('/admin/reports', {
      params: toQuery(params),
    })
    return data
  },

  async export(params: ReportParams & { format: ReportFormat }): Promise<Blob> {
    try {
      const { data } = await api.get<Blob>('/admin/reports/export', {
        params: { ...toQuery(params), format: params.format },
        responseType: 'blob',
      })
      return data
    } catch (error) {
      // Errors arrive as a Blob too; turn the JSON body back into an object
      // so validation messages can be shown.
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await error.response.data.text())
        } catch {
          // Not JSON; keep the generic error.
        }
      }
      throw error
    }
  },
}
