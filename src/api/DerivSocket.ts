import { DERIV_WS_URL, PING_INTERVAL_MS, RECONNECT_DELAY_MS, WS_RATE_LIMIT } from '../constants'
import type { DerivRequest, DerivResponse } from '../types/deriv'

type MessageHandler = (response: DerivResponse) => void
type StatusHandler = (connected: boolean, closeCode?: number, closeReason?: string) => void

interface QueuedRequest {
  payload: DerivRequest
  resolve: (res: DerivResponse) => void
  reject: (err: Error) => void
}

export class DerivSocket {
  private ws: WebSocket | null = null
  private url: string
  private reqId = 1
  private pendingResolvers = new Map<number, QueuedRequest['resolve']>()
  private pendingRejectors = new Map<number, (err: Error) => void>()
  private subscriptions = new Map<number, MessageHandler>()
  private queue: QueuedRequest[] = []
  private requestsThisSecond = 0
  private rateLimitTimer: ReturnType<typeof setInterval> | null = null
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false
  private onStatusChange: StatusHandler

  constructor(url = DERIV_WS_URL, onStatusChange: StatusHandler = () => {}) {
    this.url = url
    this.onStatusChange = onStatusChange
    this.connect()
  }

  private connect() {
    if (this.destroyed) return
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      this.onStatusChange(true)
      this.startRateLimit()
      this.startPing()
      this.drainQueue()
    }

    this.ws.onmessage = (event: MessageEvent) => {
      let data: DerivResponse
      try {
        data = JSON.parse(event.data as string)
      } catch {
        return
      }
      const id = data.req_id

      if (id !== undefined) {
        const resolver = this.pendingResolvers.get(id)
        const rejector = this.pendingRejectors.get(id)

        if (data.error) {
          rejector?.(new Error(`${data.error.code}: ${data.error.message}`))
          this.pendingResolvers.delete(id)
          this.pendingRejectors.delete(id)
        } else {
          resolver?.(data)
          if (!this.subscriptions.has(id)) {
            this.pendingResolvers.delete(id)
            this.pendingRejectors.delete(id)
          }
        }

        const subHandler = this.subscriptions.get(id)
        if (subHandler && !data.error) {
          subHandler(data)
        }
      }
    }

    this.ws.onclose = (event: CloseEvent) => {
      this.onStatusChange(false, event.code, event.reason)
      this.clearTimers()
      if (!this.destroyed) {
        this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_DELAY_MS)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  private startRateLimit() {
    this.rateLimitTimer = setInterval(() => {
      this.requestsThisSecond = 0
      this.drainQueue()
    }, 1000)
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      this.send({ ping: 1 }).catch(() => {})
    }, PING_INTERVAL_MS)
  }

  private clearTimers() {
    if (this.rateLimitTimer) clearInterval(this.rateLimitTimer)
    if (this.pingTimer) clearInterval(this.pingTimer)
    this.rateLimitTimer = null
    this.pingTimer = null
  }

  private drainQueue() {
    while (
      this.queue.length > 0 &&
      this.requestsThisSecond < WS_RATE_LIMIT &&
      this.ws?.readyState === WebSocket.OPEN
    ) {
      const item = this.queue.shift()!
      this.dispatchRaw(item)
    }
  }

  private dispatchRaw(item: QueuedRequest) {
    const id = item.payload.req_id as number
    this.pendingResolvers.set(id, item.resolve)
    this.pendingRejectors.set(id, item.reject)
    this.ws!.send(JSON.stringify(item.payload))
    this.requestsThisSecond++
  }

  send(payload: Omit<DerivRequest, 'req_id'>): Promise<DerivResponse> {
    return new Promise((resolve, reject) => {
      const id = this.reqId++
      const fullPayload = { ...payload, req_id: id }

      const item: QueuedRequest = { payload: fullPayload, resolve, reject }

      if (
        this.ws?.readyState === WebSocket.OPEN &&
        this.requestsThisSecond < WS_RATE_LIMIT
      ) {
        this.dispatchRaw(item)
      } else {
        this.queue.push(item)
      }
    })
  }

  subscribe(payload: Omit<DerivRequest, 'req_id'>, handler: MessageHandler): Promise<number> {
    return new Promise((resolve, reject) => {
      const id = this.reqId++
      const fullPayload = { ...payload, subscribe: 1, req_id: id }

      this.subscriptions.set(id, handler)

      const item: QueuedRequest = {
        payload: fullPayload,
        resolve: () => {
          resolve(id)
        },
        reject: (err) => {
          this.subscriptions.delete(id)
          reject(err)
        },
      }

      if (
        this.ws?.readyState === WebSocket.OPEN &&
        this.requestsThisSecond < WS_RATE_LIMIT
      ) {
        this.dispatchRaw(item)
      } else {
        this.queue.push(item)
      }
    })
  }

  forget(reqId: number): Promise<DerivResponse> {
    this.subscriptions.delete(reqId)
    this.pendingResolvers.delete(reqId)
    this.pendingRejectors.delete(reqId)
    return this.send({ forget: reqId })
  }

  forgetAll(type: string): Promise<DerivResponse> {
    return this.send({ forget_all: type })
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  destroy() {
    this.destroyed = true
    this.clearTimers()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
    this.queue = []
    this.subscriptions.clear()
    this.pendingResolvers.clear()
    this.pendingRejectors.clear()
  }
}
