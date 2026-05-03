import { create } from 'zustand'
import { DerivSocket } from '../api/DerivSocket'
import { clearAuth, getSavedAccount, getSavedToken } from '../api/auth'
import { DERIV_WS_PUBLIC } from '../constants'
import type { DerivAccount } from '../types/deriv'

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'AUTH_REQUIRED'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'ERROR'

interface ConnectionState {
  status: ConnectionStatus
  socket: DerivSocket | null
  token: string | null
  account: DerivAccount | null
  error: string | null

  initSocket: (wsUrl?: string) => void
  setStatus: (status: ConnectionStatus) => void
  setAuth: (token: string, account: DerivAccount) => void
  logout: () => void
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: 'DISCONNECTED',
  socket: null,
  token: getSavedToken(),
  account: getSavedAccount(),
  error: null,

  initSocket: (wsUrl?: string) => {
    const existing = get().socket
    if (existing) existing.destroy()

    set({ status: 'CONNECTING', error: null })

    const url = wsUrl ?? DERIV_WS_PUBLIC
    const socket = new DerivSocket(url, (connected) => {
      set({ status: connected ? (wsUrl ? 'AUTHENTICATED' : 'CONNECTED') : 'DISCONNECTED' })
    })

    set({ socket })
  },

  setStatus: (status) => set({ status }),

  setAuth: (token, account) => {
    set({ token, account })
  },

  logout: () => {
    const socket = get().socket
    socket?.destroy()
    clearAuth()
    set({
      status: 'AUTH_REQUIRED',
      socket: null,
      token: null,
      account: null,
      error: null,
    })
  },
}))
