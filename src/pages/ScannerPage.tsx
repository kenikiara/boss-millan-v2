import { SymbolCard } from '../components/scanner/SymbolCard'
import { SYNTHETIC_SYMBOLS } from '../constants'
import type { SyntheticSymbol } from '../constants'

export function ScannerPage() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="font-mono text-sm text-[#e2e8f0] tracking-wider uppercase">Scanner</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SYNTHETIC_SYMBOLS.map(sym => (
          <SymbolCard key={sym} symbol={sym as SyntheticSymbol} />
        ))}
      </div>
    </div>
  )
}
