/** Contracts and copy of /training/gamification (derived from real history, nothing stored twice). */

export interface GamificationBadge {
  code: string
  earned: boolean
  earnedOn: string | null
}

export interface GamificationData {
  totalXp: number
  level: number
  xpInLevel: number
  xpForNextLevel: number
  currentStreakDays: number
  longestStreakDays: number
  sessionsCompleted: number
  totalSets: number
  totalVolumeKg: number
  badges: GamificationBadge[]
}

export const BADGE_COPY: Record<string, { title: string; hint: string }> = {
  'first-session': { title: 'اولین قدم', hint: 'اولین جلسه تمرین را کامل کن' },
  'sessions-10': { title: 'ده جلسه', hint: '۱۰ جلسه تمرین کامل' },
  'sessions-25': { title: 'پیگیر', hint: '۲۵ جلسه تمرین کامل' },
  'streak-7': { title: 'هفت روز پیوسته', hint: '۷ روز پشت‌سرهم تمرین' },
  'measure-5': { title: 'خط‌کش', hint: '۵ اندازه‌گیری ثبت کن' },
  'volume-10t': { title: 'ده تن', hint: 'مجموع ۱۰٬۰۰۰ کیلوگرم حجم تمرین' },
}

const LEVEL_TITLES = ['شروع', 'آمادگی', 'پیوستگی', 'قدرت', 'پیشرفته', 'استاد'] as const

export const levelTitle = (level: number) =>
  LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.max(0, level - 1))]
