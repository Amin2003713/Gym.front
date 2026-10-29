'use client'

import { useTheme } from 'next-themes'
import { Toaster as SileoToaster } from 'sileo'

/**
 * Keep the existing component path to avoid unnecessary layout churn while
 * switching the underlying notification renderer from Sonner to Sileo.
 */
const Toaster = () => {
  const { resolvedTheme } = useTheme()

  return (
    <SileoToaster
      position="top-center"
      offset={{ top: 16, left: 16, right: 16 }}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      options={{
        fill: 'var(--card)',
        styles: {
          title: 'font-vazirmatn text-foreground',
          description: 'font-vazirmatn text-muted-foreground',
        },
      }}
    />
  )
}

export { Toaster }
