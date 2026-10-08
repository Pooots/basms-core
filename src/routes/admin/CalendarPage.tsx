import { useMemo, useState } from 'react'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  AlertCircle,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react'
import type { Appointment } from '@/types/appointment'
import type { CalendarDay } from '@/lib/calendar'
import { useAdminSearch } from '@/components/admin/AdminSearch'
import { AppointmentFormModal } from '@/components/admin/AppointmentFormModal'
import { AppointmentStatusBadge } from '@/components/admin/AppointmentStatusBadge'
import { PageHeader } from '@/components/admin/Directory'
import { Toast } from '@/components/admin/Toast'
import { RELATED_RESOURCES } from '@/components/admin/useDirectory'
import { getErrorMessage } from '@/lib/apiErrors'
import {
  WEEKDAYS,
  formatMonthDay,
  formatMonthYear,
  formatWeekday,
  isSameMonth,
  monthGrid,
  shiftMonth,
} from '@/lib/calendar'
import { formatTime, pluralize, todayIso } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { appointmentService } from '@/services/appointmentService'

/** Service chips shown in a day cell before collapsing into "+N more". */
const MAX_CHIPS = 2

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; appointment: Appointment }

export default function CalendarPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const routeSearch = useSearch({ from: '/admin/calendar' })
  const { query } = useAdminSearch()
  const search = useDebouncedValue(query.trim(), 300)

  const today = todayIso()
  const selected = routeSearch.date ?? today
  const grid = useMemo(() => monthGrid(selected), [selected])

  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [toast, setToast] = useToast()

  const select = (date: string) =>
    void navigate({ to: '/admin/calendar', search: { date }, replace: true })

  const calendar = useQuery({
    queryKey: [
      'appointments',
      'calendar',
      { from: grid.from, to: grid.to, search },
    ],
    queryFn: () =>
      appointmentService.calendar({ from: grid.from, to: grid.to, search }),
    placeholderData: keepPreviousData,
  })

  const options = useQuery({
    queryKey: ['appointments', 'options'],
    queryFn: appointmentService.options,
    staleTime: 60_000,
  })

  const byDate = useMemo(() => {
    const map = new Map<string, Array<Appointment>>()
    for (const appointment of calendar.data?.data ?? []) {
      const day = map.get(appointment.date)
      if (day) day.push(appointment)
      else map.set(appointment.date, [appointment])
    }
    return map
  }, [calendar.data])

  const dayBookings = byDate.get(selected) ?? []
  const monthTotal = (calendar.data?.data ?? []).filter((a) =>
    isSameMonth(a.date, selected),
  ).length

  const onSaved = (saved: Appointment, mode: 'created' | 'updated') => {
    setModal({ mode: 'closed' })
    setToast(
      mode === 'created' ? 'Appointment booked.' : 'Appointment updated.',
    )
    for (const key of RELATED_RESOURCES) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
    select(saved.date)
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Schedule overview"
        title="Calendar"
        description="See your bookings at a glance and plan the month ahead."
        action={
          <div className="flex items-center gap-2">
            {selected !== today && (
              <button
                type="button"
                onClick={() => select(today)}
                className="h-10 rounded-lg border border-border bg-white px-3.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
              >
                Today
              </button>
            )}
            <div className="flex h-10 items-center rounded-lg border border-border bg-white shadow-sm">
              <button
                type="button"
                onClick={() => select(shiftMonth(selected, -1))}
                aria-label="Previous month"
                className="flex h-full w-10 items-center justify-center rounded-l-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span
                aria-live="polite"
                className="min-w-36 text-center font-display text-sm font-semibold text-foreground"
              >
                {formatMonthYear(selected)}
              </span>
              <button
                type="button"
                onClick={() => select(shiftMonth(selected, 1))}
                aria-label="Next month"
                className="flex h-full w-10 items-center justify-center rounded-r-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        }
      />

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="status-rise-delay rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base font-semibold text-foreground">
              {formatMonthYear(selected)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {calendar.isLoading
                ? 'Loading bookings…'
                : `${pluralize(monthTotal, 'booking')} this month${search ? ` for “${search}”` : ''}`}
            </p>
          </div>

          {calendar.isError && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              <AlertCircle className="size-4 shrink-0" />
              <span className="flex-1">
                Couldn’t load bookings. {getErrorMessage(calendar.error)}
              </span>
              <button
                type="button"
                onClick={() => void calendar.refetch()}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 py-1 font-semibold hover:bg-rose-100"
              >
                <RefreshCw className="size-3.5" />
                Try again
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <div
              role="grid"
              aria-label={`${formatMonthYear(selected)} bookings`}
              className={cn(
                'min-w-[560px] transition-opacity',
                calendar.isFetching && !calendar.isLoading && 'opacity-60',
              )}
            >
              <div role="row" className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    role="columnheader"
                    className="pb-2 text-center text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid gap-1.5">
                {grid.weeks.map((week) => (
                  <div
                    key={week[0].iso}
                    role="row"
                    className="grid grid-cols-7 gap-1.5"
                  >
                    {week.map((day) => (
                      <DayCell
                        key={day.iso}
                        day={day}
                        bookings={byDate.get(day.iso) ?? []}
                        selected={day.iso === selected}
                        today={day.iso === today}
                        loading={calendar.isLoading}
                        onSelect={() => select(day.iso)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="status-rise-delay rounded-xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                Selected day
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
                {formatMonthDay(selected)}
              </h2>
              <p className="text-xs text-muted-foreground">
                {formatWeekday(selected)}
                {selected === today && ' · Today'}
              </p>
            </div>
            <span
              aria-label={pluralize(dayBookings.length, 'booking')}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary font-display text-sm font-semibold text-primary"
            >
              {calendar.isLoading ? '–' : dayBookings.length}
            </span>
          </div>

          <div className="mt-5">
            {calendar.isLoading ? (
              <ul className="space-y-2.5">
                {Array.from({ length: 2 }, (_, i) => (
                  <li
                    key={i}
                    className="h-[74px] animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </ul>
            ) : dayBookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <CalendarX2 className="mx-auto size-7 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-semibold text-foreground">
                  No bookings on this day
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {search
                    ? 'Nothing matches your search.'
                    : 'This day is wide open.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {dayBookings.map((appointment) => (
                  <li key={appointment.id}>
                    <BookingCard
                      appointment={appointment}
                      disabled={!options.data}
                      onOpen={() => setModal({ mode: 'edit', appointment })}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            disabled={!options.data}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/25 bg-secondary/60 text-sm font-semibold text-primary transition hover:bg-secondary disabled:opacity-60"
          >
            <Plus className="size-4" />
            Book on {formatMonthDay(selected)}
          </button>
        </aside>
      </div>

      {modal.mode !== 'closed' && options.data && (
        <AppointmentFormModal
          appointment={modal.mode === 'edit' ? modal.appointment : null}
          options={options.data}
          defaultDate={selected}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={onSaved}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}

function DayCell({
  day,
  bookings,
  selected,
  today,
  loading,
  onSelect,
}: {
  day: CalendarDay
  bookings: Array<Appointment>
  selected: boolean
  today: boolean
  loading: boolean
  onSelect: () => void
}) {
  const shown = bookings.slice(0, MAX_CHIPS)
  const hidden = bookings.length - shown.length

  return (
    <button
      type="button"
      role="gridcell"
      aria-selected={selected}
      aria-label={`${formatMonthDay(day.iso)}, ${pluralize(bookings.length, 'booking')}`}
      onClick={onSelect}
      className={cn(
        'flex min-h-[92px] flex-col gap-1 rounded-lg border p-2 text-left transition',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-[0_12px_24px_-14px_rgb(79_107_237/0.9)]'
          : day.inMonth
            ? 'border-border bg-white hover:border-primary/40 hover:bg-secondary/40'
            : 'border-transparent bg-muted/50 text-muted-foreground/60 hover:bg-muted',
      )}
    >
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
          today && !selected && 'bg-secondary text-primary',
          today && selected && 'bg-white/20',
        )}
      >
        {day.day}
      </span>
      {loading ? (
        <span className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      ) : (
        <>
          {shown.map((appointment) => (
            <span
              key={appointment.id}
              title={`${formatTime(appointment.start_time)} · ${appointment.customer.name} · ${appointment.service.name}`}
              className={cn(
                'block truncate rounded px-1.5 py-0.5 text-[10px] font-semibold',
                selected
                  ? 'bg-white/20 text-white'
                  : 'bg-teal-50 text-teal-700',
                appointment.status === 'cancelled' &&
                  (selected
                    ? 'line-through opacity-70'
                    : 'bg-muted text-muted-foreground line-through'),
                !day.inMonth && !selected && 'opacity-60',
              )}
            >
              {appointment.service.name}
            </span>
          ))}
          {hidden > 0 && (
            <span
              className={cn(
                'px-1.5 text-[10px] font-semibold',
                selected ? 'text-white/80' : 'text-muted-foreground',
              )}
            >
              +{hidden} more
            </span>
          )}
        </>
      )}
    </button>
  )
}

function BookingCard({
  appointment,
  disabled,
  onOpen,
}: {
  appointment: Appointment
  disabled: boolean
  onOpen: () => void
}) {
  const cancelled = appointment.status === 'cancelled'
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      aria-label={`Edit ${appointment.customer.name}'s ${appointment.service.name} at ${formatTime(appointment.start_time)}`}
      className="group flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition hover:border-primary/40 hover:bg-secondary/40 disabled:cursor-wait"
    >
      <span className={cn('min-w-0 flex-1', cancelled && 'opacity-60')}>
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">
            {formatTime(appointment.start_time)}
          </span>
          {appointment.status !== 'confirmed' && (
            <AppointmentStatusBadge status={appointment.status} />
          )}
        </span>
        <span
          className={cn(
            'mt-0.5 block truncate text-sm font-semibold text-foreground',
            cancelled && 'line-through',
          )}
        >
          {appointment.customer.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {appointment.service.name} with {appointment.staff.name}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  )
}
