import type { Metadata, Viewport } from 'next'
import './globals.css'
import NextTopLoader from 'nextjs-toploader'

import { NetworkQualityProvider } from '@/components/network-quality'
import { ServiceWorkerCleanup } from '@/components/service-worker-cleanup'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import ShadCnDirProvider from '@/providers/direction-provider'
import { ReactQueryProvider } from '@/providers/react-query-provider'

// Vazirmatn (Persian) and Inter (Latin) are self-hosted from /public/fonts so the production
// build never needs egress to fonts.googleapis.com; see the @font-face rules in globals.css.

export const metadata: Metadata = {
  title: 'هم‌اوج | مدیریت گروه‌های ورزشی',
  applicationName: 'HamOwj',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/hamowj-mark.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'هم‌اوج',
  },
  description: 'هم‌اوج؛ سامانه یکپارچه مدیریت گروه‌های ورزشی، مربی‌ها و اعضا.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F3ED' },
    { media: '(prefers-color-scheme: dark)', color: '#1B1A1B' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased transition-colors">
        {/* Retires the worker left behind by the removed offline mode. */}
        <ServiceWorkerCleanup />
        {/* Sets data-network on <html> so CSS can drop expensive effects on slow links. */}
        <NetworkQualityProvider />
        <NextTopLoader showSpinner={false} />
        <ReactQueryProvider>
          <ShadCnDirProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </ShadCnDirProvider>
        </ReactQueryProvider>
        <Toaster />
      </body>
    </html>
  )
}
