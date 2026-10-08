import type { ReportRange } from '@/types/report'
import { toIso } from '@/lib/calendar'
import { todayIso } from '@/lib/format'

/** Matches the backend limit for reports. */
export const MAX_RANGE_DAYS = 366

function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const date = fromIso(iso)
  date.setDate(date.getDate() + days)
  return toIso(date)
}

/** Inclusive day count, e.g. Sep 1 – Sep 20 → 20. */
export function rangeDays(from: string, to: string): number {
  return (
    Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86_400_000) +
    1
  )
}

export function defaultRange(): ReportRange {
  const today = todayIso()
  return { from: addDays(today, -29), to: today }
}

export const RANGE_PRESETS: Array<{ label: string; range: () => ReportRange }> =
  [
    {
      label: 'Last 7 days',
      range: () => ({ from: addDays(todayIso(), -6), to: todayIso() }),
    },
    { label: 'Last 30 days', range: defaultRange },
    {
      label: 'This month',
      range: () => ({ from: `${todayIso().slice(0, 7)}-01`, to: todayIso() }),
    },
    {
      label: 'Last month',
      range: () => {
        const firstOfThisMonth = `${todayIso().slice(0, 7)}-01`
        const end = addDays(firstOfThisMonth, -1)
        return { from: `${end.slice(0, 7)}-01`, to: end }
      },
    },
    {
      label: 'This year',
      range: () => ({
        from: `${todayIso().slice(0, 4)}-01-01`,
        to: todayIso(),
      }),
    },
  ]

/** Client-side check mirroring the API rules; null when valid. */
export function rangeError(from: string, to: string): string | null {
  if (!from || !to) return 'Choose both dates.'
  if (to < from) return 'The end date must be on or after the start date.'
  if (rangeDays(from, to) > MAX_RANGE_DAYS)
    return `Choose a range of at most ${MAX_RANGE_DAYS} days.`
  return null
}

/** `Sep 1 – Sep 20, 2026`, or `Dec 15, 2025 – Jan 4, 2026` across years. */
export function formatRange(from: string, to: string): string {
  const a = fromIso(from)
  const b = fromIso(to)
  const sameYear = a.getFullYear() === b.getFullYear()
  const start = a.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  const end = b.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return from === to ? end : `${start} – ${end}`
}
