'use client'

import { useState } from 'react'

import UserManager from '@/app/(tenant)/(console)/users/_components/user-manager'
import { TrainerAssignmentForm } from '@/app/(tenant)/(console)/trainers/_components/trainer-assignments'
import { Protected } from '@/components/auth/protected'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiUserRole } from '@/features/users/api/users-api'

export default function TrainersPage() {
  const [memberId, setMemberId] = useState('')

  return (
    <Protected requiredRoles={[ApiUserRole.Admin, ApiUserRole.Trainer]}>
      <div className="space-y-6">
        <UserManager
          title="مربی‌ها و شاگردها"
          description="مدیریت مربی‌های گروه و ایجاد حساب برای آن‌ها"
          role={ApiUserRole.Trainer}
        />

        <Card>
          <CardHeader>
            <CardTitle>انتساب مربی به شاگرد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="شناسه شاگرد را وارد کنید…"
              dir="ltr"
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
            />
            {memberId.trim().length > 0 && (
              <TrainerAssignmentForm memberId={memberId.trim()} />
            )}
          </CardContent>
        </Card>
      </div>
    </Protected>
  )
}
