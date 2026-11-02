/** The settings destinations, in the order the hub and the section nav show them. */
export type SettingsSection = {
  key: string
  href: string
  label: string
  hint: string
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: 'units',
    href: '/settings/units',
    label: 'واحدها',
    hint: 'کیلوگرم یا پوند، و پله‌های وزنه',
  },
  {
    key: 'workout',
    href: '/settings/workout',
    label: 'تمرین',
    hint: 'استراحت پیش‌فرض، تایمر و نمایش RIR',
  },
  {
    key: 'plan',
    href: '/settings/plan',
    label: 'برنامه',
    hint: 'شروع هفته و رفتن خودکار به روز بعد',
  },
  {
    key: 'alerts',
    href: '/settings/alerts',
    label: 'اعلان‌ها',
    hint: 'یادآورها، پیام مربی و خاموش‌کردن گیمیفیکیشن',
  },
  {
    key: 'equipment',
    href: '/settings/equipment',
    label: 'تجهیزات',
    hint: 'با چه وسایلی تمرین می‌کنی',
  },
  {
    key: 'look',
    href: '/settings/look',
    label: 'ظاهر',
    hint: 'پوسته، چیدمان و نقشه عضلات',
  },
  {
    key: 'passkeys',
    href: '/settings/passkeys',
    label: 'کلیدهای عبور',
    hint: 'ورود با اثر انگشت یا چهره',
  },
  {
    key: 'advanced',
    href: '/settings/advanced',
    label: 'پیشرفته',
    hint: 'نمای خام تنظیمات و بازگردانی',
  },
  {
    key: 'data',
    href: '/settings/data',
    label: 'داده‌های من',
    hint: 'دریافت داده‌های تمرین و اندازه‌گیری',
  },
  {
    key: 'about',
    href: '/settings/about',
    label: 'درباره',
    hint: 'درباره هم‌اوج',
  },
]

export const findSettingsSection = (key: string) =>
  SETTINGS_SECTIONS.find((section) => section.key === key)
