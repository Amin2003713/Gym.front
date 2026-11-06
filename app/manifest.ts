import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'هم‌اوج | مدیریت گروه‌های ورزشی',
    short_name: 'هم‌اوج',
    description: 'سامانه یکپارچه مدیریت گروه‌های ورزشی، مربی‌ها و اعضا.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#F6F3ED',
    theme_color: '#1B1A1B',
    lang: 'fa',
    dir: 'rtl',
    categories: ['health', 'fitness', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
