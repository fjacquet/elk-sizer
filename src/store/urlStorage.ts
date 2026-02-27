import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { toast } from 'sonner'
import type { StateStorage } from 'zustand/middleware'

export const urlHashStorage: StateStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null

    const hash = window.location.hash.slice(1)
    if (!hash) return null

    try {
      const searchParams = new URLSearchParams(hash)
      const compressed = searchParams.get(key)
      if (!compressed) return null

      const decompressed = decompressFromEncodedURIComponent(compressed)
      if (!decompressed) return null

      return decompressed
    } catch (error) {
      console.error('Failed to parse URL hash state:', error)
      toast.error('Invalid configuration link', {
        description: 'Unable to load configuration from URL. Using default settings instead.',
        duration: 5000,
      })
      return null
    }
  },

  setItem: (key: string, newValue: string): void => {
    if (typeof window === 'undefined') return

    try {
      const compressed = compressToEncodedURIComponent(newValue)
      const searchParams = new URLSearchParams(window.location.hash.slice(1))
      searchParams.set(key, compressed)

      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#${searchParams.toString()}`,
      )
    } catch (error) {
      console.warn('Failed to persist state to URL:', error)
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return

    const searchParams = new URLSearchParams(window.location.hash.slice(1))
    searchParams.delete(key)

    const newHash = searchParams.toString()
    window.history.replaceState(
      null,
      '',
      newHash
        ? `${window.location.pathname}${window.location.search}#${newHash}`
        : `${window.location.pathname}${window.location.search}`,
    )
  },
}

export function getShareableUrl(): string {
  return window.location.href
}

export async function copyShareableUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getShareableUrl())
    return true
  } catch {
    return false
  }
}
