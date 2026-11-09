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
  metadataBase: new URL('https://gymgroup.cv'),

  title: {
    default: 'هم‌اوج | باهم به اوج',
    template: '%s | هم‌اوج',
  },

  applicationName: 'HamOwj',

  manifest: '/manifest.webmanifest',

  alternates: {
    canonical: '/',
  },

  icons: {
    icon: '/hamowj-mark.svg',
    apple: '/icons/apple-touch-icon.png',
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'هم‌اوج',
  },

  description:
    'هم‌اوج، پلتفرم هوشمند مدیریت باشگاه ورزشی؛ مدیریت اعضا و مربیان، طراحی برنامه‌های تمرینی، تحلیل قدرت و خستگی عضلات، پیگیری پیشرفت ورزشکاران و فروش آنلاین محصولات و طرح‌های اشتراک باشگاه.',

  keywords: [
    'هم‌اوج',
    'مدیریت باشگاه',
    'نرم افزار مدیریت باشگاه ورزشی',
    'سامانه مدیریت باشگاه',
    'مدیریت مربیان ورزشی',
    'مدیریت اعضای باشگاه',
    'برنامه تمرینی',
    'طراحی برنامه بدنسازی',
    'تحلیل عضلات',
    'پیگیری پیشرفت ورزشی',
    'فروش آنلاین اشتراک باشگاه',
    'فروش محصولات ورزشی',
    'نرم افزار بدنسازی',
  ],

  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'هم‌اوج',
    url: 'https://gymgroup.cv',

    title: 'باهم به اوج؛ باشگاهت رو هوشمند مدیریت کن!',

    description:
      'اعضا و مربیان رو مدیریت کن، برنامه‌های تمرینی بساز، قدرت و خستگی عضلات رو تحلیل کن و پیشرفت ورزشکاران رو دنبال کن. چندین طرح اشتراک و محصولات ورزشی رو هم آنلاین به فروش برسون.',

    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'هم‌اوج؛ باهم به اوج',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',

    title: 'هم‌اوج | باهم به اوج',

    description:
      'مدیریت هوشمند باشگاه، مربیان، اعضا و پیشرفت ورزشکاران؛ همراه با فروش آنلاین اشتراک‌ها و محصولات ورزشی.',

    images: ['/og-image.png'],
  },

  category: 'fitness',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: '#F6F3ED',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#1B1A1B',
    },
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://gymgroup.cv/#organization',
      name: 'هم‌اوج',
      alternateName: 'HamOwj',
      url: 'https://gymgroup.cv',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gymgroup.cv/hamowj-mark.svg',
      },
      description:
        'پلتفرم هوشمند مدیریت باشگاه ورزشی، مربیان و اعضا؛ همراه با مدیریت اشتراک‌ها، برنامه‌های تمرینی و فروش آنلاین محصولات ورزشی.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://gymgroup.cv/#website',
      name: 'هم‌اوج',
      alternateName: 'HamOwj',
      url: 'https://gymgroup.cv',
      inLanguage: 'fa-IR',
      publisher: {
        '@id': 'https://gymgroup.cv/#organization',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://gymgroup.cv/#software',
      name: 'هم‌اوج',
      alternateName: 'HamOwj',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'fa-IR',
      url: 'https://gymgroup.cv',
      image: 'https://gymgroup.cv/og-image.png',
      description:
        'سامانه مدیریت هوشمند باشگاه ورزشی برای مدیریت اعضا، مربیان، برنامه‌های تمرینی، تحلیل قدرت و خستگی عضلات، پیگیری پیشرفت ورزشکاران، مدیریت چندین طرح اشتراک و فروش آنلاین محصولات ورزشی.',
      featureList: [
        'مدیریت اعضای باشگاه',
        'مدیریت مربیان',
        'طراحی و مدیریت برنامه‌های تمرینی',
        'تحلیل قدرت و خستگی عضلات',
        'پیگیری پیشرفت ورزشکاران',
        'مدیریت چندین طرح اشتراک',
        'فروش آنلاین محصولات ورزشی',
        'خرید آنلاین اشتراک باشگاه',
      ],
      publisher: {
        '@id': 'https://gymgroup.cv/#organization',
      },
    },
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
        <link rel="ard" href="/.well-known/ard.json" type="application/json" />

        <link rel="describedby" href="/llms.txt" type="text/markdown" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-svh antialiased transition-colors">
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
