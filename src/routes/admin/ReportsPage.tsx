import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  AlertCircle,
  Banknote,
  CalendarCheck2,
  ChevronRight,
  Download,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FormEvent } from 'react'
import type { ActivityBar, ReportRange, ReportSummary } from '@/types/report'
import { useAdminSearch } from '@/components/admin/AdminSearch'
import { PageHeader } from '@/components/admin/Directory'
import { ReportExportModal } from '@/components/admin/ReportExportModal'
import { Toast } from '@/components/admin/Toast'
import { getErrorMessage } from '@/lib/apiErrors'
import { defaultRange, formatRange, rangeError } from '@/lib/dateRange'
import { formatPeso, pluralize } from '@/lib/format'
import { primaryButtonClass } from '@/lib/formStyles'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { reportService } from '@/services/reportService'

const CHART_HEIGHT = 200

function formatChange(percent: number, digits = 0): string {
  const rounded = Number(percent.toFixed(digits))
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

function changeTone(value: number | null): string {
  if (!value) return 'text-muted-foreground'
  return value > 0 ? 'text-emerald-600' : 'text-rose-600'
}

/** Round axis maximum and step for ~3–4 gridlines. */
function niceAxis(max: number): { top: number; step: number } {
  if (max <= 3) return { top: 3, step: 1 }
  const rough = max / 3
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rough) ??
    10 * magnitude
  return { top: Math.ceil(max / step) * step, step }
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const routeSearch = useSearch({ from: '/admin/reports' })
  const { query } = useAdminSearch()
  const search = useDebouncedValue(query.trim(), 300)

  const [fallback] = useState(defaultRange)
  const range: ReportRange =
    routeSearch.from && routeSearch.to
      ? { from: routeSearch.from, to: routeSearch.to }
      : fallback

  const [draft, setDraft] = useState(range)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useToast()

  // Keep the inputs in sync when the URL changes (back button, links).
  useEffect(() => {
    setDraft({ from: range.from, to: range.to })
    setDraftError(null)
  }, [range.from, range.to])

  const report = useQuery({
    // Under `appointments` so any booking change refreshes the report.
    queryKey: ['appointments', 'report', { ...range, search }],
    queryFn: () => reportService.summary({ ...range, search }),
    placeholderData: keepPreviousData,
  })

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const invalid = rangeError(draft.from, draft.to)
    if (invalid) {
      setDraftError(invalid)
      return
    }
    void navigate({ to: '/admin/reports', search: draft, replace: true })
  }

  const changed = draft.from !== range.from || draft.to !== range.to
  const data = report.data

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Business performance"
        title="Reports"
        description="Understand appointments, revenue, and service trends."
        action={
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            <Download className="size-4" />
            Download report
          </button>
        }
      />

      <form
        onSubmit={apply}
        noValidate
        className="status-rise-delay mt-7 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-white p-5 shadow-sm"
      >
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Date range
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Start date"
              value={draft.from}
              max={draft.to || undefined}
              onChange={(e) => {
                setDraft((d) => ({ ...d, from: e.target.value }))
                setDraftError(null)
              }}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              aria-label="End date"
              value={draft.to}
              min={draft.from || undefined}
              onChange={(e) => {
                setDraft((d) => ({ ...d, to: e.target.value }))
                setDraftError(null)
              }}
              aria-invalid={Boolean(draftError)}
              className={cn(
                'h-10 rounded-lg border bg-white px-3 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15',
                draftError ? 'border-rose-300' : 'border-border',
              )}
            />
          </div>
          {draftError ? (
            <p role="alert" className="mt-1.5 text-xs text-rose-600">
              {draftError}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Showing {formatRange(range.from, range.to)}
              {data &&
                ` · compared with ${formatRange(data.previous_range.from, data.previous_range.to)}`}
              {search && ` · matching “${search}”`}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={!changed}
          className={cn(primaryButtonClass, 'h-10')}
        >
          Apply dates
        </button>
      </form>

      {report.isError && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">
            Couldn’t load the report. {getErrorMessage(report.error)}
          </span>
          <button
            type="button"
            onClick={() => void report.refetch()}
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-rose-100"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        </div>
      )}

      <div
        className={cn(
          'transition-opacity',
          report.isFetching && !report.isLoading && 'opacity-60',
        )}
      >
        <StatCards data={data} />

        <div className="status-rise-delay-2 mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ActivityCard data={data} />
          <PopularServicesCard data={data} />
        </div>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground/80">
        Cancelled bookings are left out. Revenue is estimated from the middle of
        each service&apos;s price range.
      </p>

      {exportOpen && (
        <ReportExportModal
          initialRange={range}
          search={search}
          onClose={() => setExportOpen(false)}
          onExported={() => {
            setExportOpen(false)
            setToast('Report downloaded.')
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}

function StatCards({ data }: { data: ReportSummary | undefined }) {
  const stats = data?.stats
  const cards: Array<{
    label: string
    icon: LucideIcon
    tone: string
    to: '/admin/appointments' | '/admin/customers' | '/admin/services'
    value?: string
    hint?: string
    hintTone?: string
  }> = [
    {
      label: 'Appointments',
      icon: CalendarCheck2,
      tone: 'bg-indigo-50 text-indigo-600',
      to: '/admin/appointments',
      value: stats && String(stats.appointments.value),
      hint:
        stats &&
        (stats.appointments.change_percent === null
          ? 'No bookings last period'
          : `${formatChange(stats.appointments.change_percent)} vs last period`),
      hintTone: stats && changeTone(stats.appointments.change_percent),
    },
    {
      label: 'New customers',
      icon: Users,
      tone: 'bg-emerald-50 text-emerald-600',
      to: '/admin/customers',
      value: stats && String(stats.new_customers.value),
      hint:
        stats &&
        (stats.new_customers.change === 0
          ? 'Same as last period'
          : `${stats.new_customers.change > 0 ? '+' : ''}${stats.new_customers.change} from last period`),
      hintTone: stats && changeTone(stats.new_customers.change),
    },
    {
      label: 'Total revenue',
      icon: Banknote,
      tone: 'bg-orange-50 text-orange-500',
      to: '/admin/services',
      value: stats && formatPeso(stats.revenue.value),
      hint:
        stats &&
        (stats.revenue.change_percent === null
          ? 'No revenue last period'
          : `${formatChange(stats.revenue.change_percent, 1)} vs last period`),
      hintTone: stats && changeTone(stats.revenue.change_percent),
    },
    {
      label: 'Services booked',
      icon: Sparkles,
      tone: 'bg-violet-50 text-violet-600',
      to: '/admin/services',
      value: stats && String(stats.services_booked.value),
      hint:
        stats &&
        (stats.services_booked.top_service
          ? `${stats.services_booked.top_service} is most popular`
          : 'No services booked'),
      hintTone: 'text-muted-foreground',
    },
  ]

  return (
    <div className="status-rise-delay mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.label}
            to={card.to}
            className="group flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-lg',
                card.tone,
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">
                {card.label}
              </span>
              {card.value === undefined ? (
                <>
                  <span className="mt-1.5 block h-6 w-16 animate-pulse rounded bg-muted" />
                  <span className="mt-1.5 block h-3 w-28 animate-pulse rounded bg-muted" />
                </>
              ) : (
                <>
                  <span className="mt-0.5 block font-display text-2xl font-semibold text-foreground">
                    {card.value}
                  </span>
                  <span
                    className={cn('block truncate text-[11px]', card.hintTone)}
                  >
                    {card.hint}
                  </span>
                </>
              )}
            </span>
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        )
      })}
    </div>
  )
}

function ActivityCard({ data }: { data: ReportSummary | undefined }) {
  const bars = data?.activity.bars ?? []
  const change = data?.stats.appointments.change_percent ?? null
  const { top, step } = niceAxis(Math.max(0, ...bars.map((b) => b.count)))
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => top - i * step)
  const bucketDays = data?.activity.bucket_days

  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Appointment activity
          </h2>
          <p className="text-xs text-muted-foreground">
            Bookings over the selected period
            {bucketDays === null
              ? ' · by month'
              : bucketDays && bucketDays > 1
                ? ` · ${bucketDays}-day bars`
                : ''}
          </p>
        </div>
        {data && (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-bold',
              change === null || change === 0
                ? 'bg-muted text-muted-foreground'
                : change > 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600',
            )}
          >
            {change === null
              ? data.stats.appointments.value
                ? 'New'
                : '—'
              : formatChange(change, 1)}
          </span>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <div
          className="relative w-6 shrink-0 text-right text-[10px] text-muted-foreground"
          style={{ height: CHART_HEIGHT }}
          aria-hidden
        >
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(1 - tick / top) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height: CHART_HEIGHT }}>
            {ticks.map((tick) => (
              <span
                key={tick}
                aria-hidden
                className={cn(
                  'absolute inset-x-0 border-t',
                  tick === 0
                    ? 'border-border'
                    : 'border-dashed border-border/70',
                )}
                style={{ top: `${(1 - tick / top) * 100}%` }}
              />
            ))}
            {data ? (
              <ul
                aria-label="Bookings per period"
                className="absolute inset-0 flex items-end gap-2 px-1 sm:gap-4"
              >
                {bars.map((bar) => (
                  <ChartBar key={bar.from} bar={bar} top={top} />
                ))}
              </ul>
            ) : (
              <div className="absolute inset-0 flex items-end gap-4 px-1">
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className="flex-1 animate-pulse rounded-t-md bg-muted"
                    style={{ height: `${30 + ((i * 37) % 60)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2 px-1 sm:gap-4" aria-hidden>
            {bars.map((bar) => (
              <span
                key={bar.from}
                className="min-w-0 flex-1 truncate text-center text-[10px] text-muted-foreground"
              >
                {bar.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ChartBar({ bar, top }: { bar: ActivityBar; top: number }) {
  const label = `${formatRange(bar.from, bar.to)}: ${pluralize(bar.count, 'booking')}`
  return (
    <li
      className="group relative flex h-full min-w-0 flex-1 items-end justify-center"
      aria-label={label}
    >
      <span
        className="pointer-events-none absolute left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-md bg-navy px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100"
        style={{ bottom: `${(bar.count / top) * 100}%` }}
      >
        {label}
      </span>
      <span
        className={cn(
          'w-full max-w-12 rounded-t-md transition-[height] duration-500',
          bar.count
            ? 'bg-gradient-to-t from-[#4f6bed] to-[#7b90f5] group-hover:from-[#4560e0] group-hover:to-[#6b82f2]'
            : 'bg-muted',
        )}
        style={{ height: bar.count ? `${(bar.count / top) * 100}%` : 3 }}
      />
    </li>
  )
}

function PopularServicesCard({ data }: { data: ReportSummary | undefined }) {
  const services = data?.popular_services ?? []
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h2 className="font-display text-base font-semibold text-foreground">
        Popular services
      </h2>
      <p className="text-xs text-muted-foreground">Share of all bookings</p>

      <ul className="mt-5 space-y-4">
        {!data ? (
          Array.from({ length: 5 }, (_, i) => (
            <li key={i}>
              <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
              <span className="mt-2 block h-1.5 animate-pulse rounded-full bg-muted" />
            </li>
          ))
        ) : services.length === 0 ? (
          <li className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
            No bookings in this period.
          </li>
        ) : (
          services.map((service) => (
            <li
              key={service.name}
              title={`${service.name}: ${pluralize(service.count, 'booking')}`}
            >
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-semibold text-foreground">
                  {service.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {Math.round(service.percent)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-teal-500 transition-[width] duration-500"
                  style={{ width: `${Math.max(service.percent, 2)}%` }}
                />
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
