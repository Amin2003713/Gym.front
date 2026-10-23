import * as React from 'react'

type HamOwjMarkProps = {
  className?: string
  title?: string
  monochrome?: boolean
  'aria-hidden'?: boolean
}

/** Custom connected-ascent mark: two forms rise from a shared baseline. */
export function HamOwjMarkSvg({ className, title = 'HamOwj', monochrome = false, 'aria-hidden': ariaHidden }: HamOwjMarkProps) {
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
      <path d="M8 64 36 22 49 41 64 64H45L36 51 27 64H8Z"
        fill={monochrome ? 'currentColor' : 'var(--brand-mark-primary, #FB9A3C)'} />
      <path d="M35 64 59 30 88 64H69L59 51 50 64H35Z"
        fill={monochrome ? 'currentColor' : 'var(--brand-mark-secondary, #C97B4A)'} />
    </svg>
  )
}

export function HamOwjBrandSvg({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <HamOwjMarkSvg className="h-10 w-12 shrink-0" />
    </span>
  )
}
