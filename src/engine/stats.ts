export const CHI2_CRITICAL  = 16.919  // df=9, p<0.05
export const Z_THRESHOLD    = 1.5
export const STREAK_EXPECTED_MAX = 4.3   // geometric mean for p=0.5

/** Chi-square goodness-of-fit against uniform distribution (10 digits) */
export function chiSquare(counts: number[], n: number): number {
  if (n === 0) return 0
  const expected = n / 10
  return counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0)
}

/**
 * Z-score of an observed count against binomial expectation.
 * p = probability of the group under uniform distribution
 */
export function zScore(observed: number, n: number, p: number): number {
  const expected = n * p
  const stdDev = Math.sqrt(n * p * (1 - p))
  if (stdDev === 0) return 0
  return (observed - expected) / stdDev
}

export interface StreakResult {
  streak: number
  streakType: 'even' | 'odd'
}

/**
 * Count consecutive same-parity digits at the tail of the array.
 * Uses the last 100 digits to stay responsive to recent behaviour.
 */
export function analyzeStreak(digits: number[]): StreakResult {
  if (digits.length === 0) return { streak: 0, streakType: 'even' }

  const window = digits.slice(-100)
  const lastIsEven = window[window.length - 1] % 2 === 0
  let streak = 1

  for (let i = window.length - 2; i >= 0; i--) {
    if ((window[i] % 2 === 0) === lastIsEven) streak++
    else break
  }

  return { streak, streakType: lastIsEven ? 'even' : 'odd' }
}

/**
 * Composite confidence score (0–100) from all three indicators.
 * Weights: z-score 50%, chi-square 30%, streak 20%
 */
export function calculateConfidence(chi2: number, absZ: number, streak: number): number {
  const chiPct    = Math.min(1, (chi2   - CHI2_CRITICAL)        / 30)
  const zPct      = Math.min(1, (absZ   - Z_THRESHOLD)          / 2.5)
  const streakPct = Math.min(1, (streak - STREAK_EXPECTED_MAX)  / 5)
  return Math.round((chiPct * 0.3 + zPct * 0.5 + streakPct * 0.2) * 100)
}

/** Estimated profitable runs remaining in the signalled direction */
export function estimateRuns(streak: number): number {
  return Math.max(1, Math.min(10, Math.floor(streak - STREAK_EXPECTED_MAX + 1)))
}
