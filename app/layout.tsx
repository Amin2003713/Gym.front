import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import localFont from 'next/font/local'
import NextTopLoader from 'nextjs-toploader'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import ShadCnDirProvider from '@/providers/direction-provider'
import { ReactQueryProvider } from '@/providers/react-query-provider'

const figtree = Figtree({
  display: 'swap',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
})

const iranSans = localFont({
  src: [
    {
      path: '../public/fonts/IRANSansX-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-UltraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-DemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-ExtraBlack.woff2',
      weight: '950',
      style: 'normal',
    },
    {
      path: '../public/fonts/IRANSansX-Heavy.woff2',
      weight: '1000',
      style: 'normal',
    },
  ],
  variable: '--font-iranSans',
})

export const metadata: Metadata = {
  title: 'قدرت | مدیریت گروه‌های ورزشی',
  description: 'سامانه حرفه‌ای مدیریت گروه‌های ورزشی، شعبه‌ها، مربی‌ها، اعضا و برنامه‌های تمرینی',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`${figtree.variable} ${iranSans.variable}`}>
      <head>
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased transition-colors">
        <NextTopLoader showSpinner={false} />
        <ReactQueryProvider>
          <ShadCnDirProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </ShadCnDirProvider>
        </ReactQueryProvider>
        <Toaster richColors />
      </body>
    </html>
  )
}
