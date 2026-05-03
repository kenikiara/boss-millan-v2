export interface DerivRequest {
  req_id?: number
  [key: string]: unknown
}

export interface DerivResponse {
  req_id?: number
  msg_type?: string
  error?: { code: string; message: string }
  [key: string]: unknown
}

export interface Tick {
  symbol: string
  epoch: number
  quote: number
  pip_size: number
}

export interface TickHistory {
  prices: number[]
  times: number[]
}

export interface ActiveSymbol {
  symbol: string
  display_name: string
  market: string
  market_display_name: string
  is_trading_suspended: number
  pip: number
}

export interface ContractInfo {
  contract_type: string
  contract_display_name: string
  min_contract_duration: string
  max_contract_duration: string
}

export interface Balance {
  balance: number
  currency: string
  id: string
  loginid: string
}

export interface OAuthToken {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface DerivAccount {
  account_id: string
  currency: string
  is_virtual: boolean
}
