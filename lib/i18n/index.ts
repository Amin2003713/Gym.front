import {
  defaultLocale,
  dictionary,
  isAppLocale,
  type AppLocale,
  type TranslationKey,
} from './dictionary'
import { getDirection, getMessages } from './messages'

export {
  defaultLocale,
  dictionary,
  getDirection,
  getMessages,
  isAppLocale,
  type AppLocale,
  type TranslationKey,
}

export type TranslationVars = Record<string, string | number>

/**
 * Translate one UI key. Persian is the default; a missing locale string falls back to Persian,
 * then to the key itself so a gap is visible instead of rendering `undefined`.
 */
export function t(
  key: TranslationKey,
  vars?: TranslationVars,
  locale: AppLocale = defaultLocale,
): string {
  const template = dictionary[locale][key] ?? dictionary.fa[key] ?? key
  if (!vars) return template

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

/** Read the active locale from the document when one is set, otherwise Persian. */
export function currentLocale(): AppLocale {
  if (typeof document === 'undefined') return defaultLocale
  const value = document.documentElement.lang
  return isAppLocale(value) ? value : defaultLocale
}

const readText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

/**
 * Persian-first localized read for API objects, with an English fallback per field.
 *
 * Accepts either of the shapes the API has used:
 *   { name: 'اسکوات' }                       — already localized by `languageCode`
 *   { name: 'Squat', nameFa: 'اسکوات' }      — explicit bilingual fields
 *   { name: { fa: 'اسکوات', en: 'Squat' } }  — nested pairs
 *
 * An empty or whitespace-only Persian value is treated as missing, which is the case the API's
 * own fallback cannot express (it returns the source language instead of an empty string).
 */
export function getLocalized(
  source: Record<string, unknown> | null | undefined,
  field: string,
  locale: AppLocale = defaultLocale,
): string {
  if (!source) return ''

  const faKey = `${field}Fa`
  const enKey = `${field}En`
  const value = source[field]
  const nested =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : null

  const candidates =
    locale === 'fa'
      ? [source[faKey], nested?.fa, value, source[enKey], nested?.en]
      : [source[enKey], nested?.en, value, source[faKey], nested?.fa]

  for (const candidate of candidates) {
    const text = readText(candidate)
    if (text) return text
  }

  return ''
}

/** Same contract as `getLocalized`, for list fields (instructions, bullet text). */
export function getLocalizedList(
  source: Record<string, unknown> | null | undefined,
  field: string,
  locale: AppLocale = defaultLocale,
): string[] {
  if (!source) return []

  const raw = source[field]
  const list = Array.isArray(raw) ? raw : []

  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object')
        return getLocalized(item as Record<string, unknown>, 'text', locale)
      return ''
    })
    .filter(Boolean)
}

/** The locale a body of text should render in, for `dir` attributes on mixed content. */
export function directionOf(locale: AppLocale = defaultLocale): 'rtl' | 'ltr' {
  return getDirection(locale)
}
