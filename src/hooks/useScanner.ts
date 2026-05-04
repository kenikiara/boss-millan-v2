import { useEffect, useRef } from 'react'
import { useConnectionStore } from '../stores/connectionStore'
import { useMarketStore } from '../stores/marketStore'
import { useSignalStore } from '../stores/signalStore'
import { getPipSizes, getTickHistory, subscribeToTicks } from '../api/marketApi'
import { generateSignal } from '../engine/signalGenerator'
import { SYNTHETIC_SYMBOLS, FALLBACK_PIP_SIZES } from '../constants'

export function useScanner() {
  const socket     = useConnectionStore(s => s.socket)
  const status     = useConnectionStore(s => s.status)
  const initSymbol = useMarketStore(s => s.initSymbol)
  const loadHistory = useMarketStore(s => s.loadHistory)
  const addTick    = useMarketStore(s => s.addTick)
  const setSubId   = useMarketStore(s => s.setSubId)
  const setScannerPhase = useMarketStore(s => s.setScannerPhase)
  const resetMarket = useMarketStore(s => s.reset)
  const updateSignal = useSignalStore(s => s.updateSignal)
  const resetSignals = useSignalStore(s => s.reset)

  const marketRef = useRef({ addTick, setSubId, updateSignal })
  marketRef.current = { addTick, setSubId, updateSignal }

  const subIdsRef = useRef<number[]>([])

  useEffect(() => {
    if (status !== 'AUTHENTICATED' || !socket) return

    let cancelled = false

    async function init() {
      if (!socket) return

      resetMarket()
      resetSignals()
      subIdsRef.current = []
      setScannerPhase('init')

      // 1. Fetch pip sizes — fall back to hardcoded map if endpoint unsupported
      let pipSizes: Record<string, number> = { ...FALLBACK_PIP_SIZES }
      try {
        const fetched = await getPipSizes(socket, SYNTHETIC_SYMBOLS)
        pipSizes = { ...pipSizes, ...fetched }
        console.log('[scanner] pip sizes loaded from API', pipSizes)
      } catch (err) {
        console.warn('[scanner] active_symbols failed — using fallback pip sizes', err)
      }
      if (cancelled) return

      // 2. Init all symbols
      setScannerPhase('loading')
      for (const sym of SYNTHETIC_SYMBOLS) {
        initSymbol(sym, pipSizes[sym] ?? 2)
      }

      // 3. Load history + subscribe per symbol
      let subscribed = 0
      for (const sym of SYNTHETIC_SYMBOLS) {
        if (cancelled) break

        try {
          const prices = await getTickHistory(socket, sym)
          if (cancelled) break
          if (prices.length) {
            loadHistory(sym, prices)
            console.log(`[scanner] history loaded for ${sym}: ${prices.length} ticks`)
          }
        } catch (err) {
          console.error(`[scanner] history failed for ${sym}`, err)
        }

        if (cancelled) break

        try {
          const subId = await subscribeToTicks(socket, sym, (quote, _pipSize) => {
            const { addTick, updateSignal } = marketRef.current
            addTick(sym, quote)
            const symData = useMarketStore.getState().symbols[sym]
            if (!symData) return
            const raw = generateSignal(sym, symData.prices, symData.pipSize)
            updateSignal(sym, raw)
          })
          if (cancelled) break
          subIdsRef.current.push(subId)
          setSubId(sym, subId)
          subscribed++
          console.log(`[scanner] subscribed to ${sym} (subId=${subId}, total=${subscribed})`)
        } catch (err) {
          console.error(`[scanner] subscribe failed for ${sym}`, err)
        }
      }

      if (!cancelled) {
        if (subscribed === 0) {
          setScannerPhase('error', 'No symbols could be subscribed. Check console for details.')
        } else {
          setScannerPhase('live')
          console.log(`[scanner] live — ${subscribed}/${SYNTHETIC_SYMBOLS.length} symbols active`)
        }
      }
    }

    init()

    return () => {
      cancelled = true
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
