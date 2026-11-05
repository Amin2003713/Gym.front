'use client'

import { useEffect, useMemo, useState } from 'react'

import { getMemberProgress } from '@/app/(tenant)/_api/member-progress-api'
import BodyMapPanel from '@/app/(tenant)/_components/progress/body-map-panel'
import { useFigureGender } from '@/hooks/use-figure-gender'
import { muscleSlug } from '@/lib/muscle-mapping'

/**
 * The assigned member's recovery map, next to the targeted-muscles map. Days since each muscle was
 * last trained come from the server report; the map shades 0 (just trained) to 4 (rested).
 *
 * The report's codes are the catalog's muscle names (lats, quads, glutes…), not the body map's
 * slugs, so they are normalized here — otherwise every limb stayed at level 0 and the whole
 * figure painted urgent red.
 */
export function MemberRecoveryMap({ memberId }: { memberId: string }) {
  const [days, setDays] = useState<Record<string, number> | null>(null)
  const [failed, setFailed] = useState(false)
  const figureGender = useFigureGender(memberId)

  useEffect(() => {
    let alive = true

    setDays(null)
    setFailed(false)

    getMemberProgress(memberId)
      .then((report) => {
        if (!alive) return

        const entries = report.muscles.flatMap((muscle) => {
          const slug = muscleSlug(muscle.muscleCode)
          if (!slug) return []
          const rested = muscle.daysSinceTrained == null ? 4 : muscle.daysSinceTrained
          return [[slug, Math.max(0, Math.min(4, rested))] as const]
        })

        setDays(Object.fromEntries(entries))
      })
      .catch(() => {
        if (alive) setFailed(true)
      })

    return () => {
      alive = false
    }
  }, [memberId])

  const load = useMemo(() => days ?? {}, [days])

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">ریکاوری شاگرد</h4>
        <span className="text-muted-foreground text-xs">از تاریخچه واقعی تمرین</span>
      </div>

      {days ? (
        <>
          <BodyMapPanel body={figureGender} palette="recovery" load={load} />
          <p className="text-muted-foreground mt-2 text-xs leading-5">
            قرمز: تازه تمرین شده و ریکاوری کامل نشده؛ آبی: آماده تمرین. برنامه را حول همین
            وضعیت بچینید.
          </p>
        </>
      ) : (
        <p className="text-muted-foreground py-6 text-center text-xs leading-6">
          {failed
            ? 'تاریخچه تمرین این عضو در دسترس نیست؛ نقشه ریکاوری پس از ثبت جلسه یا با دسترسی مربی ساخته می‌شود.'
            : 'در حال ساخت نقشه ریکاوری از تاریخچه تمرین…'}
        </p>
      )}
    </div>
  )
}
