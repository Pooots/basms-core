import { useEffect, useId } from 'react'
import { AlertCircle, X } from 'lucide-react'
import type { ReactNode } from 'react'

export function FormModal({
  title,
  busy,
  onClose,
  children,
}: {
  title: string
  /** Blocks closing while a save is in flight. */
  busy: boolean
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, busy])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto px-4 py-6">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !busy && onClose()}
        className="animate-in fade-in absolute inset-0 bg-navy/45 backdrop-blur-[2px] duration-200"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-in fade-in zoom-in-95 relative w-full max-w-[560px] rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgb(11_22_51/0.55)] duration-200 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-primary uppercase">
              BASMS
            </p>
            <h2
              id={titleId}
              className="mt-1 font-display text-xl font-medium text-foreground"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold text-muted-foreground"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormErrorBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  )
}
