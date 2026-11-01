import { PlanGoal, PlanLevel } from './plan.types'

/** One label map for every plans screen, keyed by the API enum values. */
export const GOAL_LABELS: Record<PlanGoal, { fa: string; en: string }> = {
  [PlanGoal.GetStronger]: { fa: 'افزایش قدرت', en: 'Strength' },
  [PlanGoal.BuildMuscle]: { fa: 'عضله‌سازی', en: 'Muscle gain' },
  [PlanGoal.LoseWeight]: { fa: 'کاهش وزن', en: 'Weight loss' },
  [PlanGoal.Endurance]: { fa: 'استقامت', en: 'Endurance' },
  [PlanGoal.Fitness]: { fa: 'تناسب اندام', en: 'Fitness' },
  [PlanGoal.Mobility]: { fa: 'تحرک', en: 'Mobility' },
}

export const LEVEL_LABELS: Record<PlanLevel, { fa: string; en: string }> = {
  [PlanLevel.Beginner]: { fa: 'مبتدی', en: 'Beginner' },
  [PlanLevel.Intermediate]: { fa: 'متوسط', en: 'Intermediate' },
  [PlanLevel.Advanced]: { fa: 'پیشرفته', en: 'Advanced' },
}

export const planGoalText = (value: PlanGoal, locale: 'fa' | 'en') =>
  GOAL_LABELS[value]?.[locale] ?? String(value)

export const planLevelText = (value: PlanLevel, locale: 'fa' | 'en') =>
  LEVEL_LABELS[value]?.[locale] ?? String(value)
