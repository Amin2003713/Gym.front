import { Protected } from '@/components/auth/protected'

import { ProgressPhotos } from './_components/progress-photos'

export const metadata = { title: 'عکس پیشرفت' }

export default function Page() {
  return (
    <Protected>
      <ProgressPhotos />
    </Protected>
  )
}
