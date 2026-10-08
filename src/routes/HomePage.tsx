import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  User,
} from 'lucide-react'
import axios from 'axios'
import type { FormEvent, ReactNode } from 'react'
import { useDialog } from '@/components/ui/AppDialog'
import { cn } from '@/lib/utils'
import { authService } from '@/services/authService'

function loginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Make sure the BASMS API is running.'
    }
    if (error.response.status === 429) {
      return 'Too many attempts. Please wait a minute and try again.'
    }
    const message = (error.response.data as { message?: string } | undefined)
      ?.message
    if (message) return message
  }
  return 'Something went wrong. Please try again.'
}

function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-xl bg-gradient-to-br from-[#6b85f5] to-[#3f5be0] text-white shadow-[0_12px_30px_-10px_rgb(79_107_237/0.8)]',
        className,
      )}
    >
      <CalendarDays className="size-1/2" strokeWidth={2} />
    </span>
  )
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string
  label: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

const inputClass =
  'h-11 w-full rounded-lg border border-border bg-white pr-11 pl-10 text-sm text-foreground shadow-[0_1px_2px_rgb(15_27_61/0.04)] transition outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10'

export default function HomePage() {
  const navigate = useNavigate()
  const dialog = useDialog()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await authService.login({ email: email.trim(), password, remember })
      await navigate({ to: '/admin', replace: true })
    } catch (err) {
      setError(loginErrorMessage(err))
      setSubmitting(false)
    }
  }

  const forgotPassword = () => {
    void dialog.alert({
      title: 'Forgot password?',
      message:
        'Password reset is not available yet. Please contact your BASMS administrator to reset your password.',
    })
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-navy px-12 py-16 text-white lg:flex lg:flex-col lg:justify-center xl:px-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute -top-40 right-[-12rem] size-[34rem] rounded-full border border-white/[0.06]" />
          <span className="absolute -top-24 right-[-6rem] size-[22rem] rounded-full border border-white/[0.05]" />
          <span className="absolute -bottom-56 -left-40 size-[36rem] rounded-full border border-white/[0.06]" />
          <span className="absolute -bottom-32 -left-20 size-[22rem] rounded-full border border-white/[0.04]" />
          <span className="absolute top-1/3 -left-24 size-72 rounded-full bg-primary/20 blur-[110px]" />
        </div>

        <div className="status-rise relative max-w-lg">
          <BrandMark className="float-soft size-12" />

          <p className="mt-10 text-[11px] font-bold tracking-[0.22em] text-accent uppercase">
            Appointment management, simplified
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.08] font-medium tracking-[-0.03em] xl:text-[3.4rem]">
            Give every client
            <br />a reason to return.
          </h1>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/60">
            Run your bookings, team, and services from one calm, organized workspace.
          </p>

          <div className="mt-12 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/[0.08] ring-1 ring-white/10">
              <Check className="size-4 text-primary" strokeWidth={3} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Everything in one place</span>
              <span className="block text-xs text-white/50">
                Book, manage, and grow with confidence
              </span>
            </span>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-[#f5f7fb] px-6 py-12 sm:px-10">
        <div className="status-rise-delay w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark className="size-10" />
            <span className="font-display text-lg font-semibold text-foreground">BASMS</span>
          </div>

          <p className="text-[11px] font-bold tracking-[0.22em] text-primary uppercase">
            Welcome back
          </p>
          <h2 className="mt-2 font-display text-3xl font-medium tracking-[-0.02em] text-foreground">
            Log in to BASMS
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your details to access your business workspace.
          </p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Field id="email" label="Email" icon={<User className="size-4" />}>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className={inputClass}
              />
            </Field>

            <Field id="password" label="Password" icon={<Lock className="size-4" />}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            <div className="flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 cursor-pointer rounded accent-primary"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={forgotPassword}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_-12px_rgb(79_107_237/0.9)] transition hover:bg-[#4560e0] disabled:cursor-not-allowed disabled:opacity-75"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                <>
                  Log In
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="font-semibold text-foreground hover:text-primary">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="font-semibold text-foreground hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
