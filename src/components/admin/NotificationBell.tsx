import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, BellOff, CalendarPlus, CalendarX2, Settings } from 'lucide-react'
import type { AdminNotification } from '@/types/settings'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { notificationService } from '@/services/settingsService'

const POLL_MS = 30_000

export function NotificationBell() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.list,
    refetchInterval: POLL_MS,
  })

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    onSettled: refresh,
  })
  const markAll = useMutation({
    mutationFn: notificationService.markAllRead,
    onSettled: refresh,
  })

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openItem = (item: AdminNotification) => {
    if (!item.read) markRead.mutate(item.id)
    setOpen(false)
    if (item.date) {
      void navigate({ to: '/admin/calendar', search: { date: item.date } })
    }
  }

  const unread = list.data?.unread_count ?? 0
  const items = list.data?.data ?? []

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) refresh()
        }}
        aria-label={
          unread ? `Notifications, ${unread} unread` : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex size-10 items-center justify-center rounded-lg border border-border bg-white text-foreground transition hover:bg-muted"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_-24px_rgb(11_22_51/0.45)] duration-150"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Notifications
              {unread > 0 && (
                <span className="ml-1.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                  {unread} new
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={!unread || markAll.isPending}
              className="text-xs font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>

          <ul className="max-h-[360px] overflow-y-auto">
            {list.isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="flex gap-3 px-4 py-3">
                  <span className="size-8 animate-pulse rounded-lg bg-muted" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
                    <span className="block h-3 w-full animate-pulse rounded bg-muted" />
                  </span>
                </li>
              ))
            ) : items.length === 0 ? (
              <li className="px-4 py-10 text-center">
                <BellOff className="mx-auto size-7 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-semibold text-foreground">
                  You&apos;re all caught up
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  New bookings and cancellations will show up here.
                </p>
              </li>
            ) : (
              items.map((item) => {
                const cancelled = item.type === 'appointment_cancelled'
                const Icon = cancelled ? CalendarX2 : CalendarPlus
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition hover:bg-muted/60',
                        !item.read && 'bg-secondary/40',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg',
                          cancelled
                            ? 'bg-rose-50 text-rose-500'
                            : 'bg-emerald-50 text-emerald-600',
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {item.created_at &&
                              formatRelativeTime(item.created_at)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                          {item.message}
                        </span>
                      </span>
                      {!item.read && (
                        <span
                          aria-label="Unread"
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          <Link
            to="/admin/settings"
            search={{ tab: 'notifications' }}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-3.5" />
            Notification settings
          </Link>
        </div>
      )}
    </div>
  )
}
