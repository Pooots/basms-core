import type { Appointment } from '@/types/appointment'

export type DashboardResponse = {
  /** Business date on the server, `YYYY-MM-DD`. */
  today: string
  stats: {
    appointments: {
      total: number
      /** Bookings dated in the current / previous calendar month, any status. */
      this_month: number
      last_month: number
      /** Null when there were no bookings last month. */
      change_percent: number | null
    }
    customers: { total: number; new_this_week: number }
    services: {
      total: number
      active: number
      /** Most booked service, ignoring cancellations; null before any bookings. */
      top: { name: string; bookings: number } | null
    }
    staff: { active: number; booked_today: number }
  }
  /** Latest five bookings made, newest first. */
  recent: Array<Appointment>
  /** Today's bookings that aren't cancelled, by start time. */
  today_schedule: Array<Appointment>
}
