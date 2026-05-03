import {
  AUTH_CODE_VERIFIER_KEY,
  AUTH_STATE_KEY,
  AUTH_TOKEN_KEY,
  AUTH_ACCOUNT_KEY,
  DERIV_APP_ID,
  DERIV_AUTH_URL,
  DERIV_REST_BASE,
  DERIV_TOKEN_URL,
} from '../constants'
import type { DerivAccount, OAuthToken } from '../types/deriv'

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  return crypto.subtle.digest('SHA-256', encoder.encode(plain))
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((v) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
    .join('')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier)
  return base64UrlEncode(hash)
}

function generateState(): string {
  return crypto.getRandomValues(new Uint8Array(16))
    .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')
}

export async function startOAuthFlow(redirectUri: string): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  sessionStorage.setItem(AUTH_CODE_VERIFIER_KEY, verifier)
  sessionStorage.setItem(AUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: String(DERIV_APP_ID),
    redirect_uri: redirectUri,
    scope: 'trade',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${DERIV_AUTH_URL}?${params.toString()}`
}

export function verifyState(returnedState: string): boolean {
  const stored = sessionStorage.getItem(AUTH_STATE_KEY)
  return stored !== null && stored === returnedState
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<OAuthToken> {
  const verifier = sessionStorage.getItem(AUTH_CODE_VERIFIER_KEY)
  if (!verifier) throw new Error('Missing code verifier — auth session expired')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: String(DERIV_APP_ID),
    code_verifier: verifier,
  })

  const res = await fetch(DERIV_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${text}`)
  }

  const token: OAuthToken = await res.json()
  localStorage.setItem(AUTH_TOKEN_KEY, token.access_token)
  sessionStorage.removeItem(AUTH_CODE_VERIFIER_KEY)
  sessionStorage.removeItem(AUTH_STATE_KEY)
  return token
}

export async function getAccounts(accessToken: string): Promise<DerivAccount[]> {
  const res = await fetch(`${DERIV_REST_BASE}/trading/v1/options/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Deriv-App-ID': String(DERIV_APP_ID),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Accounts fetch failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  const raw = (json.data ?? []) as Array<{
    account_id: string
    currency: string
    account_type: string
  }>

  return raw.map((a) => ({
    account_id: a.account_id,
    currency: a.currency,
    is_virtual: a.account_type === 'demo',
  }))
}

export async function getAuthenticatedWsUrl(
  accountId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(
    `${DERIV_REST_BASE}/trading/v1/options/accounts/${accountId}/otp`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Deriv-App-ID': String(DERIV_APP_ID),
      },
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OTP request failed: ${res.status} ${text}`)
  }

  const json = await res.json()
  const url = json?.data?.url as string | undefined
  if (!url) throw new Error('OTP response missing websocket URL')
  return url
}

export function getSavedToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getSavedAccount(): DerivAccount | null {
  const raw = localStorage.getItem(AUTH_ACCOUNT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DerivAccount
  } catch {
    return null
  }
}

export function saveAccount(account: DerivAccount): void {
  localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(account))
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_ACCOUNT_KEY)
  sessionStorage.removeItem(AUTH_CODE_VERIFIER_KEY)
  sessionStorage.removeItem(AUTH_STATE_KEY)
}
