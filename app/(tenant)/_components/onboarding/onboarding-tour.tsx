'use client'

import { HelpCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Shepherd from 'shepherd.js'

import { Button } from '@/components/ui/button'
import { useUserRoles } from '@/hooks/use-user-roles'

import 'shepherd.js/dist/css/shepherd.css'

type TourStep = {
  id: string
  title: string
  text: string
  selector?: string
}

const ROLE_STEPS: Record<'member' | 'coach' | 'console', TourStep[]> = {
  member: [
    { id: 'home', title: 'صفحه اصلی', text: 'نمای کلی فعالیت‌ها و مسیر پیشرفت شما از این بخش در دسترس است.', selector: '[data-slot="member-shell"]' },
    { id: 'workouts', title: 'تمرین‌ها', text: 'جلسه تمرینی فعال را اجرا کنید، ست‌ها را ثبت کنید و سوابق خود را ببینید.', selector: 'a[href="/workout"], a[href="/workouts"]' },
    { id: 'plans', title: 'برنامه‌ها', text: 'برنامه‌های اختصاص‌یافته و برنامه‌های قابل ثبت‌نام را بررسی کنید.', selector: 'a[href="/plan"], a[href="/plans"]' },
    { id: 'profile', title: 'پروفایل', text: 'اطلاعات شخصی و تصویر حساب خود را مدیریت کنید.', selector: 'a[href="/profile"]' },
  ],
  coach: [
    { id: 'home', title: 'نمای مربی', text: 'از این بخش به ابزارهای روزانه مربی دسترسی دارید.', selector: '[data-slot="coach-shell"]' },
    { id: 'members', title: 'شاگردها', text: 'اعضا و وضعیت پیشرفت آن‌ها را بررسی کنید.', selector: 'a[href="/members"]' },
    { id: 'plans', title: 'برنامه‌ها', text: 'برنامه‌های تمرینی را ایجاد و مدیریت کنید.', selector: 'a[href="/plans"]' },
    { id: 'assignments', title: 'تخصیص‌ها', text: 'برنامه‌ها را به شاگردها اختصاص دهید و وضعیت آن‌ها را پیگیری کنید.', selector: 'a[href="/assignments"]' },
  ],
  console: [
    { id: 'home', title: 'داشبورد مدیریت', text: 'نمای کلی مدیریت باشگاه و دسترسی سریع به بخش‌های اصلی.', selector: '[data-slot="console-layout"]' },
    { id: 'members', title: 'اعضا', text: 'اطلاعات اعضا و وضعیت عضویت را مدیریت کنید.', selector: 'a[href="/members"]' },
    { id: 'plans', title: 'برنامه‌ها', text: 'برنامه‌های تمرینی باشگاه را مدیریت کنید.', selector: 'a[href="/plans"]' },
    { id: 'assignments', title: 'تخصیص برنامه', text: 'برنامه مناسب را برای اعضا تخصیص دهید.', selector: 'a[href="/assignments"]' },
  ],
}

const storageKey = (role: string) => `hamowj-tour-${role}-completed`

export function OnboardingTour() {
  const { isAdmin, isTrainer } = useUserRoles()
  const role = useMemo(
    () => (isAdmin ? 'console' : isTrainer ? 'coach' : 'member') as keyof typeof ROLE_STEPS,
    [isAdmin, isTrainer],
  )
  const [ready, setReady] = useState(false)

  const startTour = () => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'hamowj-shepherd',
        scrollTo: { behavior: 'smooth', block: 'center' },
        buttons: [
          { text: 'قبلی', action() { tour.back() }, classes: 'shepherd-button-secondary' },
          { text: 'بعدی', action() { tour.next() } },
        ],
      },
    })

    const available = ROLE_STEPS[role]
      .map((step) => {
        const target = step.selector ? document.querySelector(step.selector) : null
        return {
          id: step.id,
          title: step.title,
          text: step.text,
          ...(target ? { attachTo: { element: target as HTMLElement, on: 'bottom' as const } } : {}),
          buttons: [
            { text: 'خروج', action() { tour.cancel() }, classes: 'shepherd-button-secondary' },
            { text: 'قبلی', action() { tour.back() }, classes: 'shepherd-button-secondary' },
            { text: 'بعدی', action() { tour.next() } },
          ],
        }
      })

    available.forEach((step, index) => {
      const isLast = index === available.length - 1
      tour.addStep({
        ...step,
        buttons: isLast
          ? [
              { text: 'خروج', action() { tour.cancel() }, classes: 'shepherd-button-secondary' },
              { text: 'پایان راهنما', action() { tour.complete() } },
            ]
          : step.buttons,
      })
    })
    tour.on('complete', () => localStorage.setItem(storageKey(role), '1'))
    tour.on('cancel', () => localStorage.setItem(storageKey(role), '1'))
    tour.start()
  }

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || localStorage.getItem(storageKey(role))) return
    const id = window.setTimeout(startTour, 700)
    return () => window.clearTimeout(id)
    // startTour is intentionally recreated with the current role.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, role])

  if (!ready) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed bottom-5 left-5 z-40 size-11 rounded-full bg-background shadow-lg"
      aria-label="راهنمای سریع"
      title="راهنمای سریع"
      onClick={startTour}
    >
      <HelpCircle className="size-5" />
    </Button>
  )
}
