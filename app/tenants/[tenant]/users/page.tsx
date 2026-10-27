'use client'

import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldBan,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'

import {
  listUsers,
  createUser,
  updateUser,
  disableUser,
  deleteUser,
  forcePasswordReset,
} from './_api/user-api'
import type { ApiUser, ApiUserRole } from './_model/user.types'

const ROLE_OPTIONS: { value: ApiUserRole; label: string }[] = [
  { value: 'Admin', label: 'مالک / مدیر باشگاه' },
  { value: 'Trainer', label: 'مربی' },
  { value: 'Trainee', label: 'شاگرد' },
]

type UserForm = {
  id?: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  phoneCountryCode: string
  avatar: string
  gender: string
  role: ApiUserRole
  password: string
  confirmPassword: string
}
const EMPTY_FORM: UserForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  phoneCountryCode: '+49',
  avatar: '',
  gender: '',
  role: 'Trainee',
  password: '',
  confirmPassword: '',
}

function userRole(user: ApiUser): string {
  const value = Array.isArray(user.role) ? user.role[0] : user.role
  const found = ROLE_OPTIONS.find(
    (role) => role.value.toLowerCase() === String(value ?? '').toLowerCase(),
  )
  return found?.label ?? (value || 'نقش تعیین نشده')
}
function fullName(user: ApiUser) {
  return (
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.username ||
    user.email ||
    'کاربر بدون نام'
  )
}
function formFromUser(user: ApiUser): UserForm {
  const role =
    (Array.isArray(user.role) ? user.role[0] : user.role) ?? 'Trainee'
  const normalizedRole =
    ROLE_OPTIONS.find(
      (x) => x.value.toLowerCase() === String(role).toLowerCase(),
    )?.value ?? 'Trainee'
  return {
    ...EMPTY_FORM,
    id: user.id,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phoneNumber: user.phoneNumber ?? '',
    phoneCountryCode: user.phoneCountryCode ?? '+49',
    avatar: user.avatar ?? '',
    gender: user.gender == null ? '' : String(user.gender),
    role: normalizedRole,
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }

    try {
      const result = await listUsers()
      setUsers(Array.isArray(result) ? result : [])
    } catch (error) {
      toast.error('دریافت فهرست کاربران ناموفق بود', {
        description:
          error instanceof Error ? error.message : 'ارتباط با سرور برقرار نشد.',
      })
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchUsers = async () => {
      try {
        const result = await listUsers()

        if (!cancelled) {
          setUsers(Array.isArray(result) ? result : [])
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('دریافت فهرست کاربران ناموفق بود', {
            description:
              error instanceof Error
                ? error.message
                : 'ارتباط با سرور برقرار نشد.',
          })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchUsers()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    if (!needle) return users
    return users.filter((user) =>
      [
        fullName(user),
        user.email,
        user.username,
        user.phoneNumber,
        userRole(user),
      ].some((value) =>
        String(value ?? '')
          .toLocaleLowerCase()
          .includes(needle),
      ),
    )
  }, [users, search])

  const setField = <K extends keyof UserForm>(key: K, value: UserForm[K]) =>
    setForm((old) => ({ ...old, [key]: value }))
  const openCreate = () => {
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }
  const openEdit = (user: ApiUser) => {
    setForm(formFromUser(user))
    setDialogOpen(true)
  }

  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error('نام، نام خانوادگی و ایمیل الزامی هستند')
      return
    }
    if (!form.id && form.password && form.password !== form.confirmPassword) {
      toast.error('رمز عبور و تکرار آن یکسان نیستند')
      return
    }
    setSaving(true)
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
      phoneCountryCode: form.phoneCountryCode.trim() || '+49',
      avatar: form.avatar.trim() || null,
      gender: form.gender === '' ? null : Number(form.gender),
      role: form.role,
      ...(!form.id
        ? {
            password: form.password || null,
            confirmPassword: form.confirmPassword || null,
          }
        : { id: form.id }),
    }
    try {
      if (form.id) await updateUser(payload)
      else await createUser(payload)
      toast.success(
        form.id ? 'اطلاعات کاربر به‌روزرسانی شد' : 'کاربر جدید ایجاد شد',
      )
      setDialogOpen(false)
      await loadUsers()
    } catch (error) {
      toast.error(
        form.id ? 'ویرایش کاربر ناموفق بود' : 'ایجاد کاربر ناموفق بود',
        {
          description:
            error instanceof Error
              ? error.message
              : 'لطفاً اطلاعات را بررسی کنید.',
        },
      )
    } finally {
      setSaving(false)
    }
  }

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
    if (
      action === 'disable' &&
      !window.confirm(`حساب کاربری «${name}» غیرفعال شود؟`)
    )
      return
    if (
      action === 'reset' &&
      !window.confirm(`برای «${name}» بازنشانی اجباری رمز عبور فعال شود؟`)
    )
      return
    setDeletingId(user.id)
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
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت کاربران</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مدیریت هویت و دسترسی مالکان، مربی‌ها و شاگردهای باشگاه
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void loadUsers()}
            disabled={loading}
          >
            <RefreshCw
              className={`ml-2 size-4 ${loading ? 'animate-spin' : ''}`}
            />
            بروزرسانی
          </Button>
          <Button onClick={openCreate}>
            <Plus className="ml-2 size-4" />
            افزودن کاربر
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-muted-foreground text-sm">کل کاربران</p>
              <p className="mt-1 text-2xl font-bold">{users.length}</p>
            </div>
            <Users className="text-primary size-8" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-muted-foreground text-sm">مربی‌ها</p>
              <p className="mt-1 text-2xl font-bold">
                {users.filter((u) => userRole(u) === 'مربی').length}
              </p>
            </div>
            <Badge>مربی</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-muted-foreground text-sm">شاگردها</p>
              <p className="mt-1 text-2xl font-bold">
                {users.filter((u) => userRole(u) === 'شاگرد').length}
              </p>
            </div>
            <Badge variant="secondary">شاگرد</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            فهرست کاربران{' '}
            <span className="text-muted-foreground mr-2 text-sm font-normal">
              ({filteredUsers.length})
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
            <div className="text-muted-foreground py-12 text-center">
              در حال دریافت کاربران…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              کاربری برای نمایش پیدا نشد.
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
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 border-b last:border-0"
                    >
                      <td className="p-3">
                        <div className="font-medium">{fullName(user)}</div>
                        <div className="text-muted-foreground mt-1 text-xs">
                          {user.email ?? user.username ?? 'بدون ایمیل'}
                        </div>
                      </td>
                      <td className="p-3">{userRole(user)}</td>
                      <td className="p-3" dir="ltr">
                        {user.phoneNumber
                          ? `${user.phoneCountryCode ?? ''} ${user.phoneNumber}`
                          : '—'}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            user.disabled
                              ? 'destructive'
                              : user.isActive === false
                                ? 'secondary'
                                : 'default'
                          }
                        >
                          {user.disabled
                            ? 'غیرفعال'
                            : user.isActive === false
                              ? 'غیرفعال'
                              : 'فعال'}
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
                            onClick={() => openEdit(user)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="بازنشانی رمز عبور"
                            disabled={deletingId === user.id}
                            onClick={() => void runUserAction(user, 'reset')}
                          >
                            <KeyRound className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="غیرفعال‌سازی حساب"
                            disabled={deletingId === user.id || !!user.disabled}
                            onClick={() => void runUserAction(user, 'disable')}
                          >
                            <ShieldBan className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف کاربر"
                            disabled={deletingId === user.id}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? 'ویرایش پروفایل کاربر' : 'افزودن کاربر جدید'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>نام *</span>
                <Input
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>نام خانوادگی *</span>
                <Input
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>ایمیل / نام کاربری *</span>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                  dir="ltr"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>نقش در باشگاه *</span>
                <select
                  className="border-input bg-background h-10 w-full rounded-md border px-3"
                  value={form.role}
                  onChange={(e) =>
                    setField('role', e.target.value as ApiUserRole)
                  }
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>کد کشور</span>
                <Input
                  value={form.phoneCountryCode}
                  onChange={(e) => setField('phoneCountryCode', e.target.value)}
                  dir="ltr"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>شماره تماس</span>
                <Input
                  value={form.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value)}
                  dir="ltr"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>جنسیت</span>
                <select
                  className="border-input bg-background h-10 w-full rounded-md border px-3"
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                >
                  <option value="">انتخاب نشده</option>
                  <option value="0">مرد</option>
                  <option value="1">زن</option>
                </select>
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>آدرس تصویر پروفایل (اختیاری)</span>
                <Input
                  value={form.avatar}
                  onChange={(e) => setField('avatar', e.target.value)}
                  dir="ltr"
                  placeholder="https://…"
                />
              </label>
              {!form.id && (
                <>
                  <label className="space-y-1 text-sm">
                    <span>رمز عبور اولیه</span>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => setField('password', e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>تکرار رمز عبور</span>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setField('confirmPassword', e.target.value)
                      }
                    />
                  </label>
                </>
              )}
            </div>
            <p className="text-muted-foreground text-xs leading-6">
              نقش‌ها مطابق API فعلی: Admin (مالک/مدیر)، Trainer (مربی)، Trainee
              (شاگرد). فعال‌سازی، تأیید ایمیل و تغییر رمز از endpointهای جداگانه
              مدیریت می‌شوند.
            </p>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'در حال ذخیره…'
                  : form.id
                    ? 'ذخیره تغییرات'
                    : 'ایجاد کاربر'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                <X className="ml-2 size-4" />
                انصراف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
