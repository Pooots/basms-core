/**
 * The service form takes duration and price as free text ("10-20 mins",
 * "₱10k-₱20k") and turns it into the min/max numbers the API stores.
 */

export type Range = { min: number; max: number }
export type ParseResult =
  { ok: true; value: Range } | { ok: false; error: string }

export const MIN_DURATION_MINUTES = 5
export const MAX_DURATION_MINUTES = 720
export const MAX_PRICE = 1_000_000

const DURATION_HINT =
  'Enter a duration like "45 mins", "10-20 mins" or "3-5 hours".'
const PRICE_HINT = 'Enter a price like "₱250", "₱70-₱100" or "₱10k-₱20k".'

const UNIT_MINUTES: Record<string, number> = {
  m: 1,
  min: 1,
  mins: 1,
  minute: 1,
  minutes: 1,
  h: 60,
  hr: 60,
  hrs: 60,
  hour: 60,
  hours: 60,
}

const RANGE_SEPARATOR = /\s*(?:-|–|—|\bto\b)\s*/

const fail = (error: string): ParseResult => ({ ok: false, error })

export function parseDuration(input: string): ParseResult {
  const text = input.trim().toLowerCase()
  if (!text) return fail('Enter a duration.')

  const parts = text.split(RANGE_SEPARATOR)
  if (parts.length > 2) return fail(DURATION_HINT)

  const matches = parts.map((part) => /^(\d+(?:\.\d+)?)\s*([a-z]*)$/.exec(part))
  if (matches.some((m) => !m)) return fail(DURATION_HINT)

  const units = matches.map((m) => m![2])
  if (units.some((u) => u && !(u in UNIT_MINUTES))) return fail(DURATION_HINT)

  // "10-20 mins": a missing unit borrows the other side's; no unit at all means minutes.
  const fallback = units.find(Boolean) ?? 'mins'
  const minutes = matches.map((m, i) =>
    Math.round(Number(m![1]) * UNIT_MINUTES[units[i] || fallback]),
  )
  const [min, max = min] = minutes

  if (min < MIN_DURATION_MINUTES || max > MAX_DURATION_MINUTES) {
    return fail('Duration must be between 5 minutes and 12 hours.')
  }
  if (max < min)
    return fail('The longest duration can’t be shorter than the shortest.')
  return { ok: true, value: { min, max } }
}

export function parsePriceRange(input: string): ParseResult {
  const text = input
    .trim()
    .toLowerCase()
    .replace(/₱|php|,/g, '')
    .replace(/\bp(?=\s*\d)/g, '')
  if (!text) return fail('Enter a price or price range.')

  const parts = text.split(RANGE_SEPARATOR)
  if (parts.length > 2) return fail(PRICE_HINT)

  const values = parts.map((part) => {
    const m = /^(\d+(?:\.\d{1,2})?)\s*(k)?$/.exec(part.trim())
    return m
      ? Math.round(Number(m[1]) * (m[2] ? 1000 : 1) * 100) / 100
      : Number.NaN
  })
  if (values.some(Number.isNaN)) return fail(PRICE_HINT)

  const [min, max = min] = values
  if (max > MAX_PRICE) return fail('Price can’t be more than ₱1,000,000.')
  if (max < min)
    return fail('The highest price can’t be lower than the lowest.')
  return { ok: true, value: { min, max } }
}

/** Text for the duration field that `parseDuration` reads back exactly. */
export function durationInputValue(min: number, max: number): string {
  if (min % 60 === 0 && max % 60 === 0) {
    const [a, b] = [min / 60, max / 60]
    return a === b ? `${a} hour${a === 1 ? '' : 's'}` : `${a}-${b} hours`
  }
  return min === max ? `${min} mins` : `${min}-${max} mins`
}

/** Text for the price field that `parsePriceRange` reads back exactly. */
export function priceInputValue(min: number, max: number): string {
  const peso = (n: number) =>
    `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
  return min === max ? peso(min) : `${peso(min)}-${peso(max)}`
}
