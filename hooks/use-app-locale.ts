'use client'

import { useEffect, useState } from 'react'
import type { AppLocale } from '@/lib/i18n/messages'

/** Reads the active document locale so API-backed dropdowns request matching translations. */
export function useAppLocale(): AppLocale {
  const [locale, setLocale] = useState<AppLocale>('fa')
  useEffect(() => {
    const read = () => setLocale(document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'fa')
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, [])
  return locale
}
