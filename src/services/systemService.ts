import type {
  ApiRootResponse,
  HealthResponse,
  ProbeResult,
} from '@/types/system'
import { API_ROOT_URL } from '@/lib/api'

/**
 * Uses fetch (not axios) so a 503 from /api/health still returns its JSON body
 * and the page can show which part is down.
 */
async function probe<T>(path: string): Promise<ProbeResult<T>> {
  const url = `${API_ROOT_URL}${path}`
  const started = performance.now()

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const latencyMs = Math.round(performance.now() - started)
    const isJson = (res.headers.get('content-type') ?? '').includes(
      'application/json',
    )
    const data = isJson ? ((await res.json()) as T) : null

    return {
      url,
      ok: res.ok && data !== null,
      status: res.status,
      latencyMs,
      data,
      error: isJson ? undefined : `Expected JSON, got HTTP ${res.status}`,
    }
  } catch (err) {
    return {
      url,
      ok: false,
      status: 0,
      latencyMs: Math.round(performance.now() - started),
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export const systemService = {
  apiRoot: () => probe<ApiRootResponse>(''),
  health: () => probe<HealthResponse>('/health'),
}
