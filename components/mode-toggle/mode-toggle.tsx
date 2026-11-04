'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

export function ModeToggle({
  onThemeChange,
}: {
  /** Called after the click flips the palette, so the choice can be saved to the profile. */
  onThemeChange?: (theme: 'light' | 'dark') => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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
        setTheme(next)
        onThemeChange?.(next)
      }}
      className="relative border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {mounted ? (isDark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />) : (
        <span className="size-5" aria-hidden="true" />
      )}
      <span className="sr-only">تغییر پوسته روشن و تیره</span>
    </Button>
  )
}
