import { useConnectionStore } from '../stores/connectionStore'

export function DashboardPage() {
  const { status } = useConnectionStore()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-sm text-[#e2e8f0] tracking-wider uppercase">
          Dashboard
        </h2>
        <span className="font-mono text-xs text-[#334155]">
          ws: {status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {['Active Signals', 'Symbols Tracked', 'Ticks / sec'].map((label) => (
          <div
            key={label}
            className="p-4 border border-[#1f2330] bg-[#111318] space-y-2"
          >
            <p className="font-mono text-xs text-[#64748b]">{label}</p>
            <p className="font-mono text-2xl text-[#e2e8f0]">—</p>
          </div>
        ))}
      </div>

      <div className="border border-[#1f2330] bg-[#111318] p-4">
        <p className="font-mono text-xs text-[#334155] text-center">
          scanner engine initializes in phase 2
        </p>
      </div>
    </div>
  )
}
