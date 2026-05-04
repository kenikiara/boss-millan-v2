import { create } from 'zustand'
import { DerivSocket } from '../api/DerivSocket'
import { clearAuth } from '../api/auth'
import type { DerivAccount } from '../api/derivRest'
import { getOtpUrl } from '../api/derivRest'
import { RECONNECT_DELAY_MS } from '../constants'

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'AUTHENTICATED'
  | 'ERROR'

interface ConnectionState {
  status: ConnectionStatus
  socket: DerivSocket | null
  account: DerivAccount | null
  accessToken: string | null
  error: string | null

  connect: (otpUrl: string, account: DerivAccount, accessToken: string) => void
  logout: () => void
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: 'DISCONNECTED',
  socket: null,
  account: null,
  accessToken: null,
  error: null,

  connect: (otpUrl, account, accessToken) => {
    const existing = get().socket
    if (existing) existing.destroy()

    set({ status: 'CONNECTING', error: null, account, accessToken })

    const socket = new DerivSocket(otpUrl, async (connected, closeCode, closeReason) => {
      if (!connected) {
        const { status: s, account: acc, accessToken: token } = get()

        // Unexpected disconnect from authenticated state — reconnect with fresh OTP
        if (s === 'AUTHENTICATED' && acc && token) {
          set({ status: 'CONNECTING' })
          setTimeout(async () => {
            try {
              const freshOtpUrl = await getOtpUrl(token, acc.account_id)
              get().connect(freshOtpUrl, acc, token)
            } catch {
              set({ status: 'ERROR', socket: null, error: 'Reconnection failed — please log in again.' })
            }
          }, RECONNECT_DELAY_MS)
          return
        }

        // Failed to connect in the first place
        if (s === 'CONNECTING') {
          let error = 'WebSocket connection failed.'
          if (closeCode === 1006) error = `Connection rejected (code 1006)${closeReason ? `: ${closeReason}` : ''}`
          else if (closeCode && closeCode !== 1000) error = `WebSocket closed — code ${closeCode}`
          set({ status: 'ERROR', socket: null, error })
          return
        }

        set({ status: 'DISCONNECTED', socket: null })
        return
      }

      // OTP-authenticated — no authorize message needed
      set({ status: 'AUTHENTICATED' })
    })

    set({ socket })
  },

  logout: () => {
    get().socket?.destroy()
    clearAuth()
    set({ status: 'DISCONNECTED', socket: null, account: null, accessToken: null, error: null })
  },
}))
