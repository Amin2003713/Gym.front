import type { ExerciseDetail, ExerciseListItem } from './exercise.types'

/**
 * Ownership gate for the exercise library.
 *
 * Product rule: tenants may add their own exercises and modify/delete only
 * those. Shared catalog exercises (imported from the global exercise database)
 * are read-only for everyone.
 *
 * The list endpoint returns no owner marker, so ownership is resolved from the
 * exercise detail: catalog exercises always carry a `sourceId` that points at
 * their imported source record, while tenant-created ones have no source id
 * (empty string or the numeric placeholder '0'). The server remains the final
 * authority — if our guess is wrong it answers 403 and the UI shows the error.
 */
export function isUserOwnedExercise(
  exercise: Pick<ExerciseDetail, 'sourceId'>,
): boolean {
  const sourceId = (exercise.sourceId ?? '').trim()
  return sourceId === '' || sourceId === '0'
}

/** Localized notice shown when someone tries to edit a shared exercise. */
export const SHARED_EXERCISE_NOTICE =
  'این حرکت از کاتالوگ اشتراکی است و فقط قابل مشاهده است؛ ویرایش فقط برای حرکت‌های ساخته‌شده توسط گروه ممکن است.'
