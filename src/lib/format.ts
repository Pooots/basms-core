function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** `2026-09-21` → `Sep 21, 2026` (local date, no timezone shift). */
export function formatDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** `14:00` → `2:00 PM` */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** Adds minutes to `HH:mm`; null when it would pass midnight. */
export function addMinutes(time: string, minutes: number): string | null {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  if (total >= 24 * 60) return null
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  const hours = `${h} hr${h > 1 ? 's' : ''}`
  return m ? `${hours} ${m} min` : hours
}

/** `10, 20` → `10–20 mins`, `180, 300` → `3–5 hours`, `120, 120` → `2 hours`. */
export function formatDurationRange(min: number, max: number): string {
  if (min % 60 === 0 && max % 60 === 0) {
    const [a, b] = [min / 60, max / 60]
    return a === b ? `${a} hour${a === 1 ? '' : 's'}` : `${a}–${b} hours`
  }
  if (max < 60) return min === max ? `${min} mins` : `${min}–${max} mins`
  return min === max
    ? formatDuration(min)
    : `${formatDuration(min)} – ${formatDuration(max)}`
}

const pesoWhole = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})
const pesoCents = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

/** `1999` → `₱1,999`, `20000` → `₱20k`, `99.5` → `₱99.50`. */
export function formatPeso(amount: number): string {
  if (amount >= 10_000 && amount % 1000 === 0) return `₱${amount / 1000}k`
  return Number.isInteger(amount)
    ? pesoWhole.format(amount)
    : pesoCents.format(amount)
}

export function formatPesoRange(min: number, max: number): string {
  return min === max ? formatPeso(min) : `${formatPeso(min)}–${formatPeso(max)}`
}

export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** `09555478421` → `0955 547 8421`, `+639555478421` → `+63 955 547 8421`; anything else as-is. */
export function formatPhone(phone: string): string {
  const local = /^(09\d{2})(\d{3})(\d{4})$/.exec(phone)
  if (local) return `${local[1]} ${local[2]} ${local[3]}`
  const intl = /^\+63(9\d{2})(\d{3})(\d{4})$/.exec(phone)
  if (intl) return `+63 ${intl[1]} ${intl[2]} ${intl[3]}`
  return phone
}

/** `just now`, `5m ago`, `3h ago`, `2d ago`, then `Sep 21`. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.max(
    0,
    Math.round((now - new Date(iso).getTime()) / 1000),
  )
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/** Today's local date as `YYYY-MM-DD`. */
export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
