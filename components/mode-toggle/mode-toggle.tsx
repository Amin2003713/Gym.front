'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

import { Moon, Sun } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { markThemeChoice } from '@/lib/theme-choice'

// Hydration-safe "mounted" flag without a setState-in-effect cascade.
const subscribe = () => () => {}

const useMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

export function ModeToggle({
  onThemeChange,
}: {
  /** Called after the click flips the palette, so the choice can be saved to the profile. */
  onThemeChange?: (theme: 'light' | 'dark') => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? 'فعال‌سازی حالت روشن' : 'فعال‌سازی حالت تیره'}
      title={isDark ? 'حالت روشن' : 'حالت تیره'}
      onClick={() => {
        const next = isDark ? 'light' : 'dark'
        markThemeChoice()
        setTheme(next)
        onThemeChange?.(next)
      }}
      className="shrink-0 relative border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground size-9 shadow-sm transition-colors"
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-5" aria-hidden="true" />
        ) : (
          <Moon className="size-5" aria-hidden="true" />
        )
      ) : (
        <span className="size-5" aria-hidden="true" />
      )}
      <span className="sr-only">تغییر پوسته روشن و تیره</span>
    </Button>
  )
}
