import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock3,
  PersonStanding,
  Plus,
  RotateCw,
  Sparkles,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Appointment } from '@/types/appointment'
import type { DashboardResponse } from '@/types/dashboard'
import { useAdminSearch } from '@/components/admin/AdminSearch'
import {
  APPOINTMENT_STATUS_STYLE as STATUS_STYLE,
  AppointmentStatusBadge as StatusBadge,
} from '@/components/admin/AppointmentStatusBadge'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatDate, formatTime, pluralize } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { cn, initials } from '@/lib/utils'
import { authService } from '@/services/authService'
import { dashboardService } from '@/services/dashboardService'

const REFRESH_MS = 60_000

type Stats = DashboardResponse['stats']

type StatCardProps = {
  label: string
  path:
    | '/admin/appointments'
    | '/admin/customers'
    | '/admin/services'
    | '/admin/staff'
  icon: LucideIcon
  tone: string
  value: number | undefined
  hint: ReactNode
  title?: string
}

function greeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function appointmentsHint({
  this_month,
  change_percent,
}: Stats['appointments']): ReactNode {
  if (change_percent === null) return `${this_month} this month`
  if (change_percent === 0) return 'Same as last month'
  const up = change_percent > 0
  const Arrow = up ? ArrowUpRight : ArrowDownRight
  return (
    <>
      <span
        className={cn(
          'inline-flex items-center font-semibold',
          up ? 'text-emerald-600' : 'text-rose-600',
        )}
      >
        <Arrow className="size-3" />
        {Math.abs(change_percent)}%
      </span>{' '}
      vs last month
    </>
  )
}

function staffHint({ active, booked_today }: Stats['staff']): string {
  if (!active) return 'No active team members'
  if (!booked_today) return 'All available today'
  if (booked_today >= active) return 'All booked today'
  return `${booked_today} booked · ${active - booked_today} free today`
}

function statCards(stats: Stats | undefined): Array<StatCardProps> {
  return [
    {
      label: 'Total appointments',
      path: '/admin/appointments',
      icon: Clock3,
      tone: 'bg-indigo-50 text-indigo-600',
      value: stats?.appointments.total,
      hint: stats ? appointmentsHint(stats.appointments) : null,
      title: stats
        ? `${pluralize(stats.appointments.this_month, 'booking')} this month, ${stats.appointments.last_month} last month`
        : undefined,
    },
    {
      label: 'Total customers',
      path: '/admin/customers',
      icon: Users,
      tone: 'bg-emerald-50 text-emerald-600',
      value: stats?.customers.total,
      hint: stats
        ? stats.customers.new_this_week
          ? `+${stats.customers.new_this_week} new this week`
          : 'No new customers this week'
        : null,
    },
    {
      label: 'Total services',
      path: '/admin/services',
      icon: Sparkles,
      tone: 'bg-violet-50 text-violet-600',
      value: stats?.services.total,
      hint: stats
        ? stats.services.top
          ? `Most booked: ${stats.services.top.name}`
          : 'No bookings yet'
        : null,
      title: stats?.services.top
        ? `${stats.services.top.name} · ${pluralize(stats.services.top.bookings, 'booking')}`
        : undefined,
    },
    {
      label: 'Active staff',
      path: '/admin/staff',
      icon: PersonStanding,
      tone: 'bg-orange-50 text-orange-500',
      value: stats?.staff.active,
      hint: stats ? staffHint(stats.staff) : null,
    },
  ]
}

function StatCard({
  label,
  path,
  icon: Icon,
  tone,
  value,
  hint,
  title,
}: StatCardProps) {
  const loading = value === undefined
  return (
    <Link
      to={path}
      title={title}
      className="group flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg',
          tone,
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        {loading ? (
          <>
            <span className="mt-1.5 block h-6 w-12 animate-pulse rounded bg-muted" />
            <span className="mt-1.5 block h-3 w-24 animate-pulse rounded bg-muted" />
          </>
        ) : (
          <>
            <span className="mt-0.5 block font-display text-2xl font-semibold text-foreground tabular-nums">
              {value}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {hint}
            </span>
          </>
        )}
      </span>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  )
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3 py-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/70" />
      ))}
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon
  title: string
  hint?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const bookLink = (
  <Link
    to="/admin/appointments"
    search={{ new: true }}
    className="font-semibold text-primary hover:underline"
  >
    Book an appointment
  </Link>
)

/** True while `now` (local HH:mm) falls inside the booking's reserved slot. */
function isInProgress(item: Appointment, nowTime: string): boolean {
  return item.start_time <= nowTime && nowTime < item.end_time
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { query } = useAdminSearch()
  const search = useDebouncedValue(query.trim(), 300)

  const dashboard = useQuery({
    queryKey: ['dashboard', { search }],
    queryFn: () => dashboardService.get(search),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  })
  const data = dashboard.data

  const now = new Date()
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const name = authService.getSession()?.user.name ?? 'Admin'
  const firstName = name.split(/\s+/)[0]
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const openDay = (date: string) =>
    void navigate({ to: '/admin/calendar', search: { date } })

  const schedule = data?.today_schedule ?? []
  const recent = data?.recent ?? []

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="status-rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-primary uppercase">
            {dateLabel}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {greeting(now)}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <Link
          to="/admin/appointments"
          search={{ new: true }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_-12px_rgb(79_107_237/0.9)] transition hover:bg-[#4560e0]"
        >
          <Plus className="size-4" />
          New appointment
        </Link>
      </div>

      {dashboard.isError && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span>
            Couldn&apos;t load the dashboard
            {data ? ' — showing the last figures.' : '.'}{' '}
            <span className="text-rose-600/80">
              {getErrorMessage(dashboard.error)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void dashboard.refetch()}
            disabled={dashboard.isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
          >
            <RotateCw
              className={cn('size-3.5', dashboard.isFetching && 'animate-spin')}
            />
            Retry
          </button>
        </div>
      )}

      <div className="status-rise-delay mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards(data?.stats).map((card) => (
          <StatCard key={card.path} {...card} />
        ))}
      </div>

      <div className="status-rise-delay-2 mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Recent appointments
              </h2>
              <p className="text-xs text-muted-foreground">
                {search
                  ? `Latest bookings matching “${search}”.`
                  : 'Your latest bookings and their status.'}
              </p>
            </div>
            <Link
              to="/admin/appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto px-5 pb-4">
            {!data && dashboard.isPending ? (
              <ListSkeleton rows={5} />
            ) : !recent.length ? (
              <EmptyState
                icon={CalendarPlus}
                title={
                  search ? `No bookings match “${search}”` : 'No bookings yet'
                }
                hint={search ? 'Try a different search.' : bookLink}
              />
            ) : (
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="bg-muted text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                    <th className="rounded-l-lg px-3 py-2.5">Customer</th>
                    <th className="px-3 py-2.5">Service</th>
                    <th className="px-3 py-2.5">Date &amp; time</th>
                    <th className="rounded-r-lg px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => openDay(row.date)}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-secondary-foreground">
                            {initials(row.customer.name)}
                          </span>
                          <Link
                            to="/admin/calendar"
                            search={{ date: row.date }}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {row.customer.name}
                          </Link>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {row.service.name}
                        <span className="block text-xs text-muted-foreground/80">
                          with {row.staff.name}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-medium text-foreground">
                          {formatDate(row.date)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatTime(row.start_time)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Today&apos;s schedule
              </h2>
              <p className="text-xs text-muted-foreground">
                {!data
                  ? 'Loading…'
                  : search
                    ? `${pluralize(schedule.length, 'booking')} matching “${search}”`
                    : `${pluralize(schedule.length, 'appointment')} booked`}
              </p>
            </div>
            <Link
              to="/admin/calendar"
              search={data ? { date: data.today } : {}}
              aria-label="Open today in the calendar"
              className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <CalendarDays className="size-4" />
            </Link>
          </div>

          {!data && dashboard.isPending ? (
            <div className="mt-4">
              <ListSkeleton rows={4} />
            </div>
          ) : !schedule.length ? (
            <EmptyState
              icon={CalendarDays}
              title={
                search
                  ? `Nothing today matches “${search}”`
                  : 'Nothing booked for today'
              }
              hint={search ? 'Try a different search.' : bookLink}
            />
          ) : (
            <ol className="mt-5 max-h-[420px] space-y-1 overflow-y-auto">
              {schedule.map((item, index) => {
                const live = isInProgress(item, nowTime)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openDay(item.date)}
                      className={cn(
                        'relative flex w-full gap-3 rounded-lg px-1 py-2.5 text-left transition-colors hover:bg-muted/50',
                        live && 'bg-primary/5',
                      )}
                    >
                      <span className="w-16 shrink-0 pt-0.5 text-xs text-muted-foreground">
                        {formatTime(item.start_time)}
                      </span>
                      <span className="relative flex flex-col items-center">
                        <span
                          className={cn(
                            'mt-1 flex size-3.5 items-center justify-center rounded-full border-2 bg-white',
                            STATUS_STYLE[item.status].ring,
                          )}
                          title={STATUS_STYLE[item.status].label}
                        >
                          <span className="size-1 rounded-full bg-current" />
                        </span>
                        {index < schedule.length - 1 && (
                          <span className="absolute top-5 -bottom-4 w-px bg-border" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {item.customer.name}
                          </span>
                          {live && (
                            <span className="shrink-0 rounded bg-primary px-1.5 py-px text-[9px] font-bold tracking-wider text-primary-foreground uppercase">
                              Now
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.service.name} · {item.staff.name}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
