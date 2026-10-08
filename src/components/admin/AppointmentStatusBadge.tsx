import type { AppointmentStatus } from '@/types/appointment'
import { cn } from '@/lib/utils'

export const APPOINTMENT_STATUS_STYLE: Record<
  AppointmentStatus,
  { label: string; badge: string; ring: string }
> = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    ring: 'border-amber-400 text-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    ring: 'border-emerald-400 text-emerald-500',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    ring: 'border-indigo-400 text-indigo-500',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    ring: 'border-rose-400 text-rose-500',
  },
}

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus
}) {
  const style = APPOINTMENT_STATUS_STYLE[status]
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        style.badge,
      )}
    >
      {style.label}
    </span>
  )
}
