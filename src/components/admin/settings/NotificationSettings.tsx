import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Send } from 'lucide-react'
import type {
  DigestType,
  NotificationKey,
  SettingsResponse,
} from '@/types/settings'
import { useDialog } from '@/components/ui/AppDialog'
import { getErrorMessage } from '@/lib/apiErrors'
import { cn } from '@/lib/utils'
import { settingsService } from '@/services/settingsService'

const DIGESTS: Array<NotificationKey> = ['daily_summary', 'weekly_report']

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none',
        checked ? 'bg-primary' : 'bg-[#d5dbe8]',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function NotificationSettings({
  notifications,
  onToast,
}: {
  notifications: SettingsResponse['notifications']
  onToast: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const dialog = useDialog()

  const toggle = useMutation({
    mutationFn: (change: { key: NotificationKey; enabled: boolean }) =>
      settingsService.updateNotifications({ [change.key]: change.enabled }),
    // Flip the switch straight away; roll back if the save fails.
    onMutate: async ({ key, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] })
      const previous = queryClient.getQueryData<SettingsResponse>(['settings'])
      if (previous) {
        queryClient.setQueryData<SettingsResponse>(['settings'], {
          ...previous,
          notifications: previous.notifications.map((n) =>
            n.key === key ? { ...n, enabled } : n,
          ),
        })
      }
      return { previous }
    },
    onSuccess: (data, { key, enabled }) => {
      const label = data.notifications.find((n) => n.key === key)?.label
      onToast(`${label} turned ${enabled ? 'on' : 'off'}.`)
    },
    onError: (error, _change, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings'], context.previous)
      }
      void dialog.alert({
        title: 'Could not save preference',
        message: getErrorMessage(error),
      })
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: ['settings'] }),
  })

  const sendTest = useMutation({
    mutationFn: settingsService.sendTest,
    onSuccess: (message) => onToast(message),
    onError: (error) =>
      void dialog.alert({
        title: 'Could not send',
        message: getErrorMessage(error),
      }),
  })

  return (
    <>
      <h2 className="font-display text-lg font-semibold text-foreground">
        Notification preferences
      </h2>
      <p className="text-xs text-muted-foreground">
        Decide how and when BASMS should contact you.
      </p>

      <ul className="mt-4 divide-y divide-border">
        {notifications.map((n) => {
          const digest = DIGESTS.includes(n.key)
          const sending = sendTest.isPending && sendTest.variables === n.key
          return (
            <li key={n.key} className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {n.label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {n.description}
                  {!digest && ' Alerts appear under the bell at the top.'}
                </p>
                {digest && (
                  <button
                    type="button"
                    onClick={() => sendTest.mutate(n.key as DigestType)}
                    disabled={sendTest.isPending}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline disabled:opacity-60"
                  >
                    {sending ? (
                      <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                      <Send className="size-3" />
                    )}
                    {sending ? 'Sending…' : 'Send me one now'}
                  </button>
                )}
              </div>
              <Switch
                checked={n.enabled}
                label={n.label}
                onChange={(enabled) => toggle.mutate({ key: n.key, enabled })}
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}
