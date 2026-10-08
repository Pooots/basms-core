import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PersonStanding, Plus, UsersRound } from 'lucide-react'
import type { StaffMember } from '@/types/staff'
import {
  DataTable,
  EmptyCell,
  ExportButton,
  PageHeader,
  PrimaryAction,
  RowActions,
  TableCard,
} from '@/components/admin/Directory'
import { StaffFormModal } from '@/components/admin/StaffFormModal'
import { Toast } from '@/components/admin/Toast'
import { useDirectory } from '@/components/admin/useDirectory'
import { TablePagination } from '@/components/ui/TablePagination'
import { formatPhone, pluralize } from '@/lib/format'
import { staffService } from '@/services/staffService'

const COLUMNS = [
  { label: 'Full name' },
  { label: 'Specialties' },
  { label: 'Contact number' },
  { label: 'Actions', className: 'w-28' },
]

const VISIBLE_SPECIALTIES = 3

function SpecialtyChips({
  specialties,
}: {
  specialties: StaffMember['specialties']
}) {
  if (!specialties.length) return <EmptyCell />

  const hidden = specialties.slice(VISIBLE_SPECIALTIES)
  return (
    <span className="flex flex-wrap gap-1.5">
      {specialties.slice(0, VISIBLE_SPECIALTIES).map((s) => (
        <span
          key={s.id}
          className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {s.name}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.map((s) => s.name).join(', ')}
          className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          +{hidden.length}
        </span>
      )}
    </span>
  )
}

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; member: StaffMember }

export default function StaffPage() {
  const directory = useDirectory<StaffMember>({
    resource: 'staff',
    list: staffService.list,
    remove: staffService.remove,
    exportCsv: staffService.exportCsv,
    deletedMessage: 'Team member removed.',
  })
  const { dialog, search, listQuery, rows, meta, total, removeMutation } =
    directory
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })

  const options = useQuery({
    queryKey: ['staff', 'options'],
    queryFn: staffService.options,
    staleTime: 60_000,
  })

  const confirmDelete = async (member: StaffMember) => {
    const upcoming = member.upcoming_appointments_count
    if (upcoming > 0) {
      void dialog.alert({
        title: 'Team member has upcoming bookings',
        message: `${member.name} has ${pluralize(upcoming, 'upcoming booking')}. Cancel or reassign ${upcoming === 1 ? 'it' : 'them'} before removing this team member.`,
      })
      return
    }

    const past = member.appointments_count
    const ok = await dialog.confirm({
      title: 'Remove team member?',
      message: `${member.name} will be removed from the team and can no longer be booked.${past ? ` Their ${pluralize(past, 'past booking')} ${past === 1 ? 'stays' : 'stay'} in appointment history.` : ''}`,
      confirmLabel: 'Remove',
      tone: 'danger',
    })
    if (ok) removeMutation.mutate(member)
  }

  const onSaved = (_saved: StaffMember, mode: 'created' | 'updated') => {
    setModal({ mode: 'closed' })
    directory.setToast(
      mode === 'created' ? 'Team member added.' : 'Team member updated.',
    )
    directory.invalidate()
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Directory"
        title="Staff"
        description="Manage your specialists and assigned services."
        action={
          <PrimaryAction
            icon={Plus}
            label="Add team member"
            onClick={() => setModal({ mode: 'create' })}
            disabled={!options.data}
          />
        }
      />

      <TableCard
        title="Staff directory"
        subtitle={
          listQuery.isLoading
            ? 'Loading team…'
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
          errorTitle="Couldn’t load staff"
          empty={{
            icon: UsersRound,
            title: 'No team members found',
            hint: search
              ? 'Try a different search.'
              : 'Add your first team member to start taking bookings.',
          }}
          renderRow={(row) => (
            <>
              <td className="px-3 py-3">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                    <PersonStanding className="size-4" />
                  </span>
                  <span className="font-semibold text-foreground">
                    {row.name}
                  </span>
                </span>
              </td>
              <td className="px-3 py-3 text-muted-foreground">
                <SpecialtyChips specialties={row.specialties} />
              </td>
              <td className="px-3 py-3 text-muted-foreground tabular-nums">
                {row.phone ? formatPhone(row.phone) : <EmptyCell />}
              </td>
              <RowActions
                editLabel={`Edit ${row.name}`}
                deleteLabel={`Remove ${row.name}`}
                onEdit={() => setModal({ mode: 'edit', member: row })}
                onDelete={() => void confirmDelete(row)}
                editDisabled={!options.data}
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
            label="team members"
          />
        )}
      </TableCard>

      {modal.mode !== 'closed' && options.data && (
        <StaffFormModal
          member={modal.mode === 'edit' ? modal.member : null}
          options={options.data}
          onClose={() => setModal({ mode: 'closed' })}
          onSaved={onSaved}
        />
      )}

      <Toast message={directory.toast} />
    </div>
  )
}
