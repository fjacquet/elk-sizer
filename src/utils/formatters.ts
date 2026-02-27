export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatDuration(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365)
    const remaining = days % 365
    if (remaining === 0) return `${years}y`
    return `${years}y ${remaining}d`
  }
  return `${days}d`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
