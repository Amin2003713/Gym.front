'use client'

import { PanelRows, ToggleRow } from '../panel-parts'

import type { PanelProps } from './types'

/**
 * Alert switches, including the gamification opt-out. Turning the master switch off disables the
 * dependent channels but keeps their values, so re-enabling restores the previous choice.
 */
export function AlertsPanel({ draft, update }: PanelProps) {
  const off = !draft.notificationsEnabled

  return (
    <PanelRows>
      <ToggleRow
        title="اعلان‌های درون‌برنامه"
        description="زنگ اعلان‌ها و پیام‌های کوتاه (مانند یادآور استراحت یا رکورد جدید)."
        checked={draft.notificationsEnabled}
        onChange={(notificationsEnabled) => update({ notificationsEnabled })}
      />

      <ToggleRow
        title="اعلان مرورگر"
        description="اعلان روی دسکتاپ یا گوشی؛ نیاز به اجازه مرورگر دارد."
        checked={draft.pushEnabled}
        disabled={off}
        onChange={(pushEnabled) => update({ pushEnabled })}
      />

      <ToggleRow
        title="پیام مربی"
        description="وقتی مربی برنامه را عوض می‌کند یا جواب می‌دهد خبر بده."
        checked={draft.coachMessagesEnabled}
        disabled={off}
        onChange={(coachMessagesEnabled) => update({ coachMessagesEnabled })}
      />

      <ToggleRow
        title="جمع‌بندی هفتگی"
        description="خلاصه جلسات، حجم و پیشرفت هفته."
        checked={draft.weeklySummaryEnabled}
        disabled={off}
        onChange={(weeklySummaryEnabled) => update({ weeklySummaryEnabled })}
      />

      <ToggleRow
        title="یادآور زنجیره تمرین"
        description="اگر امروز هنوز تمرینی ثبت نشده باشد یادت بیندازد."
        checked={draft.streakReminderEnabled}
        disabled={off}
        onChange={(streakReminderEnabled) => update({ streakReminderEnabled })}
      />

      <ToggleRow
        title="گیمیفیکیشن"
        description="امتیاز، نشان و تریگرهای تشویقی. با خاموش‌کردن، این بخش‌ها کاملاً پنهان می‌شوند."
        checked={draft.gamificationEnabled}
        onChange={(gamificationEnabled) => update({ gamificationEnabled })}
      />
    </PanelRows>
  )
}
