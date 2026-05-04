import { create } from 'zustand'
import { DerivSocket } from '../api/DerivSocket'
import { clearAuth, getSavedAccount, getSavedToken, saveAccount, saveToken } from '../api/auth'
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

    const socket = new DerivSocket(DERIV_WS_URL, async (connected, closeCode, closeReason) => {
      if (!connected) {
        const s = get().status
        if (s === 'CONNECTING' || s === 'AUTHENTICATING') {
          let error = 'WebSocket connection failed. Check your internet connection.'
          if (closeCode === 1006) {
            error = 'Connection rejected (code 1006). App ID 3376 may not be registered for this domain — add boss-millan-v2.vercel.app in your Deriv app settings.'
          } else if (closeCode && closeCode !== 1000) {
            error = `WebSocket closed — code ${closeCode}${closeReason ? `: ${closeReason}` : ''}. Check your Deriv app registration.`
          }
          set({ status: 'ERROR', error })
        } else {
          set({ status: 'DISCONNECTED' })
        }
        return
      }

      set({ status: 'AUTHENTICATING' })

      const authTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Authorization timed out')), 10000)
      )

      try {
        const res = await Promise.race([socket.send({ authorize: token }), authTimeout])

        const auth = res.authorize as AuthorizeResponse
        const account: DerivAccount = {
          account_id: auth.loginid,
          token,
          currency: auth.currency,
          is_virtual: auth.is_virtual === 1,
        }

        saveToken(token)
        saveAccount(account)
        set({ status: 'AUTHENTICATED', account })
      } catch (err) {
        socket.destroy()
        set({
          status: 'ERROR',
          socket: null,
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
