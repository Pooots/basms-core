import { useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import type { Service } from '@/types/service'
import {
  DataTable,
  ExportButton,
  PageHeader,
  PrimaryAction,
  RowActions,
  TableCard,
} from '@/components/admin/Directory'
import { ServiceFormModal } from '@/components/admin/ServiceFormModal'
import { Toast } from '@/components/admin/Toast'
import { useDirectory } from '@/components/admin/useDirectory'
import { TablePagination } from '@/components/ui/TablePagination'
import { formatDurationRange, formatPesoRange, pluralize } from '@/lib/format'
import { serviceService } from '@/services/serviceService'

const COLUMNS = [
  { label: 'Service name' },
  { label: 'Duration' },
  { label: 'Price range' },
  { label: 'Actions', className: 'w-28' },
]

type ModalState =
  { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; service: Service }

export default function ServicesPage() {
  const directory = useDirectory<Service>({
    resource: 'services',
    list: serviceService.list,
    remove: serviceService.remove,
    exportCsv: serviceService.exportCsv,
    deletedMessage: 'Service deleted.',
  })
  const { dialog, search, listQuery, rows, meta, total, removeMutation } =
    directory
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const confirmDelete = async (service: Service) => {
    const upcoming = service.upcoming_appointments_count
    if (upcoming > 0) {
      void dialog.alert({
        title: 'Service has upcoming bookings',
        message: `${service.name} has ${pluralize(upcoming, 'upcoming booking')}. Cancel or move ${upcoming === 1 ? 'it' : 'them'} to another service before deleting it.`,
      })
      return
    }

    const past = service.appointments_count
    const specialists = service.specialists_count
    const ok = await dialog.confirm({
      title: 'Delete service?',
      message: [
        `${service.name} will be removed from the service menu and can no longer be booked.`,
        past &&
          `Its ${pluralize(past, 'past booking')} ${past === 1 ? 'stays' : 'stay'} in appointment history.`,
        specialists &&
          `It will be removed from the specialties of ${pluralize(specialists, 'team member')}.`,
      ]
        .filter(Boolean)
        .join(' '),
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (ok) removeMutation.mutate(service)
  }

  const onSaved = (_saved: Service, mode: 'created' | 'updated') => {
    setModal({ mode: 'closed' })
    directory.setToast(
      mode === 'created' ? 'Service added.' : 'Service updated.',
    )
    directory.invalidate()
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Directory"
        title="Services"
        description="Manage your service menu, duration, and pricing."
        action={
          <PrimaryAction
            icon={Plus}
            label="Add service"
            onClick={() => setModal({ mode: 'create' })}
          />
        }
      />

      <TableCard
        title="Services directory"
        subtitle={
          listQuery.isLoading
            ? 'Loading services…'
            : `${pluralize(total, search ? 'matching record' : 'active record')}${search ? ` for “${search}”` : ''}`
        }
        actions={
          <ExportButton
            onClick={() => directory.exportMutation.mutate()}
            pending={directory.exportMutation.isPending}
            disabled={!total}
          />
        }
      >
        <DataTable
          columns={COLUMNS}
          query={listQuery}
          rows={rows}
          errorTitle="Couldn’t load services"
          empty={{
            icon: Sparkles,
            title: 'No services found',
            hint: search
              ? 'Try a different search.'
              : 'Add your first service to start taking bookings.',
          }}
          renderRow={(row) => (
            <>
              <td className="px-3 py-3">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="font-semibold text-foreground">
                    {row.name}
                  </span>
                </span>
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {formatDurationRange(
                  row.duration_min_minutes,
                  row.duration_max_minutes,
                )}
              </td>
              <td className="px-3 py-3 text-muted-foreground tabular-nums">
                {formatPesoRange(row.price_min, row.price_max)}
              </td>
              <RowActions
                editLabel={`Edit ${row.name}`}
                deleteLabel={`Delete ${row.name}`}
                onEdit={() => setModal({ mode: 'edit', service: row })}
                onDelete={() => void confirmDelete(row)}
                deleteDisabled={
                  removeMutation.isPending &&
                  removeMutation.variables.id === row.id
                }
              />
            </>
          )}
        />

        {meta && meta.last_page > 1 && (
          <TablePagination
            meta={meta}
            onPageChange={directory.setPage}
            disabled={listQuery.isFetching}
            label="services"
          />
        )}
      </TableCard>

      {modal.mode !== 'closed' && (
        <ServiceFormModal
          service={modal.mode === 'edit' ? modal.service : null}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={onSaved}
        />
      )}

      <Toast message={directory.toast} />
    </div>
  )
}
