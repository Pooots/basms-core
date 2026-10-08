import { useEffect, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { PaginationMeta } from '@/types/pagination'
import { useAdminSearch } from '@/components/admin/AdminSearch'
import { useDialog } from '@/components/ui/AppDialog'
import { getErrorMessage } from '@/lib/apiErrors'
import { downloadBlob } from '@/lib/download'
import { todayIso } from '@/lib/format'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { useToast } from '@/lib/useToast'

/**
 * Every admin list shows names or counts from the others (bookings show the
 * customer, service and staff; staff show their specialty services), so a change
 * to any of them refreshes all. Booking changes can also raise bell alerts, and
 * the dashboard counts all of them.
 */
export const RELATED_RESOURCES = [
  'appointments',
  'customers',
  'services',
  'staff',
  'notifications',
  'dashboard',
] as const

/** Shared state for a searchable, paginated admin directory with delete and CSV export. */
export function useDirectory<TRow extends { id: number }>({
  resource,
  list,
  remove,
  exportCsv,
  deletedMessage,
}: {
  /** Query-key root and export file prefix, e.g. `customers`. */
  resource: string
  list: (params: {
    search: string
    page: number
  }) => Promise<{ data: Array<TRow>; meta: PaginationMeta }>
  remove: (id: number) => Promise<void>
  exportCsv: (search: string) => Promise<Blob>
  deletedMessage: string
}) {
  const queryClient = useQueryClient()
  const dialog = useDialog()
  const { query } = useAdminSearch()
  const search = useDebouncedValue(query.trim(), 300)
  const [page, setPage] = useState(1)
  const [toast, setToast] = useToast()

  useEffect(() => setPage(1), [search])

  const listQuery = useQuery({
    queryKey: [resource, 'list', { search, page }],
    queryFn: () => list({ search, page }),
    placeholderData: keepPreviousData,
  })

  const meta = listQuery.data?.meta

  // Past the last page after a delete → step back.
  useEffect(() => {
    if (meta && meta.last_page > 0 && page > meta.last_page) {
      setPage(meta.last_page)
    }
  }, [meta, page])

  const invalidate = () => {
    for (const key of RELATED_RESOURCES) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  }

  const removeMutation = useMutation({
    mutationFn: (row: TRow) => remove(row.id),
    onSuccess: () => {
      setToast(deletedMessage)
      invalidate()
    },
    onError: (error) => {
      void dialog.alert({
        title: 'Could not delete',
        message: getErrorMessage(error),
      })
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => exportCsv(search),
    onSuccess: (blob) => downloadBlob(blob, `${resource}-${todayIso()}.csv`),
    onError: () => {
      void dialog.alert({
        title: 'Export failed',
        message: `Could not export the ${resource} list. Please try again.`,
      })
    },
  })

  return {
    dialog,
    search,
    setPage,
    listQuery,
    rows: listQuery.data?.data ?? [],
    meta,
    total: meta?.total ?? 0,
    toast,
    setToast,
    invalidate,
    removeMutation,
    exportMutation,
  }
}
