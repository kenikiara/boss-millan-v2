export type SignalState = 'SCANNING' | 'ACTIVE' | 'WEAKENING' | 'EXPIRED'

export type ContractDirection = 'EVEN' | 'ODD' | 'OVER' | 'UNDER' | 'MATCH' | 'DIFFER'

export interface SignalMetrics {
  chiSquare: number
  zScore: number
  streakLength: number
  expectedMaxStreak: number
  digitCounts: number[]
  totalTicks: number
}

export interface Signal {
  id: string
  symbol: string
  contractType: string
  direction: ContractDirection
  state: SignalState
  confidence: number
  estimatedRuns: number
  metrics: SignalMetrics
  createdAt: number
  updatedAt: number
}
