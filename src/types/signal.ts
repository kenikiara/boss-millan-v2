export type ContractType =
  | 'DIGITEVEN'
  | 'DIGITODD'
  | 'DIGITOVER'
  | 'DIGITUNDER'
  | 'DIGITMATCH'
  | 'DIGITDIFF'

export type SignalState = 'ACTIVE' | 'WEAKENING'

export interface Signal {
  id: string
  symbol: string
  contractType: ContractType
  digit?: number        // DIGITMATCH / DIGITDIFF only
  state: SignalState
  confidence: number    // 0–100
  chiSquare: number
  zScore: number
  streak: number
  streakType: 'even' | 'odd'
  estimatedRuns: number
  createdAt: number     // Date.now()
  updatedAt: number
}
