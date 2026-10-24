'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, Check, KeyRound, LoaderCircle, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { ApiUserRole, usersApi, type CreateUserInput, type UpdateUserInput, type UserDto } from '@/features/users/api/users-api'

const roleOptions = [
  { value: ApiUserRole.Admin, label: 'مدیر' },
  { value: ApiUserRole.Tranner, label: 'مربی' },
  { value: ApiUserRole.Trainee, label: 'ورزشکار' },
]

type FormValues = {
  firstName: string; lastName: string; email: string; phoneNumber: string
  phoneCountryCode: string; jobTitle: string; role: ApiUserRole; password: string; confirmPassword: string
}
const emptyForm: FormValues = { firstName: '', lastName: '', email: '', phoneNumber: '', phoneCountryCode: '+49', jobTitle: '', role: ApiUserRole.Trainee, password: '', confirmPassword: '' }

function roleName(roles?: string[] | null) {
  if (!roles?.length) return '—'
  return roles.map((raw) => {
    const normalized = raw.toLowerCase().replace(/[ _-]/g, '')
    if (normalized === 'admin') return 'مدیر'
    if (normalized === 'tranner' || normalized === 'trainer') return 'مربی'
    if (normalized === 'trainee' || normalized === 'member') return 'ورزشکار'
    return raw
  }).join('، ')
}
function userName(user: UserDto) {
  return user.fullName?.trim() || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || user.email
}
function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'عملیات انجام نشد. اتصال به سرور را بررسی کنید.'
}

export function UserManagement() {
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await usersApi.list()
      setUsers(Array.isArray(result) ? result : [])
    } catch (error) {
      toast.error(errorMessage(error))
      setUsers([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadUsers() }, [loadUsers])

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return users
    return users.filter((user) => [userName(user), user.email, user.username, user.phoneNumber, roleName(user.role)]
      .some((value) => value?.toLocaleLowerCase().includes(term)))
  }, [users, query])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (user: UserDto) => {
    const role = (user.role?.[0] ?? '').toLowerCase()
    const selectedRole = role.includes('admin') ? ApiUserRole.Admin : (role.includes('tranner') || role.includes('trainer')) ? ApiUserRole.Tranner : ApiUserRole.Trainee
    setEditing(user)
    setForm({ ...emptyForm, firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email ?? user.username ?? '', phoneNumber: user.phoneNumber ?? '', phoneCountryCode: user.phoneCountryCode || '+49', role: selectedRole })
    setDialogOpen(true)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) { toast.error('نام، نام خانوادگی و ایمیل الزامی است.'); return }
    if (!editing && (!form.password || form.password.length < 8)) { toast.error('رمز عبور اولیه باید حداقل ۸ کاراکتر باشد.'); return }
    if (!editing && form.password !== form.confirmPassword) { toast.error('تکرار رمز عبور مطابقت ندارد.'); return }
    const base: CreateUserInput = {
      firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || null, phoneCountryCode: form.phoneCountryCode.trim() || '+49',
      jobTitle: form.jobTitle.trim() || null, role: form.role,
      ...(form.password ? { password: form.password, confirmPassword: form.confirmPassword } : {}),
    }
    setSaving(true)
    try {
      if (editing) {
        const payload: UpdateUserInput = { ...base, id: editing.id }
        await usersApi.update(payload)
        toast.success('اطلاعات کاربر به‌روزرسانی شد.')
      } else {
        await usersApi.create(base)
        toast.success('کاربر جدید ایجاد شد.')
      }
      setDialogOpen(false)
      await loadUsers()
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setSaving(false) }
  }

  const perform = async (user: UserDto, action: 'disable' | 'delete' | 'reset') => {
    const label = userName(user)
    if (action === 'delete' && !window.confirm(`کاربر «${label}» حذف شود؟ این عملیات ممکن است قابل بازگشت نباشد.`)) return
    if (action === 'disable' && !window.confirm(`دسترسی «${label}» غیرفعال شود؟`)) return
    if (action === 'reset' && !window.confirm(`بازنشانی اجباری رمز عبور برای «${label}» فعال شود؟`)) return
    setBusyId(user.id)
    try {
      if (action === 'disable') { await usersApi.disable(user.id); toast.success('درخواست غیرفعال‌سازی انجام شد.') }
      if (action === 'delete') { await usersApi.remove(user.id); toast.success('کاربر حذف شد.') }
      if (action === 'reset') { await usersApi.forceResetPassword(user.id); toast.success('بازنشانی اجباری رمز عبور ثبت شد.') }
      await loadUsers()
    } catch (error) { toast.error(errorMessage(error)) }
    finally { setBusyId(null) }
  }

  const activeCount = users.filter((user) => user.isActive && !user.disabled).length
  const verifiedCount = users.filter((user) => user.verified).length

  return <div dir="rtl" className="space-y-6 pb-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" /> مدیریت کاربران</div><h1 className="text-2xl font-bold tracking-tight">کاربران مجموعه</h1><p className="mt-1 text-sm text-muted-foreground">ایجاد و مدیریت حساب‌های کاربری از طریق سرویس اصلی.</p></div>
      <div className="flex gap-2"><button onClick={() => void loadUsers()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> بروزرسانی</button><button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"><Plus className="size-4" /> کاربر جدید</button></div>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Stat title="کل کاربران" value={users.length} icon={<Users className="size-5" />} />
      <Stat title="کاربران فعال" value={activeCount} icon={<UserRound className="size-5" />} />
      <Stat title="تأییدشده" value={verifiedCount} icon={<ShieldCheck className="size-5" />} />
    </div>

    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">فهرست کاربران</h2><p className="mt-1 text-xs text-muted-foreground">{filtered.length.toLocaleString('fa-IR')} نتیجه</p></div><div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجو نام، ایمیل یا شماره..." className="w-full rounded-xl border bg-background py-2.5 pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div></div>
      {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /> در حال دریافت کاربران...</div> : filtered.length === 0 ? <div className="flex flex-col items-center justify-center px-4 py-14 text-center"><div className="mb-3 rounded-full bg-muted p-3"><Users className="size-6 text-muted-foreground" /></div><p className="font-medium">{query ? 'کاربری با این مشخصات پیدا نشد' : 'هنوز کاربری برای نمایش وجود ندارد'}</p><p className="mt-1 text-sm text-muted-foreground">{query ? 'عبارت جست‌وجو را تغییر دهید.' : 'برای شروع، یک کاربر جدید ایجاد کنید.'}</p>{!query && <button onClick={openCreate} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">ایجاد کاربر</button>}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">کاربر</th><th className="px-4 py-3 font-medium">نقش</th><th className="px-4 py-3 font-medium">شماره تماس</th><th className="px-4 py-3 font-medium">وضعیت</th><th className="px-4 py-3 font-medium">تأیید</th><th className="px-4 py-3 font-medium">تاریخ ایجاد</th><th className="px-4 py-3 font-medium">عملیات</th></tr></thead><tbody className="divide-y">{filtered.map((user) => <tr key={user.id} className="hover:bg-muted/20"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{(user.firstName?.[0] || user.email?.[0] || 'ک').toLocaleUpperCase('fa-IR')}{user.lastName?.[0] || ''}</div><div className="min-w-0"><p className="font-semibold">{userName(user)}</p><p className="mt-0.5 max-w-64 truncate text-xs text-muted-foreground" dir="ltr">{user.email || user.username}</p></div></div></td><td className="px-4 py-3">{roleName(user.role)}</td><td className="px-4 py-3" dir="ltr">{user.phoneNumber ? `${user.phoneCountryCode || ''} ${user.phoneNumber}` : '—'}</td><td className="px-4 py-3"><Status active={user.isActive && !user.disabled} /></td><td className="px-4 py-3">{user.verified ? <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="size-4" /> تأییدشده</span> : <span className="text-muted-foreground">تأییدنشده</span>}</td><td className="px-4 py-3 text-muted-foreground">{user.createdAt ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(user.createdAt)) : '—'}</td><td className="px-4 py-3"><div className="flex items-center gap-1"><Action title="ویرایش" onClick={() => openEdit(user)}><Pencil className="size-4" /></Action><Action title="الزام بازنشانی رمز" disabled={busyId === user.id} onClick={() => void perform(user, 'reset')}><KeyRound className="size-4" /></Action><Action title="غیرفعال‌سازی" disabled={busyId === user.id || user.disabled || !user.isActive} onClick={() => void perform(user, 'disable')}><AlertTriangle className="size-4" /></Action><Action title="حذف" danger disabled={busyId === user.id} onClick={() => void perform(user, 'delete')}><Trash2 className="size-4" /></Action></div></td></tr>)}</tbody></table></div>}
    </section>

    {dialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setDialogOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><h2 id="user-dialog-title" className="text-lg font-bold">{editing ? 'ویرایش کاربر' : 'ایجاد کاربر جدید'}</h2><p className="mt-1 text-sm text-muted-foreground">اطلاعات را مطابق قرارداد سرویس کاربران وارد کنید.</p></div><button type="button" aria-label="بستن" onClick={() => setDialogOpen(false)} className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></button></div><form onSubmit={submit} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="نام *"><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={fieldClass} /></Field><Field label="نام خانوادگی *"><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={fieldClass} /></Field><Field label="ایمیل / نام کاربری *"><input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} /></Field><Field label="شماره تماس"><div className="flex gap-2"><input aria-label="پیش‌شماره کشور" dir="ltr" value={form.phoneCountryCode} onChange={(e) => setForm({ ...form, phoneCountryCode: e.target.value })} className={`${fieldClass} w-24`} /><input aria-label="شماره تماس" dir="ltr" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className={fieldClass} /></div></Field><Field label="نقش"><select value={form.role} onChange={(e) => setForm({ ...form, role: Number(e.target.value) as ApiUserRole })} className={fieldClass}>{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></Field><Field label="عنوان شغلی"><input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className={fieldClass} /></Field>{!editing && <><Field label="رمز عبور اولیه *"><input required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={fieldClass} /></Field><Field label="تکرار رمز عبور *"><input required minLength={8} type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={fieldClass} /></Field></>}</div><div className="flex justify-end gap-2 border-t pt-4"><button type="button" disabled={saving} onClick={() => setDialogOpen(false)} className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted">انصراف</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <LoaderCircle className="size-4 animate-spin" />}{editing ? 'ذخیره تغییرات' : 'ایجاد کاربر'}</button></div></form></section></div>}
  </div>
}

function Stat({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <div className="flex items-center justify-between rounded-2xl border bg-card p-4"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value.toLocaleString('fa-IR')}</p></div><div className="rounded-xl bg-primary/10 p-3 text-primary">{icon}</div></div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-medium">{label}{children}</label> }
const fieldClass = 'w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-primary/30'
function Status({ active }: { active: boolean }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>{active ? 'فعال' : 'غیرفعال'}</span> }
function Action({ title, children, onClick, disabled, danger }: { title: string; children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) { return <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} className={`rounded-lg p-2 hover:bg-muted disabled:opacity-30 ${danger ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>{children}</button> }
