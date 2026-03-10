import { clamp, formatDuration, formatPercent } from './formatters'

describe('formatPercent', () => {
  it('formats 0.5 as 50.0%', () => {
    expect(formatPercent(0.5)).toBe('50.0%')
  })

  it('formats 0.123 with 2 decimals as 12.30%', () => {
    expect(formatPercent(0.123, 2)).toBe('12.30%')
  })

  it('formats 1 as 100.0%', () => {
    expect(formatPercent(1)).toBe('100.0%')
  })

  it('formats 0 as 0.0%', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })
})

describe('formatDuration', () => {
  it('formats 30 days as 30d', () => {
    expect(formatDuration(30)).toBe('30d')
  })

  it('formats 365 days as 1y', () => {
    expect(formatDuration(365)).toBe('1y')
  })

  it('formats 400 days as 1y 35d', () => {
    expect(formatDuration(400)).toBe('1y 35d')
  })

  it('formats 730 days as 2y', () => {
    expect(formatDuration(730)).toBe('2y')
  })

  it('formats 1 day as 1d', () => {
    expect(formatDuration(1)).toBe('1d')
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min when below range', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })
})
