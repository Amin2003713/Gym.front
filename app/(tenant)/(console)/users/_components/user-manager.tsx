'use client'

import {
  BadgeCheck,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldBan,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { USER_ROLES, normalizeApiUserRole } from '@/constants/user-role'
import { ApiUserRole } from '@/features/users/api/users-api'
import { toast } from '@/lib/toast'

import {
  listUsers,
  disableUser,
  deleteUser,
  forcePasswordReset,
} from '../_api/user-api'
import type { ApiUser } from '../_model/user.types'

const ROLE_OPTIONS: { value: ApiUserRole; label: string }[] = (
  [ApiUserRole.Admin, ApiUserRole.Trainer, ApiUserRole.Trainee] as const
).map((value) => ({ value, label: USER_ROLES[value] }))

/**
 * Shared users manager used by /users and the role-filtered pages
 * /members (Trainee) and /trainers (Trainer).
 */
export interface UserManagerProps {
  /** When set, the list shows only users holding this API role name. */
  role?: ApiUserRole
  title: string
  description: string
}

export default function UserManager({ role, title, description }: UserManagerProps) {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const result = await listUsers()
      return Array.isArray(result) ? result : []
    } catch (error) {
      toast.error('دریافت فهرست کاربران ناموفق بود', {
        description:
          error instanceof Error
            ? error.message
            : 'ارتباط با سرور برقرار نشد.',
      })
      return []
    }
  }, [])

  // Manual refresh (button / after mutations): shows the inline spinner.
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setUsers(await fetchUsers())
    setLoading(false)
  }, [fetchUsers])

  // Initial fetch: state updates happen only in the awaited continuation,
  // never synchronously inside the effect body.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await fetchUsers()
      if (cancelled) return
      setUsers(result)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchUsers])

  const selectedRole = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === role),
    [role],
  )

  const matchingRole = useCallback(
    (user: ApiUser) => {
      if (!role) return true
      const roles = Array.isArray(user.role) ? user.role : [user.role]
      // Backend sends integer role values; normalize before comparing.
      return roles.some((value) => normalizeApiUserRole(value) === role)
    },
    [role],
  )

  const visibleUsers = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    return users
      .filter(matchingRole)
      .filter((user) => {
        if (!needle) return true
        return [
          fullName(user),
          user.email,
          user.username,
          user.phoneNumber,
          userRoleLabel(user),
        ].some((value) =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(needle),
        )
      })
  }, [matchingRole, search, users])

  const traineeCount = useMemo(
    () => users.filter(matchingRole).length,
    [matchingRole, users],
  )
  const activeCount = useMemo(
    () =>
      users.filter((user) => matchingRole(user) && !user.disabled && user.isActive !== false)
        .length,
    [matchingRole, users],
  )
  const verifiedCount = useMemo(
    () =>
      users.filter((user) => matchingRole(user) && user.verified).length,
    [matchingRole, users],
  )

  const runUserAction = async (
    user: ApiUser,
    action: 'disable' | 'delete' | 'reset',
  ) => {
    const name = fullName(user)
    if (
      action === 'delete' &&
      !window.confirm(`کاربر «${name}» حذف شود؟ این عملیات قابل بازگشت نیست.`)
    )
      return
    if (action === 'disable' && !window.confirm(`حساب کاربری «${name}» غیرفعال شود؟`))
      return
    if (
      action === 'reset' &&
      !window.confirm(`برای «${name}» بازنشانی اجباری رمز عبور فعال شود؟`)
    )
      return
    setBusyId(user.id)
    try {
      if (action === 'disable') await disableUser(user.id)
      if (action === 'delete') await deleteUser(user.id)
      if (action === 'reset') await forcePasswordReset(user.id)
      toast.success(
        action === 'disable'
          ? 'حساب غیرفعال شد'
          : action === 'delete'
            ? 'کاربر حذف شد'
            : 'بازنشانی رمز عبور ثبت شد',
      )
      await loadUsers()
    } catch (error) {
      toast.error('انجام عملیات ناموفق بود', {
        description: error instanceof Error ? error.message : 'خطای ناشناخته',
      })
    } finally {
      setBusyId(null)
    }
  }

  const createHref =
    `/users/new${role ? `?role=${role}` : ''}`

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button asChild>
            <Link
              href={createHref}
              className="focus-visible:ring-ring inline-flex items-center gap-2 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2"
            >
              <Plus className="size-4" />
              افزودن {selectedRole?.label ?? 'کاربر'}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={selectedRole ? `${selectedRole.label}ها` : 'کل کاربران'}
          value={traineeCount}
          icon={<Users className="text-primary size-8" />}
        />
        <StatCard label="فعال" value={activeCount} icon={<UserRound className="text-primary size-8" />} />
        <StatCard label="حساب تأییدشده" value={verifiedCount} icon={<BadgeCheck className="text-primary size-8" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            فهرست {selectedRole?.label ?? 'کاربران'}{' '}
            <span className="text-muted-foreground ms-2 text-sm font-normal">
              ({visibleUsers.length.toLocaleString('fa-IR')})
            </span>
          </CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            <Input
              className="pr-9"
              placeholder="جستجو با نام، ایمیل، شماره یا نقش"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-12">
              <Loader2 className="size-5 animate-spin" />
              در حال دریافت کاربران…
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              {search ? 'کاربری با این مشخصات پیدا نشد.' : 'کاربری برای نمایش وجود ندارد.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-right">
                    <th className="p-3 font-medium">کاربر</th>
                    <th className="p-3 font-medium">نقش</th>
                    <th className="p-3 font-medium">شماره تماس</th>
                    <th className="p-3 font-medium">وضعیت</th>
                    <th className="p-3 font-medium">تأیید حساب</th>
                    <th className="p-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 border-b last:border-0"
                    >
                      <td className="p-3">
                        <div className="font-medium">{fullName(user)}</div>
                        <div className="text-muted-foreground mt-1 text-xs" dir="ltr">
                          {user.email ?? user.username ?? 'بدون ایمیل'}
                        </div>
                      </td>
                      <td className="p-3">{userRoleLabel(user)}</td>
                      <td className="p-3" dir="ltr">
                        {user.phoneNumber
                          ? `${user.phoneCountryCode ?? ''} ${user.phoneNumber}`
                          : '—'}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            user.disabled ? 'destructive' : user.isActive === false ? 'secondary' : 'default'
                          }
                        >
                          {!user.disabled && user.isActive !== false ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={user.verified ? 'default' : 'outline'}>
                          {user.verified ? 'تأیید شده' : 'در انتظار تأیید'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="ویرایش"
                            asChild
                          >
                            <Link href={`/users/${user.id}`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="بازنشانی رمز عبور"
                            disabled={busyId === user.id}
                            onClick={() => void runUserAction(user, 'reset')}
                          >
                            <KeyRound className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="غیرفعال‌سازی حساب"
                            disabled={busyId === user.id || !!user.disabled}
                            onClick={() => void runUserAction(user, 'disable')}
                          >
                            <ShieldBan className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف کاربر"
                            disabled={busyId === user.id}
                            onClick={() => void runUserAction(user, 'delete')}
                          >
                            <Trash2 className="text-destructive size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value.toLocaleString('fa-IR')}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  )
}

function fullName(user: ApiUser) {
  return (
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.username ||
    user.email ||
    'کاربر بدون نام'
  )
}

function userRoleLabel(user: ApiUser): string {
  const value = normalizeApiUserRole(
    (Array.isArray(user.role) ? user.role[0] : user.role) ?? null,
  )
  return value != null ? USER_ROLES[value] : 'نقش تعیین نشده'
}
