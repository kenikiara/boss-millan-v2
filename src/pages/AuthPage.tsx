import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnectionStore } from '../stores/connectionStore'

export function AuthPage() {
  const navigate = useNavigate()
  const { status, token, error, initSocket } = useConnectionStore()
  const [input, setInput] = useState('')
  const [show, setShow] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (token && status === 'DISCONNECTED') {
      initSocket(token)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      navigate('/dashboard', { replace: true })
    }
  }, [status, navigate])

  const handleConnect = () => {
    const t = input.trim()
    if (!t) return
    initSocket(t)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConnect()
  }

  const isLoading = status === 'CONNECTING' || status === 'AUTHENTICATING'

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
          <label className="block font-mono text-xs text-[#64748b] tracking-wider uppercase">
            Deriv API Token
          </label>

          <div className="relative">
            <input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="paste your token here"
              disabled={isLoading}
              className="w-full bg-[#111318] border border-[#1f2330] focus:border-[#00d4a3] outline-none px-4 py-3 font-mono text-sm text-[#e2e8f0] placeholder-[#334155] transition-colors disabled:opacity-50 pr-16"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#334155] hover:text-[#64748b] font-mono text-xs transition-colors"
            >
              {show ? 'hide' : 'show'}
            </button>
          </div>

          {error && (
            <div className="border border-red-900 bg-[#1a0a0a] p-3 space-y-1">
              <p className="font-mono text-xs text-red-400">connection failed</p>
              <p className="font-mono text-xs text-[#64748b] break-all">{error}</p>
            </div>
          )}

          {!error && status !== 'DISCONNECTED' && (
            <p className="font-mono text-xs text-[#334155]">status: {status.toLowerCase()}</p>
          )}

          <button
            onClick={handleConnect}
            disabled={isLoading || !input.trim()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-[#1f2330] hover:border-[#00d4a3] bg-[#111318] hover:bg-[#0d1f1a] text-[#e2e8f0] font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-2 h-2 bg-[#00d4a3] rounded-full animate-pulse" />
                <span>{status === 'CONNECTING' ? 'connecting...' : 'authorizing...'}</span>
              </>
            ) : (
              <>
                <span className="text-[#00d4a3] text-lg leading-none">⬡</span>
                <span>connect</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full border-t border-[#1f2330] pt-6 space-y-2">
          <p className="font-mono text-xs text-[#334155] text-center">
            don't have a token?
          </p>
          <div className="flex flex-col items-center gap-1">
            <p className="font-mono text-xs text-[#334155] text-center leading-relaxed">
              go to{' '}
              <span className="text-[#64748b]">app.deriv.com → Settings → API Token</span>
            </p>
            <p className="font-mono text-xs text-[#334155] text-center">
              create a token with{' '}
              <span className="text-[#64748b]">Read</span> +{' '}
              <span className="text-[#64748b]">Trade</span> scopes
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
