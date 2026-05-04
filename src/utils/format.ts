export function formatPrice(price: number, pipSize: number): string {
  return price.toFixed(pipSize)
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence)}%`
}

export function formatAge(createdAt: number): string {
  const secs = Math.floor((Date.now() - createdAt) / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  return `${mins}m ago`
}

export function formatContractType(contractType: string, digit?: number): string {
  switch (contractType) {
    case 'DIGITEVEN':  return 'EVEN'
    case 'DIGITODD':   return 'ODD'
    case 'DIGITOVER':  return 'OVER'
    case 'DIGITUNDER': return 'UNDER'
    case 'DIGITMATCH': return digit !== undefined ? `MATCH ${digit}` : 'MATCH'
    case 'DIGITDIFF':  return digit !== undefined ? `DIFF ${digit}` : 'DIFF'
    default:           return contractType
  }
}
