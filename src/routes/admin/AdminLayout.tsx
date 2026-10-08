import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { CalendarDays, LogOut, Menu, Search, X } from 'lucide-react'
import type { AccountSession } from '@/types/auth'
import { AdminSearchContext } from '@/components/admin/AdminSearch'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { ADMIN_MODULES, isActivePath } from '@/components/admin/modules'
import { cn, initials } from '@/lib/utils'
import { authService } from '@/services/authService'

function Sidebar({
  pathname,
  onLogout,
  loggingOut,
  onNavigate,
}: {
  pathname: string
  onLogout: () => void
  loggingOut: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-navy px-4 py-5 text-white">
      <Link
        to="/admin"
        onClick={onNavigate}
        className="flex items-center gap-3 px-2"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6b85f5] to-[#3f5be0] shadow-[0_10px_24px_-10px_rgb(79_107_237/0.9)]">
          <CalendarDays className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="block font-display text-base font-semibold">
            BASMS
          </span>
          <span className="block text-[11px] text-white/45">Salon Manager</span>
        </span>
      </Link>

      <nav className="mt-9 space-y-1">
        {ADMIN_MODULES.map(({ id, label, path, icon: Icon }) => {
          const active = isActivePath(pathname, path)
          return (
            <Link
              key={id}
              to={path}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/[0.09] text-white ring-1 ring-white/[0.06]'
                  : 'text-white/60 hover:bg-white/[0.04] hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'size-[18px] transition-colors',
                  active
                    ? 'text-white'
                    : 'text-white/45 group-hover:text-white/80',
                )}
              />
              <span className="flex-1">{label}</span>
              {active && <span className="size-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-60"
        >
          <LogOut className="size-[18px]" />
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] px-3 pt-4 text-[10px] text-white/35">
          <span>Business Suite</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [session, setSession] = useState<AccountSession | null>(() =>
    authService.getSession(),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [query, setQuery] = useState('')
  const searchValue = useMemo(() => ({ query, setQuery }), [query])

  const current =
    ADMIN_MODULES.find((m) => isActivePath(pathname, m.path)) ??
    ADMIN_MODULES[0]

  useEffect(() => {
    setQuery('')
  }, [current.id])

  useEffect(() => {
    let active = true
    authService
      .me()
      .then((fresh) => {
        if (!active) return
        if (fresh.type !== 'admin') {
          void authService.logout()
          void navigate({ to: '/', replace: true })
          return
        }
        setSession(fresh)
      })
      .catch(() => {
        if (active && !authService.isAuthenticated()) {
          void navigate({ to: '/', replace: true })
        }
      })
    return () => {
      active = false
    }
  }, [navigate])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const logout = async () => {
    setLoggingOut(true)
    await authService.logout()
    await navigate({ to: '/', replace: true })
  }

  if (!session || session.type !== 'admin') return null

  return (
    <div className="min-h-dvh bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">
        <Sidebar
          pathname={pathname}
          onLogout={logout}
          loggingOut={loggingOut}
        />
      </aside>

      <div
        aria-hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm transition-opacity lg:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[272px] transition-transform duration-300 ease-out lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
          className="absolute top-5 right-3 z-10 flex size-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>
        <Sidebar
          pathname={pathname}
          onLogout={logout}
          loggingOut={loggingOut}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-4 border-b border-border bg-white/85 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex size-9 items-center justify-center rounded-lg border border-border text-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="leading-tight">
              <p className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase">
                Workspace
              </p>
              <p className="font-display text-lg font-semibold text-foreground">
                {current.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative hidden md:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={`Search ${current.label.toLowerCase()}`}
                placeholder={`Search ${current.label.toLowerCase()}…`}
                className="h-10 w-64 rounded-lg border border-border bg-[#f5f7fb] pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <NotificationBell />
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
                {initials(session.user.name)}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-sm font-semibold text-foreground">
                  {session.user.name}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Administrator
                </span>
              </span>
            </div>
          </div>
        </header>

        <main className="px-5 py-8 sm:px-8 lg:py-10">
          <AdminSearchContext.Provider value={searchValue}>
            <Outlet />
          </AdminSearchContext.Provider>
        </main>
      </div>
    </div>
  )
}
