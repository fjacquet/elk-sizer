import type { UnitSystem } from '@/types/sizing'

export function formatStorageGB(gb: number, system: UnitSystem): string {
  if (system === 'binary') {
    if (gb >= 1024 * 1024) return `${(gb / (1024 * 1024)).toFixed(2)} PiB`
    if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TiB`
    return `${gb.toFixed(1)} GiB`
  }
  if (gb >= 1000 * 1000) return `${(gb / (1000 * 1000)).toFixed(2)} PB`
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`
  return `${gb.toFixed(1)} GB`
}

export function formatStorageTB(tb: number, system: UnitSystem): string {
  return formatStorageGB(tb * 1024, system)
}

export function formatNumber(n: number, locale = 'en-CH'): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)
}

export function formatCurrency(n: number, locale = 'en-CH', currency = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)} kW`
  return `${watts.toFixed(0)} W`
}

export function formatCO2(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t CO2`
  return `${kg.toFixed(0)} kg CO2`
}
