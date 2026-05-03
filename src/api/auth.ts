import {
  AUTH_TOKEN_KEY,
  AUTH_ACCOUNTS_KEY,
  AUTH_SELECTED_ACCOUNT_KEY,
  DERIV_APP_ID,
  DERIV_AUTH_URL,
} from '../constants'
import type { DerivAccount } from '../types/deriv'

export function startOAuthFlow(redirectUri: string): void {
  const params = new URLSearchParams({
    app_id: String(DERIV_APP_ID),
    l: 'EN',
    brand: 'deriv',
    redirect_uri: redirectUri,
  })
  window.location.href = `${DERIV_AUTH_URL}?${params.toString()}`
}

export interface OAuthCallbackAccounts {
  accounts: DerivAccount[]
}

export function parseOAuthCallback(): OAuthCallbackAccounts | null {
  const params = new URLSearchParams(window.location.search)
  const accounts: DerivAccount[] = []

  let i = 1
  while (params.get(`acct${i}`)) {
    accounts.push({
      account_id: params.get(`acct${i}`)!,
      token: params.get(`token${i}`)!,
      currency: params.get(`cur${i}`)!,
      is_virtual: params.get(`acct${i}`)!.startsWith('VRT'),
    })
    i++
  }

  return accounts.length > 0 ? { accounts } : null
}

export function saveAccounts(accounts: DerivAccount[]): void {
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function saveSelectedAccount(account: DerivAccount): void {
  localStorage.setItem(AUTH_SELECTED_ACCOUNT_KEY, JSON.stringify(account))
  localStorage.setItem(AUTH_TOKEN_KEY, account.token)
}

export function getSavedAccounts(): DerivAccount[] {
  try {
    return JSON.parse(localStorage.getItem(AUTH_ACCOUNTS_KEY) ?? '[]') as DerivAccount[]
  } catch {
    return []
  }
}

export function getSavedAccount(): DerivAccount | null {
  try {
    const raw = localStorage.getItem(AUTH_SELECTED_ACCOUNT_KEY)
    return raw ? (JSON.parse(raw) as DerivAccount) : null
  } catch {
    return null
  }
}

export function getSavedToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_ACCOUNTS_KEY)
  localStorage.removeItem(AUTH_SELECTED_ACCOUNT_KEY)
}
