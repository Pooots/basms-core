import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  LoaderCircle,
  Lock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PaymentMethod, SettingsResponse } from '@/types/settings'
import { useDialog } from '@/components/ui/AppDialog'
import { getErrorMessage } from '@/lib/apiErrors'
import { cn } from '@/lib/utils'
import { settingsService } from '@/services/settingsService'

const ICONS: Record<PaymentMethod, LucideIcon> = {
  push: CircleDollarSign,
  pull: HandCoins,
}

export function PaymentSettings({
  payments,
  onToast,
}: {
  payments: SettingsResponse['payments']
  onToast: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const dialog = useDialog()

  const mutation = useMutation({
    mutationFn: settingsService.updatePayments,
    onSuccess: (data) => {
      queryClient.setQueryData<SettingsResponse>(['settings'], data)
      onToast(data.message)
    },
    onError: (error) =>
      void dialog.alert({
        title: 'Could not change payment method',
        message: getErrorMessage(error),
      }),
  })

  const choose = async (
    method: SettingsResponse['payments']['methods'][number],
  ) => {
    if (method.value === payments.method || mutation.isPending) return
    const ok = await dialog.confirm({
      title: `Switch to ${method.label.toLowerCase()}?`,
      message: `${method.description} New payments will use this method.`,
      confirmLabel: 'Switch',
    })
    if (ok) mutation.mutate(method.value)
  }

  return (
    <>
      <h2 className="font-display text-lg font-semibold text-foreground">
        Payments &amp; transactions
      </h2>
      <p className="text-xs text-muted-foreground">
        Choose how you collect client payments.
      </p>

      <div
        role="radiogroup"
        aria-label="Payment method"
        className="mt-5 grid gap-3 sm:grid-cols-2"
      >
        {payments.methods.map((method) => {
          const Icon = ICONS[method.value]
          const active = method.value === payments.method
          const pending =
            mutation.isPending && mutation.variables === method.value
          return (
            <button
              key={method.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => void choose(method)}
              disabled={mutation.isPending}
              className={cn(
                'group flex items-center gap-3 rounded-xl border p-4 text-left transition disabled:cursor-wait',
                active
                  ? 'border-border bg-white'
                  : 'border-border bg-white hover:border-primary/40 hover:bg-secondary/30',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  active
                    ? 'bg-orange-50 text-orange-500'
                    : 'bg-secondary text-primary',
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {method.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {method.description}
                </span>
              </span>
              {active ? (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                  Active
                </span>
              ) : pending ? (
                <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex gap-3 rounded-xl border border-primary/15 bg-secondary/50 px-4 py-3.5">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-semibold text-foreground">
            Secure payment processing
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Payment information is encrypted and never stored directly in BASMS.
          </p>
        </div>
      </div>
    </>
  )
}
