import { version as reactVersion } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Database,
  ExternalLink,
  LoaderCircle,
  MonitorSmartphone,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ProbeResult } from '@/types/system'
import { cn } from '@/lib/utils'
import { API_ROOT_URL } from '@/lib/api'
import { systemService } from '@/services/systemService'

type State = 'ok' | 'error' | 'loading'

const REFRESH_MS = 15_000

const stateStyles: Record<State, { badge: string; dot: string; label: string }> =
  {
    ok: {
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Working',
    },
    error: {
      badge: 'bg-rose-50 text-rose-700 ring-rose-200',
      dot: 'bg-rose-500',
      label: 'Down',
    },
    loading: {
      badge: 'bg-amber-50 text-amber-700 ring-amber-200',
      dot: 'bg-amber-400',
      label: 'Checking',
    },
  }

function StateBadge({ state, label }: { state: State; label?: string }) {
  const style = stateStyles[state]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        style.badge,
      )}
    >
      <span className="relative flex size-2">
        {state !== 'error' && (
          <span
            className={cn(
              'absolute inline-flex size-full animate-ping rounded-full opacity-60',
              style.dot,
            )}
          />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', style.dot)} />
      </span>
      {label ?? style.label}
    </span>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground">
        {value ?? '—'}
      </dd>
    </div>
  )
}

function StatusCard({
  title,
  subtitle,
  icon,
  state,
  children,
  footer,
  className,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  state: State
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'status-rise flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <StateBadge state={state} />
      </div>
      <dl className="mt-5 divide-y divide-border">{children}</dl>
      {footer && <div className="mt-auto pt-4">{footer}</div>}
    </section>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
      {children}
    </p>
  )
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.8em] text-primary">
      {children}
    </code>
  )
}

function probeState<T>(
  probe: ProbeResult<T> | undefined,
  loading: boolean,
): State {
  if (!probe) return loading ? 'loading' : 'error'
  return probe.ok ? 'ok' : 'error'
}

function EndpointRow({
  method,
  path,
  probe,
  loading,
}: {
  method: string
  path: string
  probe: ProbeResult<unknown> | undefined
  loading: boolean
}) {
  const state = probeState(probe, loading)
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-foreground">
          {method}
        </span>
        <a
          href={probe?.url ?? `${API_ROOT_URL}${path}`}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex min-w-0 items-center gap-1.5 font-mono text-sm text-foreground hover:text-primary"
        >
          <span className="truncate">{probe?.url ?? `${API_ROOT_URL}${path}`}</span>
          <ExternalLink className="size-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
        </a>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {probe && (
          <>
            <span className="font-mono">
              {probe.status === 0 ? 'no response' : `HTTP ${probe.status}`}
            </span>
            <span className="font-mono">{probe.latencyMs} ms</span>
          </>
        )}
        <StateBadge state={state} label={state === 'ok' ? 'OK' : undefined} />
      </div>
    </li>
  )
}

export default function StatusPage() {
  const apiRoot = useQuery({
    queryKey: ['system', 'api-root'],
    queryFn: systemService.apiRoot,
    refetchInterval: REFRESH_MS,
    retry: false,
  })

  const health = useQuery({
    queryKey: ['system', 'health'],
    queryFn: systemService.health,
    refetchInterval: REFRESH_MS,
    retry: false,
  })

  const loading = apiRoot.isLoading || health.isLoading
  const fetching = apiRoot.isFetching || health.isFetching
  const healthData = health.data?.data ?? null
  const db = healthData?.database

  const frontendState: State = 'ok'
  const backendReachable = Boolean(apiRoot.data?.ok || healthData)
  const backendState: State = loading
    ? 'loading'
    : backendReachable
      ? 'ok'
      : 'error'
  const databaseState: State = loading
    ? 'loading'
    : db?.status === 'ok'
      ? 'ok'
      : 'error'

  const states = [frontendState, backendState, databaseState]
  const overall: State = states.includes('loading')
    ? 'loading'
    : states.every((s) => s === 'ok')
      ? 'ok'
      : 'error'
  const workingCount = states.filter((s) => s === 'ok').length

  const lastChecked = Math.max(apiRoot.dataUpdatedAt, health.dataUpdatedAt)

  const refresh = () => {
    void apiRoot.refetch()
    void health.refetch()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 10% 0%, rgb(79 107 237 / 0.08), transparent 60%), radial-gradient(ellipse 50% 40% at 95% 90%, rgb(94 234 212 / 0.10), transparent 55%)',
        }}
      />
      <div
        aria-hidden
        className="status-orb pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="status-orb pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-brand/15 blur-3xl"
        style={{ animationDelay: '1.4s' }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:py-14">
        <header className="status-rise flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="size-11 rounded-xl shadow-sm" />
            <div>
              <p className="text-lg font-bold tracking-tight text-primary">BASMS</p>
              <p className="text-xs text-muted-foreground">Platform foundation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={fetching}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-secondary disabled:opacity-70"
          >
            <RefreshCw className={cn('size-4', fetching && 'animate-spin')} />
            {fetching ? 'Checking…' : 'Re-check'}
          </button>
        </header>

        <section className="status-rise-delay mt-12 max-w-2xl">
          <div className="status-brand-line h-px w-40" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {overall === 'loading'
              ? 'Checking the stack…'
              : overall === 'ok'
                ? 'All systems are working'
                : 'Some services need attention'}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            The frontend (<Code>basms-core</Code>) calls the Laravel API (
            <Code>basms-ws</Code>), which checks its MySQL connection. Status
            refreshes every {REFRESH_MS / 1000} seconds.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <StateBadge
              state={overall}
              label={
                overall === 'loading'
                  ? 'Checking services'
                  : `${workingCount} of 3 services working`
              }
            />
            {lastChecked > 0 && (
              <span className="text-xs text-muted-foreground">
                Last checked {new Date(lastChecked).toLocaleTimeString()}
              </span>
            )}
          </div>
        </section>

        <div className="status-rise-delay-2 mt-10 grid gap-5 md:grid-cols-3">
          <StatusCard
            title="Frontend"
            subtitle="React + Vite (basms-core)"
            icon={<MonitorSmartphone className="size-5" />}
            state={frontendState}
          >
            <Row label="Status" value="Rendering" />
            <Row label="React" value={reactVersion} />
            <Row label="Mode" value={import.meta.env.MODE} />
            <Row label="Origin" value={window.location.origin} />
            <Row label="API base" value={API_ROOT_URL} />
          </StatusCard>

          <StatusCard
            title="Backend API"
            subtitle="Laravel + JWT (basms-ws)"
            icon={<Server className="size-5" />}
            state={backendState}
            footer={
              backendState === 'error' && (
                <Hint>
                  Can't reach the API. Start <Code>basms-ws</Code> with{' '}
                  <Code>php artisan serve</Code> (port 8000).
                </Hint>
              )
            }
          >
            <Row label="Service" value={apiRoot.data?.data?.service} />
            <Row label="Version" value={apiRoot.data?.data?.version} />
            <Row label="Environment" value={healthData?.env} />
            <Row label="PHP" value={healthData?.php} />
            <Row label="Laravel" value={healthData?.laravel} />
          </StatusCard>

          <StatusCard
            title="Database"
            subtitle="MySQL via XAMPP"
            icon={<Database className="size-5" />}
            state={databaseState}
            footer={
              databaseState === 'error' &&
              (db?.error ? (
                <Hint>
                  {db.error.length > 160 ? `${db.error.slice(0, 160)}…` : db.error}
                  <br />
                  Start MySQL in XAMPP and check that the <Code>basms</Code>{' '}
                  database exists.
                </Hint>
              ) : (
                <Hint>
                  Waiting for the backend. The database is checked through{' '}
                  <Code>/api/health</Code>.
                </Hint>
              ))
            }
          >
            <Row label="Driver" value={db?.driver} />
            <Row label="Database" value={db?.name} />
            <Row label="Server" value={db?.version} />
            <Row label="Migrations" value={db?.migrations} />
            <Row
              label="Query time"
              value={db ? `${db.response_ms} ms` : undefined}
            />
          </StatusCard>
        </div>

        <section className="status-rise-delay-2 mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold text-foreground">Endpoints</h2>
            <span className="text-xs text-muted-foreground">
              Through the Vite <Code>/api</Code> proxy
            </span>
          </div>
          <ul className="divide-y divide-border">
            <EndpointRow method="GET" path="" probe={apiRoot.data} loading={apiRoot.isLoading} />
            <EndpointRow method="GET" path="/health" probe={health.data} loading={health.isLoading} />
          </ul>
        </section>

        <section className="status-rise-delay-2 mt-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
            {health.isLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : healthData?.ok ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <XCircle className="size-4 text-rose-600" />
            )}
            /api/health response
          </div>
          <pre className="max-h-96 overflow-auto rounded-2xl bg-navy p-5 font-mono text-xs leading-relaxed text-white/90 shadow-sm">
            {healthData
              ? JSON.stringify(healthData, null, 2)
              : health.data?.error
                ? `// ${health.data.error}`
                : '// Waiting for response…'}
          </pre>
        </section>

        <footer className="mt-auto pt-12 text-center text-xs text-muted-foreground">
          BASMS · system status ·{' '}
          <a href="/" className="font-medium text-primary hover:underline">
            Log in
          </a>
        </footer>
      </div>
    </main>
  )
}
