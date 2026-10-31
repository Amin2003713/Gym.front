import type { PlanGoal, PlanLevel } from './plan.types'

/** One label map for every plans screen, keyed by the API enum values. */
export const GOAL_LABELS: Record<PlanGoal, { fa: string; en: string }> = {
  GetStronger: { fa: 'افزایش قدرت', en: 'Strength' },
  BuildMuscle: { fa: 'عضله‌سازی', en: 'Muscle gain' },
  LoseWeight: { fa: 'کاهش وزن', en: 'Weight loss' },
  Endurance: { fa: 'استقامت', en: 'Endurance' },
  Fitness: { fa: 'تناسب اندام', en: 'Fitness' },
  Mobility: { fa: 'تحرک', en: 'Mobility' },
}

export const LEVEL_LABELS: Record<PlanLevel, { fa: string; en: string }> = {
  Beginner: { fa: 'مبتدی', en: 'Beginner' },
  Intermediate: { fa: 'متوسط', en: 'Intermediate' },
  Advanced: { fa: 'پیشرفته', en: 'Advanced' },
}

export const planGoalText = (value: PlanGoal, locale: 'fa' | 'en') =>
  GOAL_LABELS[value]?.[locale] ?? value

export const planLevelText = (value: PlanLevel, locale: 'fa' | 'en') =>
  LEVEL_LABELS[value]?.[locale] ?? value
