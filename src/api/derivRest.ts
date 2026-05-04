import { DERIV_CLIENT_ID, DERIV_REST_BASE } from '../constants'

export interface DerivAccount {
  account_id: string
  balance: number
  currency: string
  account_type: 'demo' | 'real'
  status: string
  group: string
  email: string
  name: string
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Deriv-App-ID': DERIV_CLIENT_ID,
    'Content-Type': 'application/json',
  }
}

export async function getAccounts(accessToken: string): Promise<DerivAccount[]> {
  const res = await fetch(`${DERIV_REST_BASE}/trading/v1/options/accounts`, {
    headers: authHeaders(accessToken),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Failed to fetch accounts (${res.status})`)
  }

  const data = await res.json() as { data: DerivAccount[] }
  return data.data
}

export async function getOtpUrl(accessToken: string, accountId: string): Promise<string> {
  const res = await fetch(
    `${DERIV_REST_BASE}/trading/v1/options/accounts/${accountId}/otp`,
    { method: 'POST', headers: authHeaders(accessToken) }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Failed to get OTP (${res.status})`)
  }

  const data = await res.json() as { data: { url: string } }
  return data.data.url
}
