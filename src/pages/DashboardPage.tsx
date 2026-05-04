import { useConnectionStore } from '../stores/connectionStore'
import { useMarketStore } from '../stores/marketStore'
import { useSignalStore } from '../stores/signalStore'
import { SignalCard } from '../components/signals/SignalCard'
import { SYNTHETIC_SYMBOLS } from '../constants'

export function DashboardPage() {
  const account       = useConnectionStore(s => s.account)
  const symbols       = useMarketStore(s => s.symbols)
  const getActiveSignals = useSignalStore(s => s.getActiveSignals)

  const activeSignals    = getActiveSignals()
  const symbolsTracked   = Object.keys(symbols).length
  const totalTicksPerSec = Object.values(symbols).reduce((sum, d) => sum + d.ticksPerSec, 0)
  const loadedCount      = Object.values(symbols).filter(d => d.isLoaded).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-sm text-[#e2e8f0] tracking-wider uppercase">Dashboard</h2>
          {account && (
            <p className="text-[#64748b] text-xs mt-0.5 font-mono">
              {account.name ?? account.email} · {account.account_type} · {account.currency}
            </p>
          )}
        </div>
        <div className="text-right">
          {loadedCount < SYNTHETIC_SYMBOLS.length && loadedCount > 0 && (
            <p className="text-[#f59e0b] text-xs font-mono animate-pulse">
              loading {loadedCount}/{SYNTHETIC_SYMBOLS.length} symbols…
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Signals',  value: activeSignals.length || '—' },
          { label: 'Symbols Tracked', value: symbolsTracked || '—' },
          { label: 'Ticks / sec',     value: totalTicksPerSec > 0 ? totalTicksPerSec.toFixed(1) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 border border-[#1e2d3d] bg-[#0d1117] rounded-xl space-y-2">
            <p className="font-mono text-xs text-[#64748b]">{label}</p>
            <p className="font-mono text-2xl text-[#e2e8f0]">{value}</p>
          </div>
        ))}
      </div>

      {/* Signal list */}
      {activeSignals.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-mono text-xs text-[#64748b] uppercase tracking-widest">Live Signals</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeSignals.map(sig => (
              <SignalCard key={sig.id} signal={sig} />
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-[#1e2d3d] bg-[#0d1117] rounded-xl p-8 text-center">
          <p className="font-mono text-xs text-[#64748b]">
            {symbolsTracked === 0
              ? 'Connecting to market data…'
              : loadedCount < SYNTHETIC_SYMBOLS.length
                ? 'Analysing digit distributions…'
                : 'No signals detected — patterns within normal variance'}
          </p>
        </div>
      )}
    </div>
  )
}
