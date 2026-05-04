import type { ContractType, Signal, SignalState } from '../types/signal'
import { countDigits, digitsFromPrices } from '../utils/digits'
import {
  CHI2_CRITICAL,
  Z_THRESHOLD,
  STREAK_EXPECTED_MAX,
  analyzeStreak,
  calculateConfidence,
  chiSquare,
  estimateRuns,
  zScore,
} from './stats'

type RawSignal = Omit<Signal, 'id' | 'createdAt' | 'updatedAt'>

function makeSignal(
  symbol: string,
  contractType: ContractType,
  chi2: number,
  z: number,
  streak: number,
  streakType: 'even' | 'odd',
  digit?: number,
): RawSignal | null {
  const confidence = calculateConfidence(chi2, Math.abs(z), streak)
  if (confidence < 45) return null
  const state: SignalState = confidence >= 70 ? 'ACTIVE' : 'WEAKENING'
  return {
    symbol,
    contractType,
    digit,
    state,
    confidence,
    chiSquare: chi2,
    zScore: z,
    streak,
    streakType,
    estimatedRuns: estimateRuns(streak),
  }
}

/**
 * Analyse the price buffer and return the strongest signal, or null.
 * Minimum 100 ticks required before any signal is emitted.
 */
export function generateSignal(
  symbol: string,
  prices: number[],
  pipSize: number,
): RawSignal | null {
  if (prices.length < 100) return null

  const digits = digitsFromPrices(prices, pipSize)
  const counts = countDigits(digits)
  const n = digits.length

  // Gate 1 — distribution must be non-uniform
  const chi2 = chiSquare(counts, n)
  if (chi2 < CHI2_CRITICAL) return null

  // Streak gate — recent behaviour must be skewed
  const { streak, streakType } = analyzeStreak(digits)
  if (streak <= STREAK_EXPECTED_MAX) return null

  const candidates: RawSignal[] = []

  // ── Even / Odd ───────────────────────────────────────────────────────────
  const evenCount = [0, 2, 4, 6, 8].reduce((s, d) => s + counts[d], 0)
  const oddCount  = [1, 3, 5, 7, 9].reduce((s, d) => s + counts[d], 0)

  if (streakType === 'odd') {
    // Odd streak running → bet on EVEN to correct
    const z = zScore(evenCount, n, 0.5)
    if (z < -Z_THRESHOLD) {
      const s = makeSignal(symbol, 'DIGITEVEN', chi2, z, streak, streakType)
      if (s) candidates.push(s)
    }
  }

  if (streakType === 'even') {
    // Even streak running → bet on ODD to correct
    const z = zScore(oddCount, n, 0.5)
    if (z < -Z_THRESHOLD) {
      const s = makeSignal(symbol, 'DIGITODD', chi2, z, streak, streakType)
      if (s) candidates.push(s)
    }
  }

  // ── Over / Under (digits 5–9 vs 0–4) ────────────────────────────────────
  const lowCount  = [0, 1, 2, 3, 4].reduce((s, d) => s + counts[d], 0)
  const highCount = [5, 6, 7, 8, 9].reduce((s, d) => s + counts[d], 0)

  const zLow  = zScore(lowCount,  n, 0.5)
  const zHigh = zScore(highCount, n, 0.5)

  if (zHigh < -Z_THRESHOLD) {
    const s = makeSignal(symbol, 'DIGITOVER', chi2, zHigh, streak, streakType)
    if (s) candidates.push(s)
  }
  if (zLow < -Z_THRESHOLD) {
    const s = makeSignal(symbol, 'DIGITUNDER', chi2, zLow, streak, streakType)
    if (s) candidates.push(s)
  }

  // ── Single-digit Match / Diff ─────────────────────────────────────────────
  let minZ = -Z_THRESHOLD
  let minDigit = -1
  let maxZ = Z_THRESHOLD
  let maxDigit = -1

  for (let d = 0; d < 10; d++) {
    const z = zScore(counts[d], n, 0.1)
    if (z < minZ) { minZ = z; minDigit = d }
    if (z > maxZ) { maxZ = z; maxDigit = d }
  }

  if (minDigit >= 0) {
    const s = makeSignal(symbol, 'DIGITMATCH', chi2, minZ, streak, streakType, minDigit)
    if (s) candidates.push(s)
  }
  if (maxDigit >= 0) {
    const s = makeSignal(symbol, 'DIGITDIFF', chi2, maxZ, streak, streakType, maxDigit)
    if (s) candidates.push(s)
  }

  if (candidates.length === 0) return null

  // Return the highest-confidence candidate
  return candidates.reduce((best, c) => (c.confidence > best.confidence ? c : best))
}
