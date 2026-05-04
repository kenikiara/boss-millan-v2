export function extractDigit(price: number, pipSize: number): number {
  // Multiply by 10^pipSize, round to eliminate float errors, take last digit
  return Math.abs(Math.round(price * Math.pow(10, pipSize))) % 10
}

export function countDigits(digits: number[]): number[] {
  const counts = new Array(10).fill(0)
  for (const d of digits) counts[d]++
  return counts
}

export function digitsFromPrices(prices: number[], pipSize: number): number[] {
  return prices.map(p => extractDigit(p, pipSize))
}
