const GYM_ROUTES = [
  { segment: 'exercises', title: 'کتابخانه حرکات' },
  { segment: 'routines', title: 'برنامه‌های تمرینی' },
  { segment: 'workouts', title: 'تمرین امروز' },
  { segment: 'history', title: 'تاریخچه تمرین' },
  { segment: 'progress', title: 'پیشرفت و رکوردها' },
  { segment: 'measurements', title: 'اندازه‌گیری بدن' },
  { segment: 'imports', title: 'ورود و خروجی اطلاعات' },
  { segment: 'branches', title: 'شعبه‌های گروه' },
  { segment: 'members', title: 'اعضای باشگاه' },
  { segment: 'trainers', title: 'مربی‌ها و شاگردها' },
  { segment: 'settings', title: 'تنظیمات' },
]

export const itemsPageSegments = Object.fromEntries(
  GYM_ROUTES.map((item) => [item.segment, { title: item.title }]),
)
