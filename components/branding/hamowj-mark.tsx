'use client'

import { useTheme } from 'next-themes'
import * as React from 'react'

type HamOwjMarkProps = {
  className?: string
  title?: string
  monochrome?: boolean
  'aria-hidden'?: boolean
}

type HamOwjBrandProps = {
  className?: string
  showText?: boolean
}

export function HamOwjMarkDark({
  className,
  title = 'HamOwj',
  monochrome = false,
  'aria-hidden': ariaHidden,
}: HamOwjMarkProps) {
  return (
    <svg
      aria-label={ariaHidden ? undefined : title}
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : 'img'}
      viewBox="0 0 100 76"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!ariaHidden && <title>{title}</title>}
      <path
        d="M8 64 36 22 49 41 64 64H45L36 51 27 64H8Z"
        fill={monochrome ? 'currentColor' : '#FB9A3C'}
      />
      <path
        d="M35 64 59 30 88 64H69L59 51 50 64H35Z"
        fill={monochrome ? 'currentColor' : '#352820'}
      />
    </svg>
  )
}

export function HamOwjMarkLite({
  className,
  title = 'HamOwj',
  monochrome = false,
  'aria-hidden': ariaHidden,
}: HamOwjMarkProps) {
  return (
    <svg
      aria-label={ariaHidden ? undefined : title}
      aria-hidden={ariaHidden}
      role={ariaHidden ? undefined : 'img'}
      viewBox="0 0 100 76"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!ariaHidden && <title>{title}</title>}
      <path
        d="M8 64 36 22 49 41 64 64H45L36 51 27 64H8Z"
        fill={monochrome ? 'currentColor' : '#FB9A3C'}
      />
      <path
        d="M35 64 59 30 88 64H69L59 51 50 64H35Z"
        fill={monochrome ? 'currentColor' : '#F6F3ED'}
      />
    </svg>
  )
}

export function HamOwjBrand({
  className = '',
  showText = false,
}: HamOwjBrandProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Keep server HTML and the first client render identical.
  // After mounting, render the logo for the resolved theme.
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <span
      className={`inline-flex items-center justify-center gap-3 ${className}`}
    >
      {isDark ? (
        <HamOwjMarkDark className="block h-10 w-12 shrink-0" aria-hidden />
      ) : (
        <HamOwjMarkLite className="block h-10 w-12 shrink-0" aria-hidden />
      )}

      {showText && (
        <span className="flex min-w-0 flex-col items-center justify-center text-center leading-tight">
          <span dir="ltr" className="font-black tracking-tight">
            HamOwj
          </span>
          <span className="text-sm font-semibold">هم‌اوج</span>
        </span>
      )}
    </span>
  )
}
