import {
  AlertCircle,
  Download,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { getErrorMessage } from '@/lib/apiErrors'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="status-rise flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function PrimaryAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_-12px_rgb(79_107_237/0.9)] transition hover:bg-[#4560e0] disabled:opacity-60"
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export function TableCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="status-rise-delay mt-7 rounded-xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {actions}
      </div>
      <div className="overflow-x-auto px-5 pb-5">{children}</div>
    </section>
  )
}

export function ExportButton({
  onClick,
  pending,
  disabled,
}: {
  onClick: () => void
  pending: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || disabled}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : (
        <Download className="size-3.5" />
      )}
      Export
    </button>
  )
}

export type Column = { label: string; className?: string }

export function DataTable<TRow extends { id: number }>({
  columns,
  minWidth = 720,
  query,
  rows,
  errorTitle,
  empty,
  renderRow,
}: {
  columns: Array<Column>
  minWidth?: number
  query: UseQueryResult<unknown>
  rows: Array<TRow>
  errorTitle: string
  empty: { icon: LucideIcon; title: string; hint: string }
  /** The row's `<td>` cells. */
  renderRow: (row: TRow) => ReactNode
}) {
  const EmptyIcon = empty.icon

  return (
    <table className="w-full text-left text-sm" style={{ minWidth }}>
      <thead>
        <tr className="bg-muted text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          {columns.map((c, i) => (
            <th
              key={c.label}
              className={cn(
                'px-3 py-2.5',
                i === 0 && 'rounded-l-lg',
                i === columns.length - 1 && 'rounded-r-lg',
                c.className,
              )}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody
        className={cn(
          'divide-y divide-border transition-opacity',
          query.isFetching && !query.isLoading && 'opacity-60',
        )}
      >
        {query.isLoading ? (
          Array.from({ length: 5 }, (_, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.label} className="px-3 py-4">
                  <span className="block h-3.5 w-24 animate-pulse rounded bg-muted" />
                </td>
              ))}
            </tr>
          ))
        ) : query.isError ? (
          <tr>
            <td colSpan={columns.length} className="px-3 py-14 text-center">
              <AlertCircle className="mx-auto size-8 text-rose-500" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                {errorTitle}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {getErrorMessage(query.error)}
              </p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Try again
              </button>
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-3 py-14 text-center">
              <EmptyIcon className="mx-auto size-8 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                {empty.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{empty.hint}</p>
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-muted/50">
              {renderRow(row)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export function RowActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  editDisabled,
  deleteDisabled,
}: {
  editLabel: string
  deleteLabel: string
  onEdit: () => void
  onDelete: () => void
  editDisabled?: boolean
  deleteDisabled?: boolean
}) {
  return (
    <td className="px-3 py-3">
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={editDisabled}
          aria-label={editLabel}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:bg-secondary hover:text-primary disabled:opacity-50"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleteDisabled}
          aria-label={deleteLabel}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          <Trash2 className="size-3.5" />
        </button>
      </span>
    </td>
  )
}

export function EmptyCell() {
  return <span className="text-muted-foreground/50">—</span>
}
