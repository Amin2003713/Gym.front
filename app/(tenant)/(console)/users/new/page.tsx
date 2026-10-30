import { Suspense } from 'react'

import UserEditor from '@/app/(tenant)/(console)/users/_components/user-editor'
import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

export default function NewUserPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <div className="p-1">
        {/* useSearchParams inside the editor needs a Suspense boundary when prerendered. */}
        <Suspense>
          <UserEditor mode="create" />
        </Suspense>
      </div>
    </Protected>
  )
}
