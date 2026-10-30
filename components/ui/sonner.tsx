'use client'

import { useTheme } from 'next-themes'
import { Toaster as SileoToaster } from 'sileo'

/**
 * Keep the existing component path to avoid unnecessary layout churn while
 * switching the underlying notification renderer from Sonner to Sileo.
 *
 * The surface uses the solid popover background (not the translucent card) and
 * a strong border/foreground so messages stay legible over busy screens such as
 * the workout runner and the plans grid.
 */
const Toaster = () => {
  const { resolvedTheme } = useTheme()

  return (
    <div className="hamowj-toaster">
      <SileoToaster
        position="top-center"
        offset={{ top: 16, left: 16, right: 16 }}
        theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        options={{
          fill: 'var(--popover)',
          roundness: 14,
          styles: {
            title: 'font-vazirmatn text-[15px] font-semibold text-foreground',
            description: 'font-vazirmatn text-[13px] leading-6 text-foreground/75',
            button: 'font-vazirmatn text-sm font-semibold text-primary',
          },
        }}
      />
    </div>
  )
}

export { Toaster }
