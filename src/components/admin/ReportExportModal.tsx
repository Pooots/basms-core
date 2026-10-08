import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ReportFormat, ReportRange } from '@/types/report'
import {
  FormField as Field,
  FormErrorBanner,
  FormModal,
} from '@/components/admin/FormModal'
import { getErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import {
  RANGE_PRESETS,
  formatRange,
  rangeDays,
  rangeError,
} from '@/lib/dateRange'
import { downloadBlob } from '@/lib/download'
import { pluralize } from '@/lib/format'
import {
  controlClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/formStyles'
import { cn } from '@/lib/utils'
import { reportService } from '@/services/reportService'

const FORMATS: Array<{
  value: ReportFormat
  label: string
  hint: string
  icon: LucideIcon
}> = [
  {
    value: 'pdf',
    label: 'PDF report',
    hint: 'Designed summary with charts, staff performance and every booking.',
    icon: FileText,
  },
  {
    value: 'csv',
    label: 'CSV spreadsheet',
    hint: 'Booking list for Excel or Google Sheets.',
    icon: FileSpreadsheet,
  },
]

export function ReportExportModal({
  initialRange,
  search,
  onClose,
  onExported,
}: {
  initialRange: ReportRange
  /** Top-bar search; the export is narrowed the same way as the page. */
  search: string
  onClose: () => void
  onExported: (filename: string) => void
}) {
  const uid = useId()
  const [range, setRange] = useState(initialRange)
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => reportService.export({ ...range, search, format }),
    onSuccess: (blob) => {
      const filename = `basms-report-${range.from}-to-${range.to}.${format}`
      downloadBlob(blob, filename)
      onExported(filename)
    },
    onError: (err) => {
      const fields = getFieldErrors(err)
      setError(fields.to ?? fields.from ?? null)
    },
  })
  const exporting = mutation.isPending

  const update = (next: Partial<ReportRange>) => {
    setRange((prev) => ({ ...prev, ...next }))
    setError(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (exporting) return
    const invalid = rangeError(range.from, range.to)
    if (invalid) {
      setError(invalid)
      return
    }
    mutation.reset()
    mutation.mutate()
  }

  const generalError =
    mutation.isError && !Object.keys(getFieldErrors(mutation.error)).length
      ? getErrorMessage(mutation.error, 'Could not export the report.')
      : null
  const valid = !rangeError(range.from, range.to)
  const ids = { from: `${uid}-from`, to: `${uid}-to` }

  return (
    <FormModal title="Download report" busy={exporting} onClose={onClose}>
      <form onSubmit={submit} noValidate className="mt-6">
        <FormErrorBanner message={generalError} />

        <fieldset disabled={exporting} className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Date range
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RANGE_PRESETS.map((preset) => {
                const value = preset.range()
                const active =
                  value.from === range.from && value.to === range.to
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => update(value)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition',
                      active
                        ? 'border-primary bg-secondary text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field id={ids.from} label="From">
                <input
                  id={ids.from}
                  type="date"
                  value={range.from}
                  max={range.to || undefined}
                  onChange={(e) => update({ from: e.target.value })}
                  className={cn(controlClass, 'border-border font-medium')}
                />
              </Field>
              <Field id={ids.to} label="To">
                <input
                  id={ids.to}
                  type="date"
                  value={range.to}
                  min={range.from || undefined}
                  onChange={(e) => update({ to: e.target.value })}
                  aria-invalid={Boolean(error)}
                  className={cn(
                    controlClass,
                    'font-medium',
                    error ? 'border-rose-300' : 'border-border',
                  )}
                />
              </Field>
            </div>
            {error ? (
              <p role="alert" className="mt-1.5 text-xs text-rose-600">
                {error}
              </p>
            ) : (
              valid && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {formatRange(range.from, range.to)} ·{' '}
                  {pluralize(rangeDays(range.from, range.to), 'day')}
                </p>
              )
            )}
          </div>

          <div role="radiogroup" aria-label="File format">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Format
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {FORMATS.map((option) => {
                const Icon = option.icon
                const active = format === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFormat(option.value)}
                    className={cn(
                      'flex gap-3 rounded-xl border p-3.5 text-left transition',
                      active
                        ? 'border-primary bg-secondary/60 ring-1 ring-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    <Icon
                      className={cn(
                        'mt-0.5 size-5 shrink-0',
                        active ? 'text-primary' : 'text-muted-foreground',
                      )}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {search && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Only bookings matching “{search}” will be included.
            </p>
          )}
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={exporting}
            className={primaryButtonClass}
          >
            {exporting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {exporting ? 'Exporting…' : 'Export now'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}
