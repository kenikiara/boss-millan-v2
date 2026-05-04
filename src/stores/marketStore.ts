import { create } from 'zustand'

const BUFFER_SIZE = 1000

export interface SymbolData {
  prices: number[]
  pipSize: number
  lastPrice: number | null
  subId: number | null
  isLoaded: boolean
  tickCount: number        // total ticks received (for ticks/sec calc)
  tickCountTs: number      // timestamp of last tickCount reset
  ticksPerSec: number
}

interface MarketState {
  symbols: Record<string, SymbolData>

  initSymbol:   (symbol: string, pipSize: number) => void
  loadHistory:  (symbol: string, prices: number[]) => void
  addTick:      (symbol: string, price: number) => void
  setSubId:     (symbol: string, subId: number) => void
  reset:        () => void
}

function emptySymbol(pipSize: number): SymbolData {
  return {
    prices: [],
    pipSize,
    lastPrice: null,
    subId: null,
    isLoaded: false,
    tickCount: 0,
    tickCountTs: Date.now(),
    ticksPerSec: 0,
  }
}

export const useMarketStore = create<MarketState>((set, _get) => ({
  symbols: {},

  initSymbol: (symbol, pipSize) => {
    set(s => ({
      symbols: { ...s.symbols, [symbol]: emptySymbol(pipSize) },
    }))
  },

  loadHistory: (symbol, prices) => {
    set(s => {
      const existing = s.symbols[symbol] ?? emptySymbol(2)
      return {
        symbols: {
          ...s.symbols,
          [symbol]: {
            ...existing,
            prices: prices.slice(-BUFFER_SIZE),
            isLoaded: true,
          },
        },
      }
    })
  },

  addTick: (symbol, price) => {
    set(s => {
      const existing = s.symbols[symbol]
      if (!existing) return s

      const now = Date.now()
      const elapsed = (now - existing.tickCountTs) / 1000
      const newCount = existing.tickCount + 1
      let ticksPerSec = existing.ticksPerSec
      let tickCount = newCount
      let tickCountTs = existing.tickCountTs

      // Recalculate ticks/sec every 5 seconds
      if (elapsed >= 5) {
        ticksPerSec = Math.round((newCount / elapsed) * 10) / 10
        tickCount = 0
        tickCountTs = now
      }

      const prices = existing.prices.length >= BUFFER_SIZE
        ? [...existing.prices.slice(1), price]
        : [...existing.prices, price]

      return {
        symbols: {
          ...s.symbols,
          [symbol]: { ...existing, prices, lastPrice: price, tickCount, tickCountTs, ticksPerSec },
        },
      }
    })
  },

  setSubId: (symbol, subId) => {
    set(s => {
      const existing = s.symbols[symbol]
      if (!existing) return s
      return { symbols: { ...s.symbols, [symbol]: { ...existing, subId } } }
    })
  },

  reset: () => set({ symbols: {} }),
}))
