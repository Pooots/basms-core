import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AlertCircle, ChevronRight, RefreshCw, SearchX } from 'lucide-react'
import { useAdminSearch } from '@/components/admin/AdminSearch'
import { PageHeader } from '@/components/admin/Directory'
import { Toast } from '@/components/admin/Toast'
import { BusinessProfileSettings } from '@/components/admin/settings/BusinessProfileSettings'
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings'
import { PaymentSettings } from '@/components/admin/settings/PaymentSettings'
import { getErrorMessage } from '@/lib/apiErrors'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { settingsService } from '@/services/settingsService'

type SettingsTab = 'profile' | 'payments' | 'notifications'

const SECTIONS: Array<{ id: SettingsTab; label: string; keywords: string }> = [
  {
    id: 'profile',
    label: 'Business profile',
    keywords: 'business profile name logo contact number phone email address',
  },
  {
    id: 'payments',
    label: 'Payments',
    keywords: 'payments transactions push pull secure processing',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    keywords:
      'notifications alerts new appointment cancellations daily schedule summary weekly business report email inbox',
  },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { tab = 'profile' } = useSearch({ from: '/admin/settings' })
  const { query } = useAdminSearch()
  const [toast, setToast] = useToast()

  const settings = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.get,
  })

  const term = query.trim().toLowerCase()
  const sections = useMemo(
    () =>
      term
        ? SECTIONS.filter((s) =>
            `${s.label} ${s.keywords}`.toLowerCase().includes(term),
          )
        : SECTIONS,
    [term],
  )

  const select = (next: SettingsTab) =>
    void navigate({
      to: '/admin/settings',
      search: { tab: next === 'profile' ? undefined : next },
      replace: true,
    })

  // Jump to the first section that matches the top-bar search.
  useEffect(() => {
    if (sections.length && !sections.some((s) => s.id === tab)) {
      const first = sections[0].id
      void navigate({
        to: '/admin/settings',
        search: { tab: first === 'profile' ? undefined : first },
        replace: true,
      })
    }
  }, [sections, tab, navigate])

  const data = settings.data
  const profileKey = data
    ? [
        data.profile.name,
        data.profile.phone,
        data.profile.email,
        data.profile.address,
      ].join('|')
    : ''

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Workspace preferences"
        title="Settings"
        description="Update your business information, payments, and alerts."
      />

      <div className="status-rise-delay mt-7 grid items-start gap-5 lg:grid-cols-[220px_minmax(0,620px)]">
        <nav aria-label="Settings sections" className="space-y-1">
          {sections.map((section) => {
            const active = section.id === tab
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => select(section.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition',
                  active
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-white hover:text-foreground',
                )}
              >
                {section.label}
                <ChevronRight
                  className={cn(
                    'size-4 transition-transform group-hover:translate-x-0.5',
                    active ? 'text-primary' : 'text-muted-foreground/70',
                  )}
                />
              </button>
            )
          })}
          {!sections.length && (
            <p className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-muted-foreground">
              <SearchX className="size-4" />
              No settings match “{query.trim()}”.
            </p>
          )}
        </nav>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          {settings.isError ? (
            <div className="py-10 text-center">
              <AlertCircle className="mx-auto size-8 text-rose-500" />
              <p className="mt-3 text-sm font-semibold text-foreground">
                Couldn’t load settings
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {getErrorMessage(settings.error)}
              </p>
              <button
                type="button"
                onClick={() => void settings.refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Try again
              </button>
            </div>
          ) : !data ? (
            <div className="space-y-4" aria-label="Loading settings">
              <span className="block h-5 w-40 animate-pulse rounded bg-muted" />
              <span className="block h-3 w-64 animate-pulse rounded bg-muted" />
              {Array.from({ length: 4 }, (_, i) => (
                <span
                  key={i}
                  className="block h-11 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : tab === 'payments' ? (
            <PaymentSettings payments={data.payments} onToast={setToast} />
          ) : tab === 'notifications' ? (
            <NotificationSettings
              notifications={data.notifications}
              onToast={setToast}
            />
          ) : (
            <BusinessProfileSettings
              key={profileKey}
              profile={data.profile}
              onToast={setToast}
            />
          )}
        </section>
      </div>

      <Toast message={toast} />
    </div>
  )
}
