import { useId, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CalendarDays, LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'
import type {
  Appointment,
  AppointmentOptions,
  AppointmentPayload,
  AppointmentStatus,
  StaffOption,
} from '@/types/appointment'
import type { FieldErrors } from '@/lib/apiErrors'
import {
  FormField as Field,
  FormErrorBanner,
  FormModal,
} from '@/components/admin/FormModal'
import { getErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import {
  addMinutes,
  formatDurationRange,
  formatPesoRange,
  formatTime,
  todayIso,
} from '@/lib/format'
import {
  controlClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/formStyles'
import { cn } from '@/lib/utils'
import { appointmentService } from '@/services/appointmentService'

type FormState = {
  customer_name: string
  service_id: string
  staff_id: string
  date: string
  start_time: string
  status: AppointmentStatus
}

function specialisesIn(staff: StaffOption, serviceId: number): boolean {
  return staff.specialties.some((s) => s.id === serviceId)
}

function staffLabel(staff: StaffOption): string {
  return staff.specialties.length
    ? `${staff.name} · ${staff.specialties.map((s) => s.name).join(', ')}`
    : staff.name
}

function StaffOptions({ staff }: { staff: Array<StaffOption> }) {
  return staff.map((s) => (
    <option key={s.id} value={s.id}>
      {staffLabel(s)}
    </option>
  ))
}

function initialState(
  appointment: Appointment | null,
  options: AppointmentOptions,
  defaultDate?: string,
): FormState {
  if (appointment) {
    return {
      customer_name: appointment.customer.name,
      service_id: String(appointment.service.id),
      staff_id: String(appointment.staff.id),
      date: appointment.date,
      start_time: appointment.start_time,
      status: appointment.status,
    }
  }
  const firstService = options.services.at(0)
  const firstStaff =
    options.staff.find(
      (s) => firstService && specialisesIn(s, firstService.id),
    ) ?? options.staff.at(0)
  return {
    customer_name: '',
    service_id: firstService ? String(firstService.id) : '',
    staff_id: firstStaff ? String(firstStaff.id) : '',
    date: defaultDate ?? todayIso(),
    start_time: '',
    status: 'pending',
  }
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (form.customer_name.trim().length < 2)
    errors.customer_name = 'Enter the customer name.'
  if (!form.service_id) errors.service_id = 'Choose a service.'
  if (!form.staff_id) errors.staff_id = 'Choose a staff member.'
  if (!form.date) errors.date = 'Choose a date.'
  if (!form.start_time) errors.start_time = 'Choose a time.'
  return errors
}

export function AppointmentFormModal({
  appointment,
  options,
  defaultDate,
  onClose,
  onSaved,
}: {
  appointment: Appointment | null
  options: AppointmentOptions
  /** Pre-filled date for a new booking (`YYYY-MM-DD`); defaults to today. */
  defaultDate?: string
  onClose: () => void
  onSaved: (appointment: Appointment, mode: 'created' | 'updated') => void
}) {
  const uid = useId()
  const isEdit = appointment !== null
  const [form, setForm] = useState<FormState>(() =>
    initialState(appointment, options, defaultDate),
  )
  const [errors, setErrors] = useState<FieldErrors>({})

  const mutation = useMutation({
    mutationFn: (payload: AppointmentPayload) =>
      isEdit
        ? appointmentService.update(appointment.id, payload)
        : appointmentService.create(payload),
    onSuccess: (saved) => onSaved(saved, isEdit ? 'updated' : 'created'),
    onError: (error) => setErrors(getFieldErrors(error)),
  })

  const saving = mutation.isPending

  const set = <TKey extends keyof FormState>(
    key: TKey,
    value: FormState[TKey],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // Keep the current values selectable when editing a booking whose service or
  // staff member has since been deactivated or deleted.
  const services = useMemo(() => {
    if (
      !appointment ||
      options.services.some((s) => s.id === appointment.service.id)
    ) {
      return options.services
    }
    return [...options.services, appointment.service]
  }, [appointment, options.services])
  const staffList = useMemo(() => {
    if (
      !appointment ||
      options.staff.some((s) => s.id === appointment.staff.id)
    ) {
      return options.staff
    }
    return [...options.staff, { ...appointment.staff, specialties: [] }]
  }, [appointment, options.staff])

  const service = services.find((s) => String(s.id) === form.service_id)
  const specialists = service
    ? staffList.filter((s) => specialisesIn(s, service.id))
    : []
  const otherStaff = staffList.filter((s) => !specialists.includes(s))
  const staff = staffList.find((s) => String(s.id) === form.staff_id)
  const endTime =
    service && form.start_time
      ? addMinutes(form.start_time, service.duration_max_minutes)
      : null

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
      customer_name: form.customer_name.trim(),
      service_id: Number(form.service_id),
      staff_id: Number(form.staff_id),
      date: form.date,
      start_time: form.start_time,
      status: form.status,
    })
  }

  const generalError =
    mutation.isError && !Object.keys(getFieldErrors(mutation.error)).length
      ? getErrorMessage(mutation.error)
      : null

  const ids = {
    customer: `${uid}-customer`,
    service: `${uid}-service`,
    staff: `${uid}-staff`,
    date: `${uid}-date`,
    time: `${uid}-time`,
    status: `${uid}-status`,
    customers: `${uid}-customers`,
  }

  return (
    <FormModal
      title={isEdit ? 'Edit appointment' : 'Book an appointment'}
      busy={saving}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="mt-6">
        <FormErrorBanner message={generalError} />

        <fieldset
          disabled={saving}
          className="grid gap-x-4 gap-y-4 sm:grid-cols-2"
        >
          <Field
            id={ids.customer}
            label="Customer"
            error={errors.customer_name}
          >
            <input
              id={ids.customer}
              list={ids.customers}
              autoComplete="off"
              autoFocus
              value={form.customer_name}
              onChange={(e) => set('customer_name', e.target.value)}
              placeholder="Customer name"
              maxLength={120}
              aria-invalid={Boolean(errors.customer_name)}
              className={cn(
                controlClass,
                errors.customer_name ? 'border-rose-300' : 'border-border',
              )}
            />
            <datalist id={ids.customers}>
              {options.customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </Field>

          <Field id={ids.service} label="Service" error={errors.service_id}>
            <select
              id={ids.service}
              value={form.service_id}
              onChange={(e) => set('service_id', e.target.value)}
              aria-invalid={Boolean(errors.service_id)}
              className={cn(
                controlClass,
                'font-medium',
                errors.service_id ? 'border-rose-300' : 'border-border',
              )}
            >
              {!services.length && <option value="">No services yet</option>}
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id={ids.staff} label="Staff member" error={errors.staff_id}>
            <select
              id={ids.staff}
              value={form.staff_id}
              onChange={(e) => set('staff_id', e.target.value)}
              aria-invalid={Boolean(errors.staff_id)}
              className={cn(
                controlClass,
                'font-medium',
                errors.staff_id ? 'border-rose-300' : 'border-border',
              )}
            >
              {!staffList.length && <option value="">No staff yet</option>}
              {service && specialists.length && otherStaff.length ? (
                <>
                  <optgroup label={`Specialists in ${service.name}`}>
                    <StaffOptions staff={specialists} />
                  </optgroup>
                  <optgroup label="Other team members">
                    <StaffOptions staff={otherStaff} />
                  </optgroup>
                </>
              ) : (
                <StaffOptions staff={staffList} />
              )}
            </select>
          </Field>

          <Field id={ids.date} label="Date" error={errors.date}>
            <input
              id={ids.date}
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              aria-invalid={Boolean(errors.date)}
              className={cn(
                controlClass,
                'font-medium',
                errors.date ? 'border-rose-300' : 'border-border',
              )}
            />
          </Field>

          <Field id={ids.time} label="Time" error={errors.start_time}>
            <input
              id={ids.time}
              type="time"
              step={300}
              value={form.start_time}
              onChange={(e) => set('start_time', e.target.value)}
              aria-invalid={Boolean(errors.start_time)}
              className={cn(
                controlClass,
                'font-medium',
                errors.start_time ? 'border-rose-300' : 'border-border',
              )}
            />
          </Field>

          <Field id={ids.status} label="Status" error={errors.status}>
            <select
              id={ids.status}
              value={form.status}
              onChange={(e) =>
                set('status', e.target.value as AppointmentStatus)
              }
              className={cn(controlClass, 'border-border font-medium')}
            >
              {options.statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>

        <div className="mt-5 flex gap-3 rounded-xl border border-primary/15 bg-secondary/60 px-4 py-3.5">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 text-xs">
            <p className="text-sm font-semibold text-foreground">
              Booking details
            </p>
            {service ? (
              <p className="mt-0.5 text-muted-foreground">
                {service.name} ·{' '}
                {formatDurationRange(
                  service.duration_min_minutes,
                  service.duration_max_minutes,
                )}{' '}
                · {formatPesoRange(service.price_min, service.price_max)}
                {form.start_time &&
                  (endTime ? (
                    <>
                      {' '}
                      · {formatTime(form.start_time)} – {formatTime(endTime)}
                      {staff && ` with ${staff.name}`}
                    </>
                  ) : (
                    <span className="text-rose-600"> · runs past midnight</span>
                  ))}
              </p>
            ) : (
              <p className="mt-0.5 text-muted-foreground">
                Choose a service to see its duration and price.
              </p>
            )}
            <p className="mt-0.5 text-muted-foreground/80">
              Bookings reserve the longest duration. Staff can&apos;t be
              double-booked; cancelled bookings free up the slot.
            </p>
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
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save appointment'}
          </button>
        </div>
      </form>
    </FormModal>
  )
}
