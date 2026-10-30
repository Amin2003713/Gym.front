'use client'

import { useCallback, useEffect, useState } from 'react'

import { getPreferences, savePreferences } from '@/app/(tenant)/_api/preferences-api'
import {
  DEFAULT_PREFERENCES,
  type MemberPreferences,
} from '@/app/(tenant)/_model/preferences'
import { toast } from '@/lib/toast'

export interface PreferencesForm {
  /** The loaded settings; null while the first read is in flight. */
  preferences: MemberPreferences | null
  /** The editable copy bound to the form controls. */
  draft: MemberPreferences
  update: (patch: Partial<MemberPreferences>) => void
  replace: (next: MemberPreferences) => void
  save: () => Promise<void>
  saving: boolean
  dirty: boolean
}

/**
 * One settings object for every section: the page edits a draft, and the save button writes the
 * whole shape back (the API replaces it), so sections never end up half-applied.
 */
export function usePreferences(): PreferencesForm {
  const [preferences, setPreferences] = useState<MemberPreferences | null>(null)
  const [draft, setDraft] = useState<MemberPreferences>(DEFAULT_PREFERENCES)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const loaded = await getPreferences()

        if (cancelled) return

        setPreferences(loaded)
        setDraft(loaded)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت تنظیمات ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const update = useCallback((patch: Partial<MemberPreferences>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  const replace = useCallback((next: MemberPreferences) => setDraft(next), [])

  const save = useCallback(async () => {
    setSaving(true)

    try {
      const saved = await savePreferences(draft)
      setPreferences(saved)
      setDraft(saved)
      toast.success('تنظیمات ذخیره شد')
    } catch (error) {
      toast.error('ذخیره تنظیمات ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }, [draft])

  const dirty = JSON.stringify(draft) !== JSON.stringify(preferences ?? DEFAULT_PREFERENCES)

  return { preferences, draft, update, replace, save, saving, dirty }
}
