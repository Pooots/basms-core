import { useEffect, useState } from 'react'

/** A message that clears itself after `duration` ms. */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), duration)
    return () => window.clearTimeout(id)
  }, [toast, duration])

  return [toast, setToast] as const
}
