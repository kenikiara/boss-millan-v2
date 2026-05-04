import {
  DERIV_AUTH_ENDPOINT,
  DERIV_CLIENT_ID,
  DERIV_TOKEN_ENDPOINT,
  OAUTH_STATE_KEY,
  PKCE_VERIFIER_KEY,
} from '../constants'

function getRedirectUri(): string {
  return `${window.location.origin}/auth/callback`
}

async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const array = crypto.getRandomValues(new Uint8Array(64))
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const codeVerifier = Array.from(array).map(v => charset[v % charset.length]).join('')

  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return { codeVerifier, codeChallenge }
}

export async function redirectToLogin(): Promise<void> {
  const { codeVerifier, codeChallenge } = await generatePKCE()
  const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier)
  sessionStorage.setItem(OAUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: DERIV_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: 'trade',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${DERIV_AUTH_ENDPOINT}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, state: string): Promise<string> {
  const storedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)

  if (state !== storedState) throw new Error('OAuth state mismatch — possible CSRF')
  if (!codeVerifier) throw new Error('PKCE verifier missing from session')

  sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)

  const res = await fetch(DERIV_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: DERIV_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: getRedirectUri(),
    }).toString(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${body}`)
  }

  const data = await res.json() as { access_token: string }
  return data.access_token
}
