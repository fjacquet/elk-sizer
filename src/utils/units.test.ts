import { describe, expect, it } from 'vitest'
import { formatCO2, formatPower, formatStorageGB, formatStorageTB } from './units'

describe('Unit Formatters', () => {
  describe('formatStorageGB', () => {
    it('formats GB in binary', () => {
      expect(formatStorageGB(500, 'binary')).toBe('500.0 GiB')
    })

    it('formats TB in binary', () => {
      expect(formatStorageGB(2048, 'binary')).toBe('2.00 TiB')
    })

    it('formats PB in binary', () => {
      expect(formatStorageGB(1024 * 1024 * 2, 'binary')).toBe('2.00 PiB')
    })

    it('formats GB in decimal', () => {
      expect(formatStorageGB(500, 'decimal')).toBe('500.0 GB')
    })

    it('formats TB in decimal', () => {
      expect(formatStorageGB(2000, 'decimal')).toBe('2.00 TB')
    })
  })

  describe('formatStorageTB', () => {
    it('converts TB to GB and formats', () => {
      expect(formatStorageTB(1, 'binary')).toBe('1.00 TiB')
    })
  })

  describe('formatPower', () => {
    it('formats watts', () => {
      expect(formatPower(500)).toBe('500 W')
    })

    it('formats kilowatts', () => {
      expect(formatPower(12500)).toBe('12.5 kW')
    })
  })

  describe('formatCO2', () => {
    it('formats kilograms', () => {
      expect(formatCO2(500)).toBe('500 kg CO2')
    })

    it('formats tonnes', () => {
      expect(formatCO2(2500)).toBe('2.5 t CO2')
    })
  })
})
