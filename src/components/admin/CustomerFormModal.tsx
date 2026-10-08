import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LoaderCircle, Users } from 'lucide-react'
import type { FormEvent } from 'react'
import type { Customer, CustomerPayload } from '@/types/customer'
import type { FieldErrors } from '@/lib/apiErrors'
import {
  FormErrorBanner,
  FormField,
  FormModal,
} from '@/components/admin/FormModal'
import { getErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { formatDate, formatPhone } from '@/lib/format'
import { PHONE_MESSAGE, isValidPhone, normalizePhone } from '@/lib/phone'
import {
  controlClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/formStyles'
import { cn } from '@/lib/utils'
import { customerService } from '@/services/customerService'

type FormState = { name: string; phone: string; email: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (form.name.trim().length < 2) errors.name = 'Enter the full name.'
  if (normalizePhone(form.phone) && !isValidPhone(form.phone)) {
    errors.phone = PHONE_MESSAGE
  }
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  return errors
}

function bookingSummary(customer: Customer): string {
  const parts = [
    `${customer.appointments_count} booking${customer.appointments_count === 1 ? '' : 's'}`,
  ]
  if (customer.upcoming_appointments_count) {
    parts.push(`${customer.upcoming_appointments_count} upcoming`)
  }
  if (customer.last_visit)
    parts.push(`last visit ${formatDate(customer.last_visit)}`)
  return parts.join(' · ')
}

export function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null
  onClose: () => void
  onSaved: (customer: Customer, mode: 'created' | 'updated') => void
}) {
  const uid = useId()
  const isEdit = customer !== null
  const [form, setForm] = useState<FormState>(() => ({
    name: customer?.name ?? '',
    phone: customer?.phone ? formatPhone(customer.phone) : '',
    email: customer?.email ?? '',
  }))
  const [errors, setErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: (payload: CustomerPayload) =>
      isEdit
        ? customerService.update(customer.id, payload)
        : customerService.create(payload),
    onSuccess: (saved) => onSaved(saved, isEdit ? 'updated' : 'created'),
    onError: (error) => setErrors(getFieldErrors(error)),
  })
  const saving = mutation.isPending

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }

    mutation.reset()
    mutation.mutate({
      name: form.name.trim(),
      phone: normalizePhone(form.phone) || null,
      email: form.email.trim() || null,
    })
  }

  const generalError =
    mutation.isError && !Object.keys(getFieldErrors(mutation.error)).length
      ? getErrorMessage(mutation.error)
      : null

  const ids = {
    name: `${uid}-name`,
    phone: `${uid}-phone`,
    email: `${uid}-email`,
  }

  return (
    <FormModal
      title={isEdit ? 'Edit customer' : 'Add customer'}
      busy={saving}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="mt-6">
        <FormErrorBanner message={generalError} />

        <fieldset disabled={saving} className="grid gap-4">
          <FormField id={ids.name} label="Full name" error={errors.name}>
            <input
              id={ids.name}
              autoComplete="off"
              autoFocus
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Enter full name"
              maxLength={120}
              aria-invalid={Boolean(errors.name)}
              className={cn(
                controlClass,
                errors.name ? 'border-rose-300' : 'border-border',
              )}
            />
          </FormField>

          <FormField id={ids.phone} label="Phone number" error={errors.phone}>
            <input
              id={ids.phone}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Enter phone number"
              maxLength={24}
              aria-invalid={Boolean(errors.phone)}
              className={cn(
                controlClass,
                errors.phone ? 'border-rose-300' : 'border-border',
              )}
            />
          </FormField>

          <FormField id={ids.email} label="Email address" error={errors.email}>
            <input
              id={ids.email}
              type="email"
              autoComplete="off"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="Enter email address"
              maxLength={255}
              aria-invalid={Boolean(errors.email)}
              className={cn(
                controlClass,
                errors.email ? 'border-rose-300' : 'border-border',
              )}
            />
          </FormField>
        </fieldset>

        <div className="mt-5 flex gap-3 rounded-xl border border-primary/15 bg-secondary/60 px-4 py-3.5">
          <Users className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 text-xs">
            <p className="text-sm font-semibold text-foreground">
              Record details
            </p>
            <p className="mt-0.5 text-muted-foreground">
              This information is used across bookings and reports.
            </p>
            {customer && (
              <p className="mt-0.5 text-muted-foreground/80">
                {bookingSummary(customer)}
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save customer'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}
