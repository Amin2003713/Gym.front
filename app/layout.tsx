import type { Metadata, Viewport } from 'next'
import { Inter, Vazirmatn } from 'next/font/google'
import './globals.css'
import NextTopLoader from 'nextjs-toploader'

import { NetworkQualityProvider } from '@/components/network-quality'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import ShadCnDirProvider from '@/providers/direction-provider'
import { ReactQueryProvider } from '@/providers/react-query-provider'

// Vazirmatn is the mandated Persian typeface (guide: weights 400/500/700/800).
const vazirmatn = Vazirmatn({
  display: 'swap',
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-vazirmatn',
})

// Inter is the mandated Latin/numeric companion typeface.
const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
})

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
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`${vazirmatn.variable} ${inter.variable}`}>
      <head>
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased transition-colors">
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
