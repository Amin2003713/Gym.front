import {
  Activity,
  BookOpen,
  CalendarCheck,
  ChartNoAxesCombined,
  Dumbbell,
  FileUp,
  GitBranch,
  History,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react'
import * as React from 'react'

import { SidebarItem } from '@/components/ui/sidebar'
import { UserRoleEnum } from '@/enums/user-role.enum'

const SIDEBAR_OPTIONS: { tree: SidebarItem[] } = {
  tree: [
    {
      name: 'داشبورد باشگاه',
      path: '/',
      icon: <Activity className="size-4" />,
      colorClass: 'text-primary',
    },
    {
      name: 'تمرین',
      icon: <Dumbbell className="size-4" />,
      colorClass: 'text-primary',
      children: [
        { name: 'کتابخانه حرکات', path: '/exercises', icon: <Dumbbell className="size-4" />, colorClass: 'text-primary' },
        { name: 'برنامه‌های تمرینی', path: '/routines', icon: <BookOpen className="size-4" />, colorClass: 'text-primary' },
        { name: 'تمرین امروز', path: '/workouts', icon: <CalendarCheck className="size-4" />, colorClass: 'text-primary' },
        { name: 'تاریخچه تمرین', path: '/history', icon: <History className="size-4" />, colorClass: 'text-primary' },
        { name: 'پیشرفت و رکوردها', path: '/progress', icon: <ChartNoAxesCombined className="size-4" />, colorClass: 'text-primary' },
        { name: 'اندازه‌گیری بدن', path: '/measurements', icon: <Activity className="size-4" />, colorClass: 'text-primary' },
        { name: 'ورود و خروجی اطلاعات', path: '/imports', icon: <FileUp className="size-4" />, colorClass: 'text-primary' },
      ],
    },
    {
      name: 'مدیریت گروه',
      icon: <Users className="size-4" />,
      colorClass: 'text-[#788584]',
      role: [UserRoleEnum.Admin],
      children: [
        { name: 'شعبه‌ها', path: '/branches', icon: <GitBranch className="size-4" />, colorClass: 'text-[#788584]' },
        { name: 'اعضای باشگاه', path: '/members', icon: <Users className="size-4" />, colorClass: 'text-[#788584]' },
        { name: 'مربی‌ها و شاگردها', path: '/trainers', icon: <ShieldCheck className="size-4" />, colorClass: 'text-[#788584]' },
      ],
    },
    {
      name: 'تنظیمات',
      path: '/settings',
      icon: <Settings2 className="size-4" />,
      colorClass: 'text-muted-foreground',
    },
  ],
}

export { SIDEBAR_OPTIONS }
