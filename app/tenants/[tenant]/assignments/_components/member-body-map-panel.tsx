'use client'

import { useMemo, useState } from 'react'
import { useMuscleBalance } from '../../progress/_api/use-muscle-balance'
import { recoveryLevels, loadLevels } from '../../progress/_model/muscle-balance'
import BodyMapPanel from '../../progress/_components/body-map-panel'
import { MUSCLE_LABEL } from '../../progress/_components/progress-stats-page'
import { useFigureGender } from '@/hooks/use-figure-gender'

/**
 * When a plan is being assigned to a member (member id known), shows that
 * member's body maps: recovery status (blue/red) from their real workout
 * history via the workout API.
 */
export default function MemberBodyMapPanel({ memberId, memberName }: { memberId: string; memberName?: string }) {
  const { stats, loading, error } = useMuscleBalance({ memberId })
  const gender = useFigureGender(memberId)
  const [palette, setPalette] = useState<'recovery' | 'load'>('recovery')

  // Captured once so the memo stays pure; mid-session drift is irrelevant here.
  const [nowMs] = useState(() => Date.now())
  const load = useMemo(() => loadLevels(stats.perMuscle), [stats])
  const recovery = useMemo(() => recoveryLevels(stats.perMuscle, nowMs), [stats, nowMs])

  const urgent = useMemo(
    () =>
      stats.perMuscle
        ? Object.entries(recovery.pcts)
            .filter(([, info]) => info.pct < 30 && info.sinceHours !== undefined)
            .map(([slug]) => MUSCLE_LABEL[slug] ?? slug)
        : [],
    [stats, recovery],
  )

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">
            نقشه بدن {memberName ? `· ${memberName}` : 'عضو انتخاب‌شده'}
          </h4>
          <p className="text-muted-foreground mt-1 text-xs">
            {loading
              ? 'در حال دریافت تاریخچه تمرین عضو…'
              : error
                ? 'تاریخچه عضو در دسترس نیست (ممکن است/backend دسترسی مربی را محدود کرده باشد).'
                : palette === 'recovery'
                  ? 'قرمز: به‌تازگی تمرین شده و ریکاوری کامل نیست · آبی روشن: آماده تمرین'
                  : 'سبزتر = در این بازه بیشتر تمرین شده'}
          </p>
        </div>
        <div className="flex gap-1.5">
          {(['recovery', 'load'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPalette(key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${palette === key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              {key === 'recovery' ? 'ریکاوری' : 'کارکرد'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground flex min-h-48 items-center justify-center text-sm">
          در حال ساخت نقشه از جلسات واقعی عضو…
        </div>
      ) : error ? (
        <p className="text-muted-foreground rounded-lg bg-amber-500/10 p-3 text-xs leading-5">
          نقشه عضو از داده نمایشی ساخته نمی‌شود؛ پس از تأیید دسترسی مربی به تاریخچه اعضا، این پانل فعال می‌شود.
        </p>
      ) : (
        <>
          <BodyMapPanel
            body={gender}
            palette={palette}
            load={palette === 'recovery' ? recovery.levels : load}
          />
          {palette === 'recovery' && urgent.length > 0 && (
            <p className="mt-2 text-xs leading-6">
              <span className="font-semibold text-foreground">ریکروری ناتمام:</span>{' '}
              <span className="text-muted-foreground">{urgent.join('، ')}</span> — در روزهای ابتدایی برنامه برای این
              نواحی حجم کمتری در نظر بگیرید.
            </p>
          )}
        </>
      )}
    </div>
  )
}
