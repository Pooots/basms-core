import { useId, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, LoaderCircle, PersonStanding, Plus } from 'lucide-react'
import type { FormEvent } from 'react'
import type { StaffMember, StaffOptions, StaffPayload } from '@/types/staff'
import type { FieldErrors } from '@/lib/apiErrors'
import {
  FormErrorBanner,
  FormField,
  FormModal,
} from '@/components/admin/FormModal'
import { getErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { formatPhone, pluralize } from '@/lib/format'
import {
  controlClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/formStyles'
import { PHONE_MESSAGE, isValidPhone, normalizePhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { staffService } from '@/services/staffService'

type FormState = { name: string; service_ids: Array<number>; phone: string }
type TextField = 'name' | 'phone'

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (form.name.trim().length < 2) errors.name = 'Enter the full name.'
  if (!normalizePhone(form.phone)) errors.phone = 'Enter a contact number.'
  else if (!isValidPhone(form.phone)) errors.phone = PHONE_MESSAGE
  return errors
}

function bookingSummary(member: StaffMember): string {
  const parts = [pluralize(member.appointments_count, 'booking')]
  if (member.upcoming_appointments_count) {
    parts.push(`${member.upcoming_appointments_count} upcoming`)
  }
  return parts.join(' · ')
}

export function StaffFormModal({
  member,
  options,
  onClose,
  onSaved,
}: {
  member: StaffMember | null
  options: StaffOptions
  onClose: () => void
  onSaved: (member: StaffMember, mode: 'created' | 'updated') => void
}) {
  const uid = useId()
  const isEdit = member !== null
  const [form, setForm] = useState<FormState>(() => ({
    name: member?.name ?? '',
    service_ids: member?.specialties.map((s) => s.id) ?? [],
    phone: member?.phone ? formatPhone(member.phone) : '',
  }))
  const [errors, setErrors] = useState<FieldErrors>({})

  // Active services, plus any deactivated ones this member still has so they can be kept or removed.
  const choices = [
    ...options.services,
    ...(member?.specialties ?? []).filter(
      (s) => !options.services.some((o) => o.id === s.id),
    ),
  ]

  const mutation = useMutation({
    mutationFn: (payload: StaffPayload) =>
      isEdit
        ? staffService.update(member.id, payload)
        : staffService.create(payload),
    onSuccess: (saved) => onSaved(saved, isEdit ? 'updated' : 'created'),
    onError: (error) => setErrors(getFieldErrors(error)),
  })
  const saving = mutation.isPending

  const set = (key: TextField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const toggleSpecialty = (id: number) => {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter((x) => x !== id)
        : [...prev.service_ids, id],
    }))
    setErrors((prev) => ({ ...prev, service_ids: undefined }))
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
      service_ids: form.service_ids,
      phone: normalizePhone(form.phone),
    })
  }

  const generalError =
    mutation.isError && !Object.keys(getFieldErrors(mutation.error)).length
      ? getErrorMessage(mutation.error)
      : null

  const ids = {
    name: `${uid}-name`,
    specialty: `${uid}-specialty`,
    phone: `${uid}-phone`,
  }

  return (
    <FormModal
      title={isEdit ? 'Edit team member' : 'Add team member'}
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

          <div
            role="group"
            aria-labelledby={ids.specialty}
            aria-describedby={
              errors.service_ids ? `${ids.specialty}-error` : undefined
            }
          >
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span
                id={ids.specialty}
                className="text-xs font-semibold text-muted-foreground"
              >
                Specialties
              </span>
              <span
                aria-live="polite"
                className="text-[11px] text-muted-foreground/80"
              >
                {form.service_ids.length
                  ? `${form.service_ids.length} selected`
                  : 'Optional · pick all that apply'}
              </span>
            </div>
            {choices.length ? (
              <div
                className={cn(
                  'flex flex-wrap gap-2 rounded-xl border p-2.5',
                  errors.service_ids ? 'border-rose-300' : 'border-border',
                )}
              >
                {choices.map((s) => {
                  const checked = form.service_ids.includes(s.id)
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors select-none has-focus-visible:ring-2 has-focus-visible:ring-primary/40',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-secondary/60',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleSpecialty(s.id)}
                      />
                      {checked ? (
                        <Check className="size-3.5" aria-hidden />
                      ) : (
                        <Plus
                          className="size-3.5 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                      {s.name}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-3.5 py-3 text-xs text-muted-foreground">
                Add services first to assign specialties.
              </p>
            )}
            {errors.service_ids && (
              <p
                id={`${ids.specialty}-error`}
                className="mt-1.5 text-xs text-rose-600"
              >
                {errors.service_ids}
              </p>
            )}
          </div>

          <FormField id={ids.phone} label="Contact number" error={errors.phone}>
            <input
              id={ids.phone}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Enter contact number"
              maxLength={24}
              aria-invalid={Boolean(errors.phone)}
              className={cn(
                controlClass,
                errors.phone ? 'border-rose-300' : 'border-border',
              )}
            />
          </FormField>
        </fieldset>

        <div className="mt-5 flex gap-3 rounded-xl border border-primary/15 bg-secondary/60 px-4 py-3.5">
          <PersonStanding className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 text-xs">
            <p className="text-sm font-semibold text-foreground">
              Record details
            </p>
            <p className="mt-0.5 text-muted-foreground">
              This information is used across bookings and reports.
            </p>
            {member && (
              <p className="mt-0.5 text-muted-foreground/80">
                {bookingSummary(member)}
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save team member'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}
