import { useEffect, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { CalendarX2, Plus } from 'lucide-react'
import type { Appointment, AppointmentStatus } from '@/types/appointment'
import { useAdminSearch } from '@/components/admin/AdminSearch'
import { AppointmentFormModal } from '@/components/admin/AppointmentFormModal'
import { AppointmentStatusBadge } from '@/components/admin/AppointmentStatusBadge'
import {
  DataTable,
  PageHeader,
  PrimaryAction,
  RowActions,
  TableCard,
} from '@/components/admin/Directory'
import { Toast } from '@/components/admin/Toast'
import { RELATED_RESOURCES } from '@/components/admin/useDirectory'
import { useDialog } from '@/components/ui/AppDialog'
import { TablePagination } from '@/components/ui/TablePagination'
import { getErrorMessage } from '@/lib/apiErrors'
import { formatDate, formatTime, pluralize } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useToast } from '@/lib/useToast'
import { cn, initials } from '@/lib/utils'
import { appointmentService } from '@/services/appointmentService'

type StatusFilter = 'all' | AppointmentStatus

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const COLUMNS = [
  { label: 'Customer' },
  { label: 'Service' },
  { label: 'Staff' },
  { label: 'Date & time' },
  { label: 'Status' },
  { label: 'Actions', className: 'w-28' },
]

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; appointment: Appointment }

export default function AppointmentsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const dialog = useDialog()
  const routeSearch = useSearch({ strict: false })
  const { query } = useAdminSearch()
  const search = useDebouncedValue(query.trim(), 300)

  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [toast, setToast] = useToast()

  useEffect(() => setPage(1), [status, search])

  const list = useQuery({
    queryKey: ['appointments', 'list', { status, search, page }],
    queryFn: () =>
      appointmentService.list({
        status: status === 'all' ? undefined : status,
        search,
        page,
      }),
    placeholderData: keepPreviousData,
  })

  const options = useQuery({
    queryKey: ['appointments', 'options'],
    queryFn: appointmentService.options,
    staleTime: 60_000,
  })

  // Dashboard "New appointment" links here with ?new=true.
  useEffect(() => {
    if (routeSearch.new && options.data) {
      setModal({ mode: 'create' })
      void navigate({ to: '/admin/appointments', search: {}, replace: true })
    }
  }, [routeSearch.new, options.data, navigate])

  // Past the last page after a delete → step back.
  useEffect(() => {
    const meta = list.data?.meta
    if (meta && meta.last_page > 0 && page > meta.last_page) {
      setPage(meta.last_page)
    }
  }, [list.data?.meta, page])

  const invalidate = () => {
    for (const key of RELATED_RESOURCES) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  }

  const remove = useMutation({
    mutationFn: (appointment: Appointment) =>
      appointmentService.remove(appointment.id),
    onSuccess: () => {
      setToast('Appointment deleted.')
      invalidate()
    },
    onError: (error) => {
      void dialog.alert({
        title: 'Could not delete',
        message: getErrorMessage(error),
      })
    },
  })

  const confirmDelete = async (appointment: Appointment) => {
    const ok = await dialog.confirm({
      title: 'Delete appointment?',
      message: `${appointment.customer.name}'s ${appointment.service.name} on ${formatDate(appointment.date)} at ${formatTime(appointment.start_time)} will be removed.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (ok) remove.mutate(appointment)
  }

  const onSaved = (_saved: Appointment, mode: 'created' | 'updated') => {
    setModal({ mode: 'closed' })
    setToast(
      mode === 'created' ? 'Appointment booked.' : 'Appointment updated.',
    )
    invalidate()
  }

  const rows = list.data?.data ?? []
  const meta = list.data?.meta
  const counts = list.data?.counts
  const total = meta?.total ?? 0

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Booking management"
        title="Appointments"
        description="Create, update, and keep track of every client booking."
        action={
          <PrimaryAction
            icon={Plus}
            label="New appointment"
            onClick={() => setModal({ mode: 'create' })}
            disabled={!options.data}
          />
        }
      />

      <TableCard
        title={
          status === 'all'
            ? 'All appointments'
            : `${FILTERS.find((f) => f.value === status)?.label} appointments`
        }
        subtitle={
          list.isLoading
            ? 'Loading bookings…'
            : `${pluralize(total, 'booking')} found${search ? ` for “${search}”` : ''}`
        }
        actions={
          <div
            role="tablist"
            aria-label="Filter by status"
            className="flex flex-wrap gap-0.5 rounded-lg border border-border bg-muted p-0.5"
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={status === f.value}
                onClick={() => setStatus(f.value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition',
                  status === f.value
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f.label}
                {counts && (
                  <span className="ml-1 text-[10px] text-muted-foreground/80">
                    {counts[f.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
      >
        <DataTable
          columns={COLUMNS}
          minWidth={820}
          query={list}
          rows={rows}
          errorTitle="Couldn’t load appointments"
          empty={{
            icon: CalendarX2,
            title: 'No appointments found',
            hint:
              search || status !== 'all'
                ? 'Try a different filter or search.'
                : 'Book the first appointment to get started.',
          }}
          renderRow={(row) => (
            <>
              <td className="px-3 py-3">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-secondary-foreground">
                    {initials(row.customer.name)}
                  </span>
                  <span className="font-semibold text-foreground">
                    {row.customer.name}
                  </span>
                </span>
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {row.service.name}
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {row.staff.name}
              </td>
              <td className="px-3 py-3">
                <Link
                  to="/admin/calendar"
                  search={{ date: row.date }}
                  title="View this day in the calendar"
                  className="block font-medium text-foreground hover:text-primary hover:underline"
                >
                  {formatDate(row.date)}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {formatTime(row.start_time)} – {formatTime(row.end_time)}
                </span>
              </td>
              <td className="px-3 py-3">
                <AppointmentStatusBadge status={row.status} />
              </td>
              <RowActions
                editLabel={`Edit ${row.customer.name}'s appointment`}
                deleteLabel={`Delete ${row.customer.name}'s appointment`}
                onEdit={() => setModal({ mode: 'edit', appointment: row })}
                onDelete={() => void confirmDelete(row)}
                editDisabled={!options.data}
                deleteDisabled={
                  remove.isPending && remove.variables.id === row.id
                }
              />
            </>
          )}
        />

        {meta && meta.last_page > 1 && (
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            disabled={list.isFetching}
            label="bookings"
          />
        )}
      </TableCard>

      {modal.mode !== 'closed' && options.data && (
        <AppointmentFormModal
          appointment={modal.mode === 'edit' ? modal.appointment : null}
          options={options.data}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={onSaved}
        />
      )}

      <Toast message={toast} />
    </div>
  )
}
