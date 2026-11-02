/** The regions the 3D figure is built from; each mesh belongs to exactly one. */
export type BodyRegion =
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'abs'
  | 'obliques'
  | 'back'
  | 'lowerBack'
  | 'glutes'
  | 'armsL'
  | 'armsR'
  | 'forearmL'
  | 'forearmR'
  | 'thighL'
  | 'thighR'
  | 'calfL'
  | 'calfR'

export const BODY_REGIONS: BodyRegion[] = [
  'neck',
  'shoulders',
  'chest',
  'abs',
  'obliques',
  'back',
  'lowerBack',
  'glutes',
  'armsL',
  'armsR',
  'forearmL',
  'forearmR',
  'thighL',
  'thighR',
  'calfL',
  'calfR',
]

export const REGION_LABEL: Record<BodyRegion, string> = {
  neck: 'گردن و ذوزنقه',
  shoulders: 'سرشانه',
  chest: 'سینه',
  abs: 'شکم',
  obliques: 'مورب‌ها',
  back: 'پشت',
  lowerBack: 'کمر',
  glutes: 'باسن',
  armsL: 'بازوی چپ',
  armsR: 'بازوی راست',
  forearmL: 'ساعد چپ',
  forearmR: 'ساعد راست',
  thighL: 'ران چپ',
  thighR: 'ران راست',
  calfL: 'ساق چپ',
  calfR: 'ساق راست',
}

/** One muscle can shade several regions (biceps and triceps share an arm). */
export const MUSCLE_REGION: Record<string, BodyRegion[]> = {
  trapezius: ['neck'],
  deltoids: ['shoulders'],
  chest: ['chest'],
  'upper-back': ['back'],
  serratus: ['obliques'],
  biceps: ['armsL', 'armsR'],
  triceps: ['armsL', 'armsR'],
  forearm: ['forearmL', 'forearmR'],
  abs: ['abs'],
  obliques: ['obliques'],
  'lower-back': ['lowerBack'],
  gluteal: ['glutes'],
  quadriceps: ['thighL', 'thighR'],
  hamstring: ['thighL', 'thighR'],
  adductors: ['thighL', 'thighR'],
  'hip-flexors': ['thighL', 'thighR'],
  calves: ['calfL', 'calfR'],
  tibialis: ['calfL', 'calfR'],
}

/** Measurement fields that have a place on the figure. */
export const MEASUREMENT_REGION: Record<string, BodyRegion> = {
  neckCm: 'neck',
  shoulderCm: 'shoulders',
  chestCm: 'chest',
  waistCm: 'abs',
  hipsCm: 'glutes',
  armLeftCm: 'armsL',
  armRightCm: 'armsR',
  forearmLeftCm: 'forearmL',
  forearmRightCm: 'forearmR',
  thighLeftCm: 'thighL',
  thighRightCm: 'thighR',
  calfLeftCm: 'calfL',
  calfRightCm: 'calfR',
}
