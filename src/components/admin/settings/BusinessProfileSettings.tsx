import { useId, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ImageUp, LoaderCircle, Trash2 } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import type { FieldErrors } from '@/lib/apiErrors'
import type { BusinessProfile, SettingsResponse } from '@/types/settings'
import {
  FormField as Field,
  FormErrorBanner,
} from '@/components/admin/FormModal'
import { useDialog } from '@/components/ui/AppDialog'
import { getErrorMessage, getFieldErrors } from '@/lib/apiErrors'
import { formatPhone } from '@/lib/format'
import { controlClass, primaryButtonClass } from '@/lib/formStyles'
import { PHONE_MESSAGE, isValidPhone, normalizePhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { apiAssetUrl, settingsService } from '@/services/settingsService'

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const LOGO_MAX_BYTES = 2 * 1024 * 1024
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FormState = { name: string; phone: string; email: string; address: string }

function toForm(profile: BusinessProfile): FormState {
  return {
    name: profile.name,
    phone: formatPhone(profile.phone),
    email: profile.email,
    address: profile.address ?? '',
  }
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (form.name.trim().length < 2) errors.name = 'Enter the business name.'
  if (!form.phone.trim()) errors.phone = 'Enter the business contact number.'
  else if (!isValidPhone(form.phone)) errors.phone = PHONE_MESSAGE
  if (!EMAIL_PATTERN.test(form.email.trim()))
    errors.email = 'Enter a valid email address.'
  return errors
}

/** Remount with a new `key` when the saved details change so the form resets. */
export function BusinessProfileSettings({
  profile,
  onToast,
}: {
  profile: BusinessProfile
  onToast: (message: string) => void
}) {
  const uid = useId()
  const queryClient = useQueryClient()
  const dialog = useDialog()
  const fileInput = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(() => toForm(profile))
  const [errors, setErrors] = useState<FieldErrors>({})

  const store = (data: SettingsResponse) =>
    queryClient.setQueryData<SettingsResponse>(['settings'], data)

  const save = useMutation({
    mutationFn: () =>
      settingsService.updateProfile({
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        email: form.email.trim(),
        address: form.address.trim() || null,
      }),
    onSuccess: (data) => {
      store(data)
      onToast(data.message)
    },
    onError: (error) => setErrors(getFieldErrors(error)),
  })

  const upload = useMutation({
    mutationFn: settingsService.uploadLogo,
    onSuccess: (data) => {
      store(data)
      onToast(data.message)
    },
    onError: (error) =>
      void dialog.alert({
        title: 'Could not upload logo',
        message: getFieldErrors(error).logo ?? getErrorMessage(error),
      }),
  })

  const remove = useMutation({
    mutationFn: settingsService.removeLogo,
    onSuccess: (data) => {
      store(data)
      onToast(data.message)
    },
    onError: (error) =>
      void dialog.alert({
        title: 'Could not remove logo',
        message: getErrorMessage(error),
      }),
  })

  const pickLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!LOGO_TYPES.includes(file.type)) {
      void dialog.alert({
        title: 'Unsupported file',
        message: 'Upload a PNG, JPG or WebP image.',
      })
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      void dialog.alert({
        title: 'File too large',
        message: 'The logo must be 2 MB or smaller.',
      })
      return
    }
    upload.mutate(file)
  }

  const confirmRemove = async () => {
    const ok = await dialog.confirm({
      title: 'Remove logo?',
      message: 'Reports and emails will show your business initial instead.',
      confirmLabel: 'Remove',
      tone: 'danger',
    })
    if (ok) remove.mutate()
  }

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (save.isPending) return
    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    save.reset()
    save.mutate()
  }

  const initial = toForm(profile)
  const dirty =
    form.name.trim() !== initial.name ||
    normalizePhone(form.phone) !== profile.phone ||
    form.email.trim() !== initial.email ||
    form.address.trim() !== initial.address
  const logoBusy = upload.isPending || remove.isPending
  const generalError =
    save.isError && !Object.keys(getFieldErrors(save.error)).length
      ? getErrorMessage(save.error)
      : null

  const ids = {
    name: `${uid}-name`,
    phone: `${uid}-phone`,
    email: `${uid}-email`,
    address: `${uid}-address`,
  }
  const inputClass = (error?: string) =>
    cn(controlClass, 'h-11', error ? 'border-rose-300' : 'border-border')

  return (
    <>
      <h2 className="font-display text-lg font-semibold text-foreground">
        Business profile
      </h2>
      <p className="text-xs text-muted-foreground">
        These details appear on your reports and email summaries.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span className="relative flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#6b85f5] to-[#3f5be0] text-white shadow-[0_12px_24px_-12px_rgb(79_107_237/0.9)]">
          {profile.logo_url ? (
            <img
              src={apiAssetUrl(profile.logo_url)}
              alt={`${profile.name} logo`}
              className="size-full bg-white object-cover"
            />
          ) : (
            <CalendarDays className="size-6" />
          )}
          {logoBusy && (
            <span className="absolute inset-0 flex items-center justify-center bg-navy/50">
              <LoaderCircle className="size-5 animate-spin" />
            </span>
          )}
        </span>
        <div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={logoBusy}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3.5 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <ImageUp className="size-3.5" />
              {upload.isPending ? 'Uploading…' : 'Change logo'}
            </button>
            {profile.logo_url && (
              <button
                type="button"
                onClick={() => void confirmRemove()}
                disabled={logoBusy}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            PNG, JPG or WebP, up to 2 MB. Square images look best.
          </p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={LOGO_TYPES.join(',')}
          onChange={pickLogo}
          className="hidden"
          aria-label="Upload logo"
        />
      </div>

      <form onSubmit={submit} noValidate className="mt-6">
        <FormErrorBanner message={generalError} />
        <fieldset
          disabled={save.isPending}
          className="grid gap-x-4 gap-y-4 sm:grid-cols-2"
        >
          <Field id={ids.name} label="Business name" error={errors.name}>
            <input
              id={ids.name}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              maxLength={120}
              autoComplete="organization"
              aria-invalid={Boolean(errors.name)}
              className={inputClass(errors.name)}
            />
          </Field>
          <Field id={ids.phone} label="Contact number" error={errors.phone}>
            <input
              id={ids.phone}
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              maxLength={24}
              autoComplete="tel"
              placeholder="+63 955 547 8421"
              aria-invalid={Boolean(errors.phone)}
              className={inputClass(errors.phone)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id={ids.email} label="Business email" error={errors.email}>
              <input
                id={ids.email}
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                maxLength={160}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className={inputClass(errors.email)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id={ids.address} label="Address" error={errors.address}>
              <input
                id={ids.address}
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                maxLength={255}
                autoComplete="street-address"
                placeholder="Street, city"
                aria-invalid={Boolean(errors.address)}
                className={inputClass(errors.address)}
              />
            </Field>
          </div>
        </fieldset>

        <div className="mt-6 flex items-center justify-end gap-3">
          {dirty && !save.isPending && (
            <button
              type="button"
              onClick={() => {
                setForm(initial)
                setErrors({})
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Discard
            </button>
          )}
          <button
            type="submit"
            disabled={!dirty || save.isPending}
            className={cn(primaryButtonClass, 'h-10 disabled:opacity-50')}
          >
            {save.isPending && <LoaderCircle className="size-4 animate-spin" />}
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  )
}
