import { AUTH_ACCESS_TOKEN_KEY, AUTH_ACCOUNT_KEY } from '../constants'
import type { DerivAccount } from './derivRest'

export function saveAccessToken(token: string): void {
  sessionStorage.setItem(AUTH_ACCESS_TOKEN_KEY, token)
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(AUTH_ACCESS_TOKEN_KEY)
}

export function saveAccount(account: DerivAccount): void {
  sessionStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(account))
}

export function getSavedAccount(): DerivAccount | null {
  try {
    const raw = sessionStorage.getItem(AUTH_ACCOUNT_KEY)
    return raw ? (JSON.parse(raw) as DerivAccount) : null
  } catch {
    return null
  }
}

export function clearAuth(): void {
  sessionStorage.removeItem(AUTH_ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_ACCOUNT_KEY)
}
