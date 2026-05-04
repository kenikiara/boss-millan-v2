import { AUTH_TOKEN_KEY, AUTH_SELECTED_ACCOUNT_KEY } from '../constants'
import type { DerivAccount } from '../types/deriv'

export function saveToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function saveAccount(account: DerivAccount): void {
  localStorage.setItem(AUTH_SELECTED_ACCOUNT_KEY, JSON.stringify(account))
}

export function getSavedToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getSavedAccount(): DerivAccount | null {
  try {
    const raw = localStorage.getItem(AUTH_SELECTED_ACCOUNT_KEY)
    return raw ? (JSON.parse(raw) as DerivAccount) : null
  } catch {
    return null
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_SELECTED_ACCOUNT_KEY)
}
