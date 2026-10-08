import { useState } from 'react'
import { Plus, UserRound, UsersRound } from 'lucide-react'
import type { Customer } from '@/types/customer'
import { CustomerFormModal } from '@/components/admin/CustomerFormModal'
import {
  DataTable,
  EmptyCell,
  ExportButton,
  PageHeader,
  PrimaryAction,
  RowActions,
  TableCard,
} from '@/components/admin/Directory'
import { Toast } from '@/components/admin/Toast'
import { useDirectory } from '@/components/admin/useDirectory'
import { TablePagination } from '@/components/ui/TablePagination'
import { formatPhone, pluralize } from '@/lib/format'
import { customerService } from '@/services/customerService'

const COLUMNS = [
  { label: 'Full name' },
  { label: 'Phone number' },
  { label: 'Email address' },
  { label: 'Actions', className: 'w-28' },
]

type ModalState =
  { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; customer: Customer }

export default function CustomersPage() {
  const directory = useDirectory<Customer>({
    resource: 'customers',
    list: customerService.list,
    remove: customerService.remove,
    exportCsv: customerService.exportCsv,
    deletedMessage: 'Customer deleted.',
  })
  const { dialog, search, listQuery, rows, meta, total, removeMutation } =
    directory
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const confirmDelete = async (customer: Customer) => {
    const upcoming = customer.upcoming_appointments_count
    if (upcoming > 0) {
      void dialog.alert({
        title: 'Customer has upcoming bookings',
        message: `${customer.name} has ${pluralize(upcoming, 'upcoming booking')}. Cancel or reassign ${upcoming === 1 ? 'it' : 'them'} before deleting this customer.`,
      })
      return
    }

    const past = customer.appointments_count
    const ok = await dialog.confirm({
      title: 'Delete customer?',
      message: past
        ? `${customer.name} will be removed from the directory. Their ${pluralize(past, 'past booking')} ${past === 1 ? 'stays' : 'stay'} in appointment history.`
        : `${customer.name} will be removed from the directory.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    if (ok) removeMutation.mutate(customer)
  }

  const onSaved = (_saved: Customer, mode: 'created' | 'updated') => {
    setModal({ mode: 'closed' })
    directory.setToast(
      mode === 'created' ? 'Customer added.' : 'Customer updated.',
    )
    directory.invalidate()
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Directory"
        title="Customers"
        description="Keep client contact details organized and up to date."
        action={
          <PrimaryAction
            icon={Plus}
            label="Add customer"
            onClick={() => setModal({ mode: 'create' })}
          />
        }
      />

      <TableCard
        title="Customers directory"
        subtitle={
          listQuery.isLoading
            ? 'Loading customers…'
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
          errorTitle="Couldn’t load customers"
          empty={{
            icon: UsersRound,
            title: 'No customers found',
            hint: search
              ? 'Try a different search.'
              : 'Add your first customer to get started.',
          }}
          renderRow={(row) => (
            <>
              <td className="px-3 py-3">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                    <UserRound className="size-4" />
                  </span>
                  <span className="font-semibold text-foreground">
                    {row.name}
                  </span>
                </span>
              </td>
              <td className="px-3 py-3 text-muted-foreground tabular-nums">
                {row.phone ? formatPhone(row.phone) : <EmptyCell />}
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                {row.email ?? <EmptyCell />}
              </td>
              <RowActions
                editLabel={`Edit ${row.name}`}
                deleteLabel={`Delete ${row.name}`}
                onEdit={() => setModal({ mode: 'edit', customer: row })}
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
            label="customers"
          />
        )}
      </TableCard>

      {modal.mode !== 'closed' && (
        <CustomerFormModal
          customer={modal.mode === 'edit' ? modal.customer : null}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={onSaved}
        />
      )}

      <Toast message={directory.toast} />
    </div>
  )
}
