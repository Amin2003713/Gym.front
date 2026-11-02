import ExerciseLibrary from '@/app/(tenant)/(console)/exercises/_components/exercise-library'

export const metadata = { title: 'کتابخانه حرکات | هم‌اوج' }

/**
 * The trainer's library is the staff library, read-only: the same filters, search, media gallery,
 * muscle chips and detail dialog, with create/edit/delete absent for a trainee (and rejected by
 * the API regardless of what the browser shows).
 */
export default function MemberLibraryPage() {
  return <ExerciseLibrary />
}
