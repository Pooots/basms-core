export type CalendarDay = {
  /** `YYYY-MM-DD` */
  iso: string
  day: number
  /** False for the leading/trailing days borrowed from the neighbouring months. */
  inMonth: boolean
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** True for a real calendar date in `YYYY-MM-DD` form (rejects e.g. `2026-02-30`). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  return toIso(fromIso(value)) === value
}

/** Monday-first weeks covering the month of `iso`, padded with neighbouring days. */
export function monthGrid(iso: string): {
  from: string
  to: string
  weeks: Array<Array<CalendarDay>>
} {
  const anchor = fromIso(iso)
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)

  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  const end = new Date(last)
  end.setDate(last.getDate() + ((7 - last.getDay()) % 7))

  const weeks: Array<Array<CalendarDay>> = []
  for (const cursor = new Date(start); cursor <= end;) {
    const week: Array<CalendarDay> = []
    for (let i = 0; i < 7; i++) {
      week.push({
        iso: toIso(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === anchor.getMonth(),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return { from: toIso(start), to: toIso(end), weeks }
}

/** Same day-of-month `delta` months away, clamped (Jan 31 + 1 → Feb 28). */
export function shiftMonth(iso: string, delta: number): string {
  const date = fromIso(iso)
  const target = new Date(date.getFullYear(), date.getMonth() + delta, 1)
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return toIso(target)
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7)
}

/** `2026-09-01` → `September 2026` */
export function formatMonthYear(iso: string): string {
  return fromIso(iso).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

/** `2026-09-01` → `September 1` */
export function formatMonthDay(iso: string): string {
  return fromIso(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
}

/** `2026-09-01` → `Tuesday` */
export function formatWeekday(iso: string): string {
  return fromIso(iso).toLocaleDateString('en-US', { weekday: 'long' })
}
