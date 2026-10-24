/** Shared UI copy for the locale-aware application shell. Persian is the default locale. */
export type AppLocale = 'fa' | 'en'

export const messages = {
  fa: {
    localeName: 'فارسی',
    switchLocale: 'English',
    dashboard: 'داشبورد',
    search: 'جستجو',
    members: 'اعضا',
    branches: 'شعبه‌ها',
    trainers: 'مربی‌ها',
    routines: 'برنامه‌های تمرینی',
    workouts: 'تمرین‌ها',
    history: 'تاریخچه تمرین',
    progress: 'پیشرفت',
    measurements: 'اندازه‌گیری‌ها',
    settings: 'تنظیمات',
    demoDataNotice: 'این بخش با دادهٔ نمایشی کار می‌کند و به API متصل نیست.',
  },
  en: {
    localeName: 'English',
    switchLocale: 'فارسی',
    dashboard: 'Dashboard',
    search: 'Search',
    members: 'Members',
    branches: 'Branches',
    trainers: 'Trainers',
    routines: 'Training routines',
    workouts: 'Workouts',
    history: 'Workout history',
    progress: 'Progress',
    measurements: 'Measurements',
    settings: 'Settings',
    demoDataNotice: 'This section uses demo data and is not connected to an API.',
  },
} as const satisfies Record<AppLocale, Record<string, string>>

export function getMessages(locale: AppLocale = 'fa') {
  return messages[locale]
}

export function getDirection(locale: AppLocale): 'rtl' | 'ltr' {
  return locale === 'fa' ? 'rtl' : 'ltr'
}
