import { type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useConnectionStore } from '../../stores/connectionStore'
import { StatusDot } from './StatusDot'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { logout, account } = useConnectionStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0b0e]">
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1f2330] bg-[#111318]">
        <div className="flex items-center gap-6">
          <span className="font-mono font-bold text-sm text-[#e2e8f0] tracking-widest uppercase">
            <span className="text-[#00d4a3]">boss</span> millan
          </span>
          <nav className="flex items-center gap-4">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `font-mono text-xs transition-colors ${
                  isActive ? 'text-[#00d4a3]' : 'text-[#64748b] hover:text-[#e2e8f0]'
                }`
              }
            >
              dashboard
            </NavLink>
            <NavLink
              to="/scanner"
              className={({ isActive }) =>
                `font-mono text-xs transition-colors ${
                  isActive ? 'text-[#00d4a3]' : 'text-[#64748b] hover:text-[#e2e8f0]'
                }`
              }
            >
              scanner
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <StatusDot />
          {account && (
            <span className="text-[#64748b] font-mono text-xs">
              {account.account_id}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-[#334155] hover:text-[#ef4444] font-mono text-xs transition-colors"
          >
            disconnect
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
