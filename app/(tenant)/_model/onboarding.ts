/** Contracts and copy of the first-run tour, one flow per role. */

export type OnboardingRole = 'Trainee' | 'Trainer' | 'Admin'

export interface OnboardingChecklistItem {
  key: string
  done: boolean
}

export interface OnboardingState {
  role: OnboardingRole
  tourCompleted: boolean
  checklistDismissed: boolean
  checklist: OnboardingChecklistItem[]
}

export interface TourStep {
  title: string
  body: string
  href?: string
  cta?: string
}

const MEMBER_TOUR: TourStep[] = [
  {
    title: 'به هم‌اوج خوش آمدی',
    body: 'این‌جا تمرین‌هایت را ثبت می‌کنی، برنامه مربی را می‌بینی و پیشرفتت را با عدد دنبال می‌کنی. سه دقیقه وقت بگذار تا راه را نشانت بدهم.',
  },
  {
    title: 'برنامه‌ات را ببین',
    body: 'در «برنامه» روزهای تمرین و هدف هر حرکت (ست، تکرار، RIR) آمده است. اگر هنوز برنامه نداری، از مربی درخواست بده یا از کتابخانه شروع کن.',
    href: '/plan',
    cta: 'برنامه من',
  },
  {
    title: 'تمرین را اجرا کن',
    body: 'در «تمرین» جلسه بعدی را شروع می‌کنی. هر ست را که ثبت کنی تایمر استراحت خودش شروع می‌شود و وزنه پیشنهادی از تاریخچه خودت می‌آید.',
    href: '/workout',
    cta: 'شروع تمرین',
  },
  {
    title: 'حرکت‌های درست را پیدا کن',
    body: 'کتابخانه حرکات را با فیلتر عضله، تجهیزات و سطح بگرد؛ آموزش تصویری هر حرکت همان‌جاست.',
    href: '/library',
    cta: 'کتابخانه',
  },
  {
    title: 'پیشرفتت را اندازه بگیر',
    body: 'وزن، دورها و خواب را ثبت کن؛ بعد نقشه عضلات، آمار و تعادل ساختاری همین عددها را نشان می‌دهند.',
    href: '/measurements',
    cta: 'اندازه‌گیری',
  },
]

const COACH_TOUR: TourStep[] = [
  {
    title: 'به پنل مربی خوش آمدی',
    body: 'اینجا برنامه می‌سازی، به شاگردها اختصاص می‌دهی و پیشرفتشان را می‌بینی. همه‌چیز داخل همین باشگاه می‌ماند.',
  },
  {
    title: 'کتابخانه حرکات',
    body: 'قبل از ساخت برنامه، حرکات را ببین: عضله هدف، تجهیزات و آموزش هر حرکت ثبت شده است.',
    href: '/exercises',
    cta: 'حرکات',
  },
  {
    title: 'یک برنامه بساز',
    body: 'روزها، حرکات و هدف ست/تکرار را مشخص کن. هر ویرایش نسخه تازه‌ای می‌سازد و به برنامه‌های در حال اجرا دست نمی‌زند.',
    href: '/plans',
    cta: 'برنامه‌ها',
  },
  {
    title: 'به شاگرد اختصاص بده',
    body: 'از صفحه برنامه، اعضای باشگاه را انتخاب و تاریخ شروع را تعیین کن؛ برنامه در همان لحظه در اپ شاگرد ظاهر می‌شود.',
    href: '/assignments',
    cta: 'اختصاص‌ها',
  },
  {
    title: 'پیشرفت را بررسی کن',
    body: 'در تحلیل هر عضو، حجم تمرین، نقشه عضلات و روند اندازه‌گیری‌ها را ببین؛ همان داده‌ها مبنای برنامه بعدی است.',
    href: '/members/analysis',
    cta: 'تحلیل اعضا',
  },
]

const ADMIN_TOUR: TourStep[] = [
  {
    title: 'به پنل مدیریت خوش آمدی',
    body: 'اینجا کاربران، نقش‌ها و داده‌های باشگاه را مدیریت می‌کنی. اعضای جدید از همین‌جا اضافه می‌شوند.',
  },
  {
    title: 'کاربران و نقش‌ها',
    body: 'هر کاربر می‌تواند Admin، مربی یا عضو باشد. نقش تعیین می‌کند چه صفحه‌هایی ببیند.',
    href: '/users',
    cta: 'کاربران',
  },
  {
    title: 'برنامه و اختصاص',
    body: 'برنامه‌ها را مربیان می‌سازند؛ تو می‌توانی همه برنامه‌ها و اختصاص‌های باشگاه را ببینی.',
    href: '/plans',
    cta: 'برنامه‌ها',
  },
  {
    title: 'آمار باشگاه',
    body: 'جلسات، حجم تمرین و کارکرد عضلات اعضا در یک نگاه؛ برای گزارش و تصمیم‌گیری.',
    href: '/progress',
    cta: 'آمار',
  },
]

export const TOUR_BY_ROLE: Record<OnboardingRole, TourStep[]> = {
  Trainee: MEMBER_TOUR,
  Trainer: COACH_TOUR,
  Admin: ADMIN_TOUR,
}

/** Labels of the derived checklist keys the API returns. */
export const CHECKLIST_LABEL: Record<string, { title: string; href: string }> = {
  'first-measurement': { title: 'اولین اندازه‌گیری را ثبت کن', href: '/measurements' },
  'first-session': { title: 'اولین تمرین را کامل کن', href: '/workout' },
  equipment: { title: 'تجهیزاتت را انتخاب کن', href: '/settings/equipment' },
  plan: { title: 'یک برنامه فعال داشته باش', href: '/plan' },
  'create-plan': { title: 'اولین برنامه را بساز', href: '/plans' },
  'assign-plan': { title: 'برنامه را به یک عضو اختصاص بده', href: '/assignments' },
}
