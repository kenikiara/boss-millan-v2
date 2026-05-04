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
  ask?: number
  bid?: number
  id?: string
}

export interface TickHistory {
  prices: number[]
  times: number[]
}

export interface ActiveSymbol {
  underlying_symbol: string
  underlying_symbol_name: string
  market: string
  submarket?: string
  pip_size: number
  exchange_is_open: number
  is_trading_suspended: number
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
