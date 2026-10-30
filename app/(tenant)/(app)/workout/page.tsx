import { Suspense } from 'react'

import { MemberWorkout } from './_components/member-workout'

export const metadata = { title: 'تمرین | هم‌اوج' }

export default function MemberWorkoutPage() {
  return (
    <Suspense fallback={null}>
      <MemberWorkout />
    </Suspense>
  )
}
