import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { redirectToLogin } from '../api/oauth'
import { getAccessToken, getSavedAccount } from '../api/auth'
import { getOtpUrl } from '../api/derivRest'
import { useConnectionStore } from '../stores/connectionStore'

export function AuthPage() {
  const navigate = useNavigate()
  const { status, error, connect } = useConnectionStore()
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Auto-connect if session token exists (page refresh)
  useEffect(() => {
    const token = getAccessToken()
    const account = getSavedAccount()
    if (token && account && status === 'DISCONNECTED') {
      setLoading(true)
      getOtpUrl(token, account.account_id)
        .then(otpUrl => connect(otpUrl, account, token))
        .catch(err => {
          setLocalError(err instanceof Error ? err.message : 'Session expired — please log in again.')
          setLoading(false)
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === 'AUTHENTICATED') navigate('/dashboard', { replace: true })
  }, [status, navigate])

  const handleLogin = async () => {
    try {
      setLocalError(null)
      await redirectToLogin()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to initiate login')
    }
  }

  const isConnecting = status === 'CONNECTING' || loading
  const displayError = localError ?? (status === 'ERROR' ? error : null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e]">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm px-6">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-mono font-bold text-[#e2e8f0] tracking-widest uppercase">
            Boss Millan
          </h1>
          <p className="text-[#64748b] font-mono text-xs tracking-wider">
            signal scanner · synthetic indices
          </p>
        </div>

        <div className="w-px h-8 bg-[#1f2330]" />

        <div className="w-full space-y-3">
          {displayError && (
            <div className="border border-red-900 bg-[#1a0a0a] p-3 space-y-1">
              <p className="font-mono text-xs text-red-400">connection failed</p>
              <p className="font-mono text-xs text-[#64748b] break-all">{displayError}</p>
            </div>
          )}

          {isConnecting && (
            <p className="font-mono text-xs text-[#334155] text-center">
              status: {status.toLowerCase()}...
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-[#1f2330] hover:border-[#00d4a3] bg-[#111318] hover:bg-[#0d1f1a] text-[#e2e8f0] font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <span className="w-2 h-2 bg-[#00d4a3] rounded-full animate-pulse" />
                <span>connecting...</span>
              </>
            ) : (
              <>
                <span className="text-[#00d4a3] text-lg leading-none">⬡</span>
                <span>login with deriv</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full border-t border-[#1f2330] pt-6">
          <p className="font-mono text-xs text-[#334155] text-center leading-relaxed">
            you will be redirected to{' '}
            <span className="text-[#64748b]">deriv.com</span>{' '}
            to authenticate securely
          </p>
        </div>

      </div>
    </div>
  )
}
