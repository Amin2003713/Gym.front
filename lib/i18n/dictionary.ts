/**
 * Flat, typed UI dictionary. Persian is the product language; English exists so every key has a
 * fallback and so a future locale switch has something to switch to. Data-level bilingual fields
 * (exercise names, instructions) go through `getLocalized` instead — see `./index.ts`.
 */

export type AppLocale = 'fa' | 'en'

const fa = {
  'common.cancel': 'انصراف',
  'common.confirm': 'تأیید',
  'common.close': 'بستن',
  'common.delete': 'حذف',
  'common.save': 'ذخیره',
  'common.retry': 'تلاش دوباره',

  'dialog.confirmDescription': 'برای ادامه تأیید کن.',

  'media.loading': 'در حال بارگذاری رسانه…',
  'media.unavailable': 'رسانه‌ای برای این حرکت ثبت نشده است',
  'media.error': 'بارگذاری رسانه ناموفق بود',

  'bodyMap.legendAria': 'شدت بار عضلانی از کمتر به بیشتر',
  'bodyMap.primary': 'عضله اصلی',
  'bodyMap.secondary': 'عضله کمکی',

  'workout.abandon.title': 'جلسه تمرین رها شود؟',
  'workout.abandon.body':
    'پیشرفت برنامه ثبت نمی‌شود. ست‌هایی که تا حالا زده‌ای در تاریخچه حرکات می‌مانند.',
  'workout.abandon.confirm': 'رها کردن جلسه',
  'workout.removeExtra.title': 'این حرکت اضافی حذف شود؟',
  'workout.removeExtra.body': 'فقط حرکت‌های اضافیِ بدون ست حذف می‌شوند.',
  'workout.removeExtra.confirm': 'حذف حرکت',
  'workout.deleteSet.title': 'ست حذف شود؟',
  'workout.deleteSet.body': 'ست {number} از {exercise} حذف می‌شود. این کار قابل بازگشت نیست.',
  'workout.deleteSet.confirm': 'حذف ست',
  'workout.editSet.title': 'ویرایش ست {number}',
  'workout.editSet.body': 'تکرار و وزنه را اصلاح کن؛ بقیه ست‌ها دست نمی‌خورند.',
  'workout.editSet.reps': 'تکرار',
  'workout.editSet.weight': 'وزنه (کیلوگرم)',
  'workout.editSet.confirm': 'ذخیره ست',
} as const

export type TranslationKey = keyof typeof fa

const en: Record<TranslationKey, string> = {
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.close': 'Close',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'common.retry': 'Try again',

  'dialog.confirmDescription': 'Confirm to continue.',

  'media.loading': 'Loading media…',
  'media.unavailable': 'No media has been saved for this exercise',
  'media.error': 'Could not load the media',

  'bodyMap.legendAria': 'Muscle load from least to most',
  'bodyMap.primary': 'Primary muscle',
  'bodyMap.secondary': 'Supporting muscle',

  'workout.abandon.title': 'Abandon this workout?',
  'workout.abandon.body':
    'Plan progress will not be recorded. Sets you already logged stay in exercise history.',
  'workout.abandon.confirm': 'Abandon workout',
  'workout.removeExtra.title': 'Remove this extra exercise?',
  'workout.removeExtra.body': 'Only extra exercises without logged sets can be removed.',
  'workout.removeExtra.confirm': 'Remove exercise',
  'workout.deleteSet.title': 'Delete this set?',
  'workout.deleteSet.body': 'Set {number} of {exercise} will be deleted. This cannot be undone.',
  'workout.deleteSet.confirm': 'Delete set',
  'workout.editSet.title': 'Edit set {number}',
  'workout.editSet.body': 'Correct the reps and the weight; the other sets stay as they are.',
  'workout.editSet.reps': 'Reps',
  'workout.editSet.weight': 'Weight (kg)',
  'workout.editSet.confirm': 'Save set',
}

export const dictionary: Record<AppLocale, Record<TranslationKey, string>> = { fa, en }

export const defaultLocale: AppLocale = 'fa'

export const isAppLocale = (value: unknown): value is AppLocale =>
  value === 'fa' || value === 'en'
