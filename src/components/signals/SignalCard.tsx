import type { Signal } from '../../types/signal'
import { SYMBOL_LABELS } from '../../constants'
import type { SyntheticSymbol } from '../../constants'
import { formatContractType, formatConfidence, formatAge } from '../../utils/format'

interface SignalCardProps {
  signal: Signal
}

const CONTRACT_COLORS: Record<string, string> = {
  DIGITEVEN:  'text-[#3b82f6]',
  DIGITODD:   'text-[#a78bfa]',
  DIGITOVER:  'text-[#00d4a3]',
  DIGITUNDER: 'text-[#f59e0b]',
  DIGITMATCH: 'text-[#00d4a3]',
  DIGITDIFF:  'text-[#ef4444]',
}

const STATE_BADGE = {
  ACTIVE:    'bg-[#00d4a3]/10 text-[#00d4a3] border-[#00d4a3]/30',
  WEAKENING: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
}

export function SignalCard({ signal }: SignalCardProps) {
  const label = SYMBOL_LABELS[signal.symbol as SyntheticSymbol] ?? signal.symbol
  const contractLabel = formatContractType(signal.contractType, signal.digit)
  const contractColor = CONTRACT_COLORS[signal.contractType] ?? 'text-[#e2e8f0]'

  const confidencePct = Math.round(signal.confidence)
  const barColor = confidencePct >= 70 ? 'bg-[#00d4a3]' : 'bg-[#f59e0b]'

  return (
    <div className="bg-[#0d1117] border border-[#1e2d3d] rounded-xl p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[#e2e8f0] font-semibold text-sm">{label}</p>
          <p className="text-[#64748b] font-mono text-xs mt-0.5">{signal.symbol}</p>
        </div>
        <span className={`border rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${STATE_BADGE[signal.state]}`}>
          {signal.state}
        </span>
      </div>

      {/* Contract type + confidence */}
      <div className="flex items-center justify-between">
        <span className={`font-mono font-bold text-lg tracking-widest ${contractColor}`}>
          {contractLabel}
        </span>
        <span className="text-[#e2e8f0] font-mono text-lg font-bold">
          {formatConfidence(signal.confidence)}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="h-1.5 rounded-full bg-[#1e2d3d] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[#64748b] text-[10px] uppercase tracking-wide">Streak</p>
          <p className="text-[#e2e8f0] font-mono text-xs font-semibold">{signal.streak}</p>
        </div>
        <div>
          <p className="text-[#64748b] text-[10px] uppercase tracking-wide">Est. Runs</p>
          <p className="text-[#e2e8f0] font-mono text-xs font-semibold">{signal.estimatedRuns}</p>
        </div>
        <div>
          <p className="text-[#64748b] text-[10px] uppercase tracking-wide">Age</p>
          <p className="text-[#e2e8f0] font-mono text-xs font-semibold">{formatAge(signal.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}
