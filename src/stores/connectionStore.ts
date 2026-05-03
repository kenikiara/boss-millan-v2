import { create } from 'zustand'
import { DerivSocket } from '../api/DerivSocket'
import { clearAuth, getSavedAccount, getSavedToken } from '../api/auth'
import { DERIV_WS_URL } from '../constants'
import type { AuthorizeResponse, DerivAccount } from '../types/deriv'

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'ERROR'

interface ConnectionState {
  status: ConnectionStatus
  socket: DerivSocket | null
  token: string | null
  account: DerivAccount | null
  error: string | null

  initSocket: (token: string) => void
  setStatus: (status: ConnectionStatus) => void
  logout: () => void
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: 'DISCONNECTED',
  socket: null,
  token: getSavedToken(),
  account: getSavedAccount(),
  error: null,

  initSocket: (token: string) => {
    const existing = get().socket
    if (existing) existing.destroy()

    set({ status: 'CONNECTING', error: null, token })

    const socket = new DerivSocket(DERIV_WS_URL, async (connected) => {
      if (!connected) {
        set({ status: 'DISCONNECTED' })
        return
      }

      set({ status: 'AUTHENTICATING' })

      try {
        const res = await socket.send({ authorize: token })
        if (res.error) throw new Error(res.error.message)

        const auth = res.authorize as AuthorizeResponse
        const account: DerivAccount = {
          account_id: auth.loginid,
          token,
          currency: auth.currency,
          is_virtual: auth.is_virtual === 1,
        }

        set({ status: 'AUTHENTICATED', account })
      } catch (err) {
        set({
          status: 'ERROR',
          error: err instanceof Error ? err.message : 'Authorization failed',
        })
      }
    })

    set({ socket })
  },

  setStatus: (status) => set({ status }),

  logout: () => {
    const socket = get().socket
    socket?.destroy()
    clearAuth()
    set({ status: 'DISCONNECTED', socket: null, token: null, account: null, error: null })
  },
}))
