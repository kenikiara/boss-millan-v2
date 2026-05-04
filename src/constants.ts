export const DERIV_CLIENT_ID = '3376QbHCFpokjovIRJo1P'

export const DERIV_AUTH_ENDPOINT  = 'https://auth.deriv.com/oauth2/auth'
export const DERIV_TOKEN_ENDPOINT = 'https://auth.deriv.com/oauth2/token'
export const DERIV_REST_BASE      = 'https://api.derivws.com'
export const DERIV_WS_PUBLIC      = 'wss://api.derivws.com/trading/v1/options/ws/public'

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

export const WS_RATE_LIMIT       = 100
export const MAX_SUBSCRIPTIONS   = 100
export const RECONNECT_DELAY_MS  = 3000
export const PING_INTERVAL_MS    = 30000

export const AUTH_ACCESS_TOKEN_KEY = 'bm_access_token'
export const AUTH_ACCOUNT_KEY      = 'bm_account'
export const PKCE_VERIFIER_KEY     = 'bm_pkce_verifier'
export const OAUTH_STATE_KEY       = 'bm_oauth_state'
