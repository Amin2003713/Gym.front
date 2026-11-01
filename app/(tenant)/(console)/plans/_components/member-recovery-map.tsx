'use client'

import { useEffect, useMemo, useState } from 'react'

import { getMemberProgress } from '@/app/(tenant)/_api/member-progress-api'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'

/**
 * The assigned member's recovery map, next to the targeted-muscles map. Days since each muscle was
 * last trained come from the server report; the map shades 0 (just trained) to 4 (rested).
 */
export function MemberRecoveryMap({ memberId }: { memberId: string }) {
  const [days, setDays] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    let alive = true

    getMemberProgress(memberId)
      .then((report) => {
        if (!alive) return
        setDays(
          Object.fromEntries(
            report.muscles.map((muscle) => [
              muscle.muscleCode,
              muscle.daysSinceTrained == null ? 4 : Math.min(muscle.daysSinceTrained, 4),
            ]),
          ),
        )
      })
      .catch(() => {
        if (alive) setDays(null)
      })

    return () => {
      alive = false
    }
  }, [memberId])

  const load = useMemo(() => days ?? {}, [days])

  if (!days) return null

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">ریکاوری شاگرد</h4>
        <span className="text-muted-foreground text-xs">از تاریخچه واقعی تمرین</span>
      </div>
      <BodyMapPanel body="male" palette="recovery" load={load} />
      <p className="text-muted-foreground mt-2 text-xs leading-5">
        قرمز: تازه تمرین شده و ریکاوری کامل نشده؛ سبز: آماده تمرین. برنامه را حول همین
        وضعیت بچینید.
      </p>
    </div>
  )
}
