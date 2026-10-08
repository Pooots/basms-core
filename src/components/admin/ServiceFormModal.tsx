import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle, Sparkles } from 'lucide-react'
import type { FormEvent } from 'react'
import type { Service, ServicePayload } from '@/types/service'
import type { FieldErrors } from '@/lib/apiErrors'
import {
  FormErrorBanner,
  FormField,
  FormModal,
} from '@/components/admin/FormModal'
import { getErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import {
  formatDuration,
  formatDurationRange,
  formatPesoRange,
  pluralize,
} from '@/lib/format'
import {
  controlClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/formStyles'
import {
  durationInputValue,
  parseDuration,
  parsePriceRange,
  priceInputValue,
} from '@/lib/serviceInput'
import { cn } from '@/lib/utils'
import { serviceService } from '@/services/serviceService'

type FormState = { name: string; duration: string; price: string }

/** API errors come back per min/max column; the form shows one per field. */
function toFormErrors(errors: FieldErrors): FieldErrors {
  return {
    name: errors.name,
    duration: errors.duration_min_minutes ?? errors.duration_max_minutes,
    price: errors.price_min ?? errors.price_max,
  }
}

function bookingSummary(service: Service): string {
  const parts = [pluralize(service.appointments_count, 'booking')]
  if (service.upcoming_appointments_count) {
    parts.push(`${service.upcoming_appointments_count} upcoming`)
  }
  return parts.join(' · ')
}

export function ServiceFormModal({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null
  onClose: () => void
  onSaved: (service: Service, mode: 'created' | 'updated') => void
}) {
  const uid = useId()
  const isEdit = service !== null
  const [form, setForm] = useState<FormState>(() => ({
    name: service?.name ?? '',
    duration: service
      ? durationInputValue(
          service.duration_min_minutes,
          service.duration_max_minutes,
        )
      : '',
    price: service ? priceInputValue(service.price_min, service.price_max) : '',
  }))
  const [errors, setErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: (payload: ServicePayload) =>
      isEdit
        ? serviceService.update(service.id, payload)
        : serviceService.create(payload),
    onSuccess: (saved) => onSaved(saved, isEdit ? 'updated' : 'created'),
    onError: (error) => setErrors(toFormErrors(getFieldErrors(error))),
  })
  const saving = mutation.isPending

  const duration = parseDuration(form.duration)
  const price = parsePriceRange(form.price)

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const clientErrors: FieldErrors = {}
    if (form.name.trim().length < 2)
      clientErrors.name = 'Enter the service name.'
    if (!duration.ok) clientErrors.duration = duration.error
    if (!price.ok) clientErrors.price = price.error
    if (!duration.ok || !price.ok || clientErrors.name) {
      setErrors(clientErrors)
      return
    }

    mutation.reset()
    mutation.mutate({
      name: form.name.trim(),
      duration_min_minutes: duration.value.min,
      duration_max_minutes: duration.value.max,
      price_min: price.value.min,
      price_max: price.value.max,
    })
  }

  const generalError =
    mutation.isError && !Object.keys(getFieldErrors(mutation.error)).length
      ? getErrorMessage(mutation.error)
      : null

  const ids = {
    name: `${uid}-name`,
    duration: `${uid}-duration`,
    price: `${uid}-price`,
  }

  return (
    <FormModal
      title={isEdit ? 'Edit service' : 'Add service'}
      busy={saving}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="mt-6">
        <FormErrorBanner message={generalError} />

        <fieldset disabled={saving} className="grid gap-4">
          <FormField id={ids.name} label="Service name" error={errors.name}>
            <input
              id={ids.name}
              autoComplete="off"
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Enter service name"
              maxLength={120}
              aria-invalid={Boolean(errors.name)}
              className={cn(
                controlClass,
                errors.name ? 'border-rose-300' : 'border-border',
              )}
            />
          </FormField>

          <FormField id={ids.duration} label="Duration" error={errors.duration}>
            <input
              id={ids.duration}
              autoComplete="off"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              placeholder="Enter duration"
              maxLength={40}
              aria-invalid={Boolean(errors.duration)}
              aria-describedby={`${uid}-preview`}
              className={cn(
                controlClass,
                errors.duration ? 'border-rose-300' : 'border-border',
              )}
            />
          </FormField>

          <FormField id={ids.price} label="Price range" error={errors.price}>
            <input
              id={ids.price}
              autoComplete="off"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="Enter price range"
              maxLength={40}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={`${uid}-preview`}
              className={cn(
                controlClass,
                errors.price ? 'border-rose-300' : 'border-border',
              )}
            />
          </FormField>
        </fieldset>

        <div className="mt-5 flex gap-3 rounded-xl border border-primary/15 bg-secondary/60 px-4 py-3.5">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div id={`${uid}-preview`} className="min-w-0 text-xs">
            <p className="text-sm font-semibold text-foreground">
              Record details
            </p>
            <p className="mt-0.5 text-muted-foreground">
              This information is used across bookings and reports.
            </p>
            {duration.ok && price.ok ? (
              <p className="mt-0.5 text-muted-foreground/80">
                Reads as{' '}
                <span className="font-semibold text-foreground">
                  {formatDurationRange(duration.value.min, duration.value.max)}{' '}
                  · {formatPesoRange(price.value.min, price.value.max)}
                </span>
                . Bookings reserve {formatDuration(duration.value.max)}.
              </p>
            ) : (
              <p className="mt-0.5 text-muted-foreground/80">
                e.g. “10-20 mins” or “3-5 hours”, and “₱70-₱100” or “₱10k-₱20k”.
              </p>
            )}
            {service && (
              <p className="mt-0.5 text-muted-foreground/80">
                {bookingSummary(service)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={primaryButtonClass}
          >
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save service'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}
