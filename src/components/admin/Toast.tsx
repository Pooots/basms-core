import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      aria-live="polite"
      className={cn(
        'fixed right-6 bottom-6 z-[250] transition-all duration-300',
        message
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      {message && (
        <div className="flex items-center gap-2.5 rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="size-4 text-accent" />
          {message}
        </div>
      )}
    </div>
  )
}
