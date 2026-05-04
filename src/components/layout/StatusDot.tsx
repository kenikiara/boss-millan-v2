import { useConnectionStore } from '../../stores/connectionStore'
import type { ConnectionStatus } from '../../stores/connectionStore'

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string; pulse: boolean }> = {
  DISCONNECTED:  { color: 'bg-[#ef4444]', label: 'disconnected', pulse: false },
  CONNECTING:    { color: 'bg-[#f59e0b]', label: 'connecting',   pulse: true  },
  AUTHENTICATED: { color: 'bg-[#00d4a3]', label: 'live',         pulse: true  },
  ERROR:         { color: 'bg-[#ef4444]', label: 'error',        pulse: false },
}

export function StatusDot() {
  const status = useConnectionStore((s) => s.status)
  const { color, label, pulse } = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      <span className="text-[#64748b] font-mono text-xs">{label}</span>
    </div>
  )
}
