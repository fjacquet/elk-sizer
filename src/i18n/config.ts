export const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'it'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = 'en'

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Francais',
  de: 'Deutsch',
  it: 'Italiano',
}

export const LOCALE_MAP: Record<Language, string> = {
  en: 'en-CH',
  fr: 'fr-CH',
  de: 'de-CH',
  it: 'it-CH',
}

export const NAMESPACES = [
  'common',
  'ingest',
  'retention',
  'performance',
  'deployment',
  'advanced',
  'output',
  'pdf',
  'guide',
  'advisor',
] as const

export type Namespace = (typeof NAMESPACES)[number]

export const DEFAULT_NAMESPACE: Namespace = 'common'

export const STORAGE_KEY = 'elk-sizer-language'
