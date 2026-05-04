interface DigitBarProps {
  counts: number[]   // length 10, index = digit
  total: number
}

const EVEN_DIGITS = new Set([0, 2, 4, 6, 8])

export function DigitBar({ counts, total }: DigitBarProps) {
  const expected = total > 0 ? total / 10 : 0

  return (
    <div className="flex gap-px h-8">
      {counts.map((count, digit) => {
        const pct = total > 0 ? (count / total) * 100 : 10
        const isEven = EVEN_DIGITS.has(digit)
        const deviation = expected > 0 ? (count - expected) / expected : 0
        const hot = Math.abs(deviation) > 0.2

        const barColor = hot
          ? deviation > 0
            ? 'bg-[#00d4a3]'
            : 'bg-[#ef4444]'
          : isEven
            ? 'bg-[#3b82f6]/60'
            : 'bg-[#64748b]/60'

        return (
          <div key={digit} className="flex-1 flex flex-col justify-end items-center gap-0.5">
            <div
              className={`w-full rounded-t transition-all duration-300 ${barColor}`}
              style={{ height: `${Math.max(4, pct * 2.4)}px` }}
            />
            <span className="text-[9px] text-[#64748b] font-mono">{digit}</span>
          </div>
        )
      })}
    </div>
  )
}
