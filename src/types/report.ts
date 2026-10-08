import type { AppointmentStatus } from '@/types/appointment'

export type ReportRange = {
  /** `YYYY-MM-DD` */
  from: string
  to: string
}

export type ReportFormat = 'pdf' | 'csv'

export type ReportParams = ReportRange & { search?: string }

export type ActivityBar = ReportRange & {
  /** e.g. `Sep 1`, or `Sep` for monthly bars */
  label: string
  count: number
}

/** Cancelled bookings are excluded from everything except `statuses`. */
export type ReportSummary = {
  range: ReportRange & { days: number }
  previous_range: ReportRange
  search: string | null
  stats: {
    appointments: {
      value: number
      previous: number
      /** Null when the previous period had none. */
      change_percent: number | null
    }
    new_customers: { value: number; previous: number; change: number }
    /** Estimated from the middle of each service's price range. */
    revenue: {
      value: number
      previous: number
      change_percent: number | null
    }
    services_booked: { value: number; top_service: string | null }
  }
  activity: {
    /** Days per bar; null for monthly bars. */
    bucket_days: number | null
    bars: Array<ActivityBar>
  }
  popular_services: Array<{ name: string; count: number; percent: number }>
  statuses: Record<AppointmentStatus, number>
  staff: Array<{ name: string; bookings: number; revenue: number }>
}
