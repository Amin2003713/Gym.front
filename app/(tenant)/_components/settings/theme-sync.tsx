'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { getPreferences } from '@/app/(tenant)/_api/preferences-api'
import { AppTheme, type MemberPreferences } from '@/app/(tenant)/_model/preferences'

const THEME_NAME: Record<AppTheme, 'system' | 'light' | 'dark'> = {
  [AppTheme.System]: 'system',
  [AppTheme.Light]: 'light',
  [AppTheme.Dark]: 'dark',
}

/**
 * Applies the look settings that live outside CSS classes: the theme and the member's own
 * primary/accent colours. Runs once per app load; both values are also re-applied by the settings
 * screen after a save, so the change is visible before the next navigation.
 */
export function ThemeSync() {
  const { setTheme } = useTheme()
  const [preferences, setPreferences] = useState<MemberPreferences | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const loaded = await getPreferences()

        if (cancelled) return

        setPreferences(loaded)
        setTheme(THEME_NAME[loaded.theme] ?? 'system')
      } catch {
        // Look settings are cosmetic: a failed read keeps the gym defaults.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [setTheme])

  useEffect(() => {
    if (!preferences) return

    const root = document.documentElement

    if (preferences.primaryColor) root.style.setProperty('--primary', preferences.primaryColor)
    else root.style.removeProperty('--primary')

    if (preferences.accentColor) root.style.setProperty('--accent', preferences.accentColor)
    else root.style.removeProperty('--accent')
  }, [preferences])

  return null
}
