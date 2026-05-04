import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeCodeForToken } from '../api/oauth'
import { getAccounts, getOtpUrl } from '../api/derivRest'
import { saveAccessToken, saveAccount } from '../api/auth'
import { useConnectionStore } from '../stores/connectionStore'

type Step = 'exchanging' | 'fetching_accounts' | 'connecting' | 'error'

const STEP_LABELS: Record<Step, string> = {
  exchanging: 'exchanging auth code...',
  fetching_accounts: 'fetching accounts...',
  connecting: 'opening connection...',
  error: 'failed',
}

export function CallbackPage() {
  const navigate = useNavigate()
  const { connect, status } = useConnectionStore()
  const [step, setStep] = useState<Step>('exchanging')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      navigate('/dashboard', { replace: true })
      return
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const oauthError = params.get('error')
    const oauthErrorDesc = params.get('error_description')

    if (oauthError) {
      setStep('error')
      setError(oauthErrorDesc ?? oauthError)
      return
    }

    if (!code || !state) {
      setStep('error')
      setError('Invalid callback — missing code or state.')
      return
    }

    async function handleCallback() {
      try {
        // 1. Exchange auth code for access token
        const accessToken = await exchangeCodeForToken(code!, state!)
        saveAccessToken(accessToken)

        // 2. Fetch user accounts
        setStep('fetching_accounts')
        const accounts = await getAccounts(accessToken)
        if (accounts.length === 0) throw new Error('No trading accounts found on this Deriv account.')

        // Use first active account (demo preferred for safety)
        const account = accounts.find(a => a.account_type === 'demo') ?? accounts[0]
        saveAccount(account)

        // 3. Get OTP WebSocket URL
        setStep('connecting')
        const otpUrl = await getOtpUrl(accessToken, account.account_id)

        // 4. Open authenticated WebSocket
        connect(otpUrl, account, accessToken)
      } catch (err) {
        setStep('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleCallback()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === 'AUTHENTICATED') navigate('/dashboard', { replace: true })
  }, [status, navigate])

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e]">
        <div className="w-full max-w-sm px-6 space-y-4">
          <p className="font-mono text-xs text-red-400 text-center">login failed</p>
          <div className="border border-red-900 bg-[#1a0a0a] p-3">
            <p className="font-mono text-xs text-[#64748b] break-all">{error}</p>
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3 border border-[#1f2330] hover:border-[#00d4a3] bg-[#111318] text-[#e2e8f0] font-mono text-sm transition-all"
          >
            try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e]">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-mono font-bold text-[#e2e8f0] tracking-widest uppercase">
            Boss Millan
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-[#00d4a3] rounded-full animate-pulse" />
          <span className="font-mono text-xs text-[#64748b]">{STEP_LABELS[step]}</span>
        </div>
      </div>
    </div>
  )
}
