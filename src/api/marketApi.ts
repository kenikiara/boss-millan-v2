import type { DerivSocket } from './DerivSocket'
import type { DerivResponse } from '../types/deriv'

interface HistoryPayload {
  prices: number[]
  times: number[]
}

interface TickPayload {
  quote: number
  symbol: string
  epoch: number
  pip_size: number
}

interface ActiveSymbolPayload {
  underlying_symbol: string
  pip_size: number
  exchange_is_open: number
  is_trading_suspended: number
}

export async function getPipSizes(
  socket: DerivSocket,
  symbols: readonly string[],
): Promise<Record<string, number>> {
  const res = await socket.send({ active_symbols: 'brief' })
  const list = (res.active_symbols ?? []) as ActiveSymbolPayload[]

  const map: Record<string, number> = {}
  for (const sym of list) {
    if (symbols.includes(sym.underlying_symbol)) {
      map[sym.underlying_symbol] = sym.pip_size
    }
  }
  // Default 2 for any symbol not found in active list
  for (const sym of symbols) {
    if (!(sym in map)) map[sym] = 2
  }
  return map
}

export async function getTickHistory(
  socket: DerivSocket,
  symbol: string,
  count = 1000,
): Promise<number[]> {
  const res = await socket.send({
    ticks_history: symbol,
    end: 'latest',
    count,
    style: 'ticks',
  })
  const history = res.history as HistoryPayload | undefined
  return history?.prices ?? []
}

export function subscribeToTicks(
  socket: DerivSocket,
  symbol: string,
  handler: (quote: number, pipSize: number) => void,
): Promise<number> {
  return socket.subscribe({ ticks: symbol }, (response: DerivResponse) => {
    const tick = response.tick as TickPayload | undefined
    if (tick?.quote !== undefined) {
      handler(tick.quote, tick.pip_size ?? 2)
    }
  })
}
