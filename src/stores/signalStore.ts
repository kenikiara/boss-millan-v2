import { create } from 'zustand'
import type { Signal } from '../types/signal'

type RawSignal = Omit<Signal, 'id' | 'createdAt' | 'updatedAt'>

interface SignalStoreState {
  signals: Record<string, Signal>

  updateSignal: (symbol: string, raw: RawSignal | null) => void
  reset: () => void
  getActiveSignals: () => Signal[]
}

let idCounter = 0
function nextId(): string {
  return `sig_${Date.now()}_${++idCounter}`
}

export const useSignalStore = create<SignalStoreState>((set, get) => ({
  signals: {},

  updateSignal: (symbol, raw) => {
    set(s => {
      if (raw === null) {
        if (!s.signals[symbol]) return s
        const { [symbol]: _, ...rest } = s.signals
        return { signals: rest }
      }

      const now = Date.now()
      const existing = s.signals[symbol]

      if (existing && existing.contractType === raw.contractType) {
        // Same contract type — update metrics, keep createdAt and id
        return {
          signals: {
            ...s.signals,
            [symbol]: { ...existing, ...raw, updatedAt: now },
          },
        }
      }

      // New signal or different contract type — replace with fresh id/createdAt
      const signal: Signal = { ...raw, id: nextId(), createdAt: now, updatedAt: now }
      return { signals: { ...s.signals, [symbol]: signal } }
    })
  },

  reset: () => set({ signals: {} }),

  getActiveSignals: () => {
    const signals = Object.values(get().signals)
    return signals.sort((a, b) => b.confidence - a.confidence)
  },
}))
