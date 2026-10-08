export type ApiRootResponse = {
  ok: boolean
  service: string
  name: string
  version: string
  health: string
  v1: string
}

export type DatabaseHealth = {
  status: 'ok' | 'error'
  driver: string
  name: string
  version?: string | null
  migrations?: number
  error?: string
  response_ms: number
}

export type HealthResponse = {
  ok: boolean
  service: string
  status: 'healthy' | 'degraded'
  app: string
  env: string
  database: DatabaseHealth
  time: string
  php: string
  laravel: string
}

export type ProbeResult<T> = {
  url: string
  ok: boolean
  status: number
  latencyMs: number
  data: T | null
  error?: string
}
