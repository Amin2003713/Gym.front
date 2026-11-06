import * as React from 'react'

import {
  Activity,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  ChartNoAxesCombined,
  Dumbbell,
  LockKeyhole,
  LifeBuoy,
  MessagesSquare,
  Radio,
  Settings2,
  ShieldCheck,
  Users,
  Wallet,
} from '@/components/icons'
import { SidebarItem } from '@/components/ui/sidebar'
import { ApiUserRole } from '@/features/users/api/users-api'

/**
 * Menu access is declared here, once. A child without its own `role` inherits the parent's set,
 * so a new link inside "مدیریت گروه" is automatically staff-only.
 *
 * Admin  : everything.
 * Trainer: coaching work — members, plans, assignments, workout runner, progress, support desk.
 * Trainee: never sees the console (the console layout redirects them to /home).
 */
const STAFF_ROLES: ApiUserRole[] = [ApiUserRole.Admin, ApiUserRole.Trainer]
const ADMIN_ROLES: ApiUserRole[] = [ApiUserRole.Admin]

const SIDEBAR_OPTIONS: { tree: SidebarItem[] } = {
  tree: [
    {
      name: 'داشبورد باشگاه',
      path: '/',
      icon: <Activity className="size-4" />,
      colorClass: 'text-primary',
      role: STAFF_ROLES,
    },
    {
      name: 'تمرین',
      icon: <Dumbbell className="size-4" />,
      colorClass: 'text-primary',
      role: STAFF_ROLES,
      children: [
        { name: 'کتابخانه حرکات', path: '/exercises', icon: <Dumbbell className="size-4" />, colorClass: 'text-primary' },
      ],
    },
    {
      // Coach work in one place: plan it, assign it, follow the member up. Staff-only, and the
      // routes themselves sit behind Protected(Admin|Trainer) as well.
      name: 'مربیگری',
      icon: <ClipboardList className="size-4" />,
      colorClass: 'text-primary',
      role: STAFF_ROLES,
      children: [
        { name: 'برنامه‌ریزی تمرین', path: '/plans', icon: <BookOpen className="size-4" />, colorClass: 'text-primary' },
        { name: 'تخصیص برنامه', path: '/assignments', icon: <CalendarCheck className="size-4" />, colorClass: 'text-primary' },
        { name: 'پیگیری پیشرفت شاگرد', path: '/trainers/overview', icon: <ChartNoAxesCombined className="size-4" />, colorClass: 'text-[#788584]' },
      ],
    },
    {
      // Classes live on their own: hosting a live class is a different job from planning a
      // member's program, and it needs its own entry on small screens.
      name: 'کلاس‌های آنلاین',
      icon: <Radio className="size-4" />,
      colorClass: 'text-primary',
      role: STAFF_ROLES,
      children: [
        { name: 'میزبانی کلاس زنده', path: '/console/live-console', icon: <Radio className="size-4" />, colorClass: 'text-primary' },
        { name: 'ورود به کلاس', path: '/live', icon: <Users className="size-4" />, colorClass: 'text-[#788584]' },
      ],
    },
    {
      name: 'مدیریت گروه',
      icon: <Users className="size-4" />,
      colorClass: 'text-[#788584]',
      role: STAFF_ROLES,
      children: [
        { name: 'صف مربی', path: '/console/coach', icon: <MessagesSquare className="size-4" />, colorClass: 'text-[#788584]' },
        { name: 'اعضای باشگاه', path: '/members', icon: <Users className="size-4" />, colorClass: 'text-[#788584]' },
        { name: 'مربی‌ها و شاگردها', path: '/trainers', icon: <ShieldCheck className="size-4" />, colorClass: 'text-[#788584]' },
        { name: 'مرکز پشتیبانی', path: '/support-desk', icon: <LifeBuoy className="size-4" />, colorClass: 'text-[#788584]' },
        // Account/role administration stays with the gym owner.
        { name: 'مدیریت کاربران', path: '/users', icon: <ShieldCheck className="size-4" />, colorClass: 'text-[#788584]', role: ADMIN_ROLES },
      ],
    },
    {
      name: 'کسب‌وکار باشگاه',
      icon: <Wallet className="size-4" />,
      colorClass: 'text-[#788584]',
      role: ADMIN_ROLES,
      children: [
        { name: 'مالی و اشتراک', path: '/billing', icon: <Wallet className="size-4" />, colorClass: 'text-[#788584]' },
        { name: 'کمدهای هوشمند', path: '/lockers', icon: <LockKeyhole className="size-4" />, colorClass: 'text-[#788584]' },
      ],
    },
    {
      name: 'تنظیمات باشگاه',
      path: '/console/settings',
      icon: <Settings2 className="size-4" />,
      colorClass: 'text-muted-foreground',
      role: ADMIN_ROLES,
    },
  ],
}

export { ADMIN_ROLES, SIDEBAR_OPTIONS, STAFF_ROLES }
