'use client'

import UserManager from '@/app/(tenant)/(console)/users/_components/user-manager'
import { Protected } from '@/components/auth/protected'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiUserRole } from '@/features/users/api/users-api'

import { CoachMemberReport } from '../trainers/overview/_components/coach-member-report'

/**
 * Members screen. The trainer report is the first tab so a coach lands on the same progress view
 * the dashboard shows (stats, body maps, per-muscle detail), while account management keeps its own
 * tab instead of being the only thing the page offers.
 */
export default function MembersPage() {
  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <Tabs defaultValue="report" className="space-y-4">
        <TabsList>
          <TabsTrigger value="report">گزارش مربی</TabsTrigger>
          <TabsTrigger value="accounts">حساب‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <CoachMemberReport />
        </TabsContent>

        <TabsContent value="accounts">
          <UserManager
            title="اعضای باشگاه"
            description="مدیریت شاگردان گروه، وضعیت عضویت و حساب‌هایشان"
            role={ApiUserRole.Trainee}
          />
        </TabsContent>
      </Tabs>
    </Protected>
  )
}
