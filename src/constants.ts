export const DERIV_APP_ID = 1 // TODO: replace with BossMillan25 actual App ID from developers.deriv.com
export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`

export const SYNTHETIC_SYMBOLS = [
  'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
  '1HZ10V', '1HZ25V', '1HZ50V', '1HZ100V',
  'CRASH1000', 'CRASH500', 'BOOM1000', 'BOOM500',
  'stpRNG',
] as const

export type SyntheticSymbol = typeof SYNTHETIC_SYMBOLS[number]

export const SYMBOL_LABELS: Record<SyntheticSymbol, string> = {
  R_10: 'Volatility 10',
  R_25: 'Volatility 25',
  R_50: 'Volatility 50',
  R_75: 'Volatility 75',
  R_100: 'Volatility 100',
  '1HZ10V': 'Volatility 10 (1s)',
  '1HZ25V': 'Volatility 25 (1s)',
  '1HZ50V': 'Volatility 50 (1s)',
  '1HZ100V': 'Volatility 100 (1s)',
  CRASH1000: 'Crash 1000',
  CRASH500: 'Crash 500',
  BOOM1000: 'Boom 1000',
  BOOM500: 'Boom 500',
  stpRNG: 'Step Index',
}

export const WS_RATE_LIMIT = 100
export const MAX_SUBSCRIPTIONS = 100
export const RECONNECT_DELAY_MS = 3000
export const PING_INTERVAL_MS = 30000

export const AUTH_TOKEN_KEY = 'bm_token'
export const AUTH_SELECTED_ACCOUNT_KEY = 'bm_account'
