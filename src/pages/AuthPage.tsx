import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  exchangeCodeForToken,
  getAccounts,
  getAuthenticatedWsUrl,
  saveAccount,
  startOAuthFlow,
  verifyState,
} from '../api/auth'
import { useConnectionStore } from '../stores/connectionStore'

const REDIRECT_URI = `${window.location.origin}/auth/callback`

function AuthCallback() {
  const navigate = useNavigate()
  const { setAuth, setStatus, initSocket } = useConnectionStore()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState('exchanging token...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const errorParam = params.get('error')

    if (errorParam) {
      setError(`Deriv rejected auth: ${params.get('error_description') ?? errorParam}`)
      return
    }

    if (!code) {
      setError('No authorization code in callback URL.')
      return
    }

    if (state && !verifyState(state)) {
      setError('State mismatch — possible CSRF. Please try again.')
      return
    }

    setStatus('AUTHENTICATING')

    ;(async () => {
      try {
        setStep('exchanging token...')
        const token = await exchangeCodeForToken(code, REDIRECT_URI)

        setStep('fetching accounts...')
        const accounts = await getAccounts(token.access_token)
        if (accounts.length === 0) throw new Error('No trading accounts found on this Deriv profile.')
        const account = accounts[0]

        setStep('opening secure connection...')
        const wsUrl = await getAuthenticatedWsUrl(account.account_id, token.access_token)

        saveAccount(account)
        setAuth(token.access_token, account)
        initSocket(wsUrl)

        navigate('/dashboard', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error during auth')
        setStatus('AUTH_REQUIRED')
      }
    })()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e]">
        <div className="text-center space-y-4 max-w-sm px-6">
          <p className="text-red-400 font-mono text-sm tracking-wider">AUTH ERROR</p>
          <p className="text-[#64748b] font-mono text-xs leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="text-[#00d4a3] font-mono text-xs hover:underline"
          >
            ← back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e]">
      <div className="text-center space-y-3">
        <div className="w-2 h-2 bg-[#00d4a3] rounded-full animate-pulse mx-auto" />
        <p className="text-[#64748b] font-mono text-xs">{step}</p>
      </div>
    </div>
  )
}

function LoginPage() {
  const token = useConnectionStore((s) => s.token)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true })
  }, [token, navigate])

  const handleLogin = async () => {
    setLoading(true)
    await startOAuthFlow(REDIRECT_URI)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e]">
      <div className="flex flex-col items-center gap-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-mono font-bold text-[#e2e8f0] tracking-widest uppercase">
            Boss Millan
          </h1>
          <p className="text-[#64748b] font-mono text-xs tracking-wider">
            signal scanner · synthetic indices
          </p>
        </div>

        <div className="w-px h-12 bg-[#1f2330]" />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center gap-3 px-6 py-3 border border-[#1f2330] hover:border-[#00d4a3] bg-[#111318] hover:bg-[#0d1f1a] text-[#e2e8f0] font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-2 h-2 bg-[#00d4a3] rounded-full animate-pulse" />
              <span>redirecting...</span>
            </>
          ) : (
            <>
              <span className="text-[#00d4a3] text-lg leading-none">⬡</span>
              <span>connect with deriv</span>
            </>
          )}
        </button>

        <p className="text-[#334155] font-mono text-xs text-center max-w-xs">
          you'll be redirected to deriv to authorize access. no passwords stored.
        </p>
      </div>
    </div>
  )
}

export function AuthPage() {
  const isCallback = window.location.pathname === '/auth/callback'
  return isCallback ? <AuthCallback /> : <LoginPage />
}

