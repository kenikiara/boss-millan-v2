import { useEffect, useRef } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import { useMarketStore } from '../stores/marketStore'
import { useSignalStore } from '../stores/signalStore'
import { getPipSizes, getTickHistory, subscribeToTicks } from '../api/marketApi'
import { generateSignal } from '../engine/signalGenerator'
import { SYNTHETIC_SYMBOLS } from '../constants'

/**
 * Mounts when the user lands on a scanning page.
 * Loads history + subscribes to all synthetic symbols, then feeds ticks into
 * the signal generator on every update.
 */
export function useScanner() {
  const socket     = useConnectionStore(s => s.socket)
  const status     = useConnectionStore(s => s.status)
  const initSymbol = useMarketStore(s => s.initSymbol)
  const loadHistory = useMarketStore(s => s.loadHistory)
  const addTick    = useMarketStore(s => s.addTick)
  const setSubId   = useMarketStore(s => s.setSubId)
  const resetMarket = useMarketStore(s => s.reset)
  const updateSignal = useSignalStore(s => s.updateSignal)
  const resetSignals = useSignalStore(s => s.reset)

  // Keep a stable reference to store actions and current symbol data for the tick handler
  const marketRef = useRef({ addTick, setSubId, updateSignal })
  marketRef.current = { addTick, setSubId, updateSignal }

  // Ref to track active subscription IDs for cleanup
  const subIdsRef = useRef<number[]>([])

  useEffect(() => {
    if (status !== 'AUTHENTICATED' || !socket) return

    let cancelled = false

    async function init() {
      if (!socket) return

      resetMarket()
      resetSignals()
      subIdsRef.current = []

      // 1. Fetch pip sizes for all symbols at once
      let pipSizes: Record<string, number>
      try {
        pipSizes = await getPipSizes(socket, SYNTHETIC_SYMBOLS)
      } catch {
        return
      }
      if (cancelled) return

      // 2. Init all symbols in store
      for (const sym of SYNTHETIC_SYMBOLS) {
        initSymbol(sym, pipSizes[sym] ?? 2)
      }

      // 3. Load history + subscribe for each symbol sequentially to respect rate limits
      for (const sym of SYNTHETIC_SYMBOLS) {
        if (cancelled) break

        try {
          const prices = await getTickHistory(socket, sym)
          if (cancelled) break
          if (prices.length) loadHistory(sym, prices)
        } catch {
          // history is best-effort; continue to subscribe
        }

        if (cancelled) break

        try {
          const subId = await subscribeToTicks(socket, sym, (quote, _pipSize) => {
            const { addTick, updateSignal } = marketRef.current
            addTick(sym, quote)

            // Re-read current prices from the store after the tick is added
            const symData = useMarketStore.getState().symbols[sym]
            if (!symData) return
            const raw = generateSignal(sym, symData.prices, symData.pipSize)
            updateSignal(sym, raw)
          })
          if (cancelled) break
          subIdsRef.current.push(subId)
          setSubId(sym, subId)
        } catch {
          // subscribe failure for one symbol is non-fatal
        }
      }
    }

    init()

    return () => {
      cancelled = true
      // Unsubscribe all — fire and forget
      if (socket) {
        for (const id of subIdsRef.current) {
          socket.send({ forget: id }).catch(() => {})
        }
      }
      subIdsRef.current = []
      resetMarket()
      resetSignals()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, socket])
}
