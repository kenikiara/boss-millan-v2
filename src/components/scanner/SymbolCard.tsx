import { useMarketStore } from '../../stores/marketStore'
import { useSignalStore } from '../../stores/signalStore'
import { countDigits, digitsFromPrices } from '../../utils/digits'
import { formatPrice, formatContractType, formatConfidence } from '../../utils/format'
import { SYMBOL_LABELS } from '../../constants'
import type { SyntheticSymbol } from '../../constants'
import { DigitBar } from './DigitBar'

interface SymbolCardProps {
  symbol: SyntheticSymbol
}

const STATE_COLORS = {
  ACTIVE:    'text-[#00d4a3] border-[#00d4a3]/40 bg-[#00d4a3]/10',
  WEAKENING: 'text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10',
}

export function SymbolCard({ symbol }: SymbolCardProps) {
  const symData = useMarketStore(s => s.symbols[symbol])
  const signal  = useSignalStore(s => s.signals[symbol])

  if (!symData) return null

  const digits = symData.isLoaded ? digitsFromPrices(symData.prices, symData.pipSize) : []
  const counts = countDigits(digits)
  const label  = SYMBOL_LABELS[symbol] ?? symbol

  return (
    <div className="bg-[#0d1117] border border-[#1e2d3d] rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[#e2e8f0] font-semibold text-sm leading-tight">{label}</p>
          <p className="text-[#64748b] font-mono text-xs mt-0.5">{symbol}</p>
        </div>
        <div className="text-right shrink-0">
          {symData.lastPrice !== null ? (
            <p className="text-[#e2e8f0] font-mono text-sm">
              {formatPrice(symData.lastPrice, symData.pipSize)}
            </p>
          ) : (
            <p className="text-[#64748b] font-mono text-xs">—</p>
          )}
          <p className="text-[#64748b] font-mono text-[10px] mt-0.5">
            {symData.ticksPerSec > 0 ? `${symData.ticksPerSec}/s` : ''}
          </p>
        </div>
      </div>

      {/* Digit distribution bar */}
      {symData.isLoaded ? (
        <DigitBar counts={counts} total={digits.length} />
      ) : (
        <div className="h-8 flex items-center justify-center">
          <span className="text-[#64748b] text-xs animate-pulse">loading history…</span>
        </div>
      )}

      {/* Signal badge */}
      {signal && (
        <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${STATE_COLORS[signal.state]}`}>
          <span className="font-mono font-bold text-xs tracking-widest">
            {formatContractType(signal.contractType, signal.digit)}
          </span>
          <span className="font-mono text-xs font-semibold">
            {formatConfidence(signal.confidence)}
          </span>
        </div>
      )}
    </div>
  )
}
