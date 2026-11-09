import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'هم‌اوج | باهم به اوج',
    short_name: 'هم‌اوج',

    description:
      'پلتفرم هوشمند مدیریت باشگاه ورزشی، مربیان و اعضا؛ طراحی برنامه تمرینی، تحلیل عملکرد عضلات، پیگیری پیشرفت و فروش آنلاین اشتراک‌ها و محصولات ورزشی.',

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
