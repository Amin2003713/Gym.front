import { MemberAnalysisPage } from './_components/member-analysis-page'
import { Protected } from '@/components/auth/protected'
import { ApiUserRole } from '@/features/users/api/users-api'

export const metadata = { title: 'تحلیل شاگردها' }

export default function MemberAnalysisRoute() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <MemberAnalysisPage />
    </Protected>
  )
}
