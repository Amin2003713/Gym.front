'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ChevronLeft,
  Inbox,
  LifeBuoy,
  MessageCircle,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Ticket,
} from 'lucide-react'

import {
  createSupportTicket,
  getSupportTicket,
  listSupportTickets,
  replySupportTicket,
  setSupportTicketStatus,
} from '@/app/(tenant)/_api/support-api'
import {
  SupportTicketPriority,
  SupportTicketStatus,
  type SupportTicket,
  type SupportTicketListItem,
} from '@/app/(tenant)/_model/support.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.Open]: 'باز',
  [SupportTicketStatus.InProgress]: 'در حال بررسی',
  [SupportTicketStatus.WaitingForMember]: 'منتظر پاسخ شما',
  [SupportTicketStatus.Resolved]: 'حل‌شده',
  [SupportTicketStatus.Closed]: 'بسته',
}

const PRIORITY_LABEL: Record<SupportTicketPriority, string> = {
  [SupportTicketPriority.Normal]: 'عادی',
  [SupportTicketPriority.High]: 'مهم',
  [SupportTicketPriority.Urgent]: 'فوری',
}

const STATUS_VALUES: SupportTicketStatus[] = [
  SupportTicketStatus.Open,
  SupportTicketStatus.InProgress,
  SupportTicketStatus.WaitingForMember,
  SupportTicketStatus.Resolved,
  SupportTicketStatus.Closed,
]

const PRIORITY_VALUES: SupportTicketPriority[] = [
  SupportTicketPriority.Normal,
  SupportTicketPriority.High,
  SupportTicketPriority.Urgent,
]

const STATUS_TONE: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.Open]: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  [SupportTicketStatus.InProgress]:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  [SupportTicketStatus.WaitingForMember]:
    'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  [SupportTicketStatus.Resolved]:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  [SupportTicketStatus.Closed]: 'border-border bg-muted text-muted-foreground',
}

const PRIORITY_TONE: Record<SupportTicketPriority, string> = {
  [SupportTicketPriority.Normal]: 'border-border text-muted-foreground',
  [SupportTicketPriority.High]: 'border-amber-500/40 text-amber-700 dark:text-amber-300',
  [SupportTicketPriority.Urgent]: 'border-red-500/40 text-red-700 dark:text-red-300',
}

const isLocked = (status: SupportTicketStatus) =>
  status === SupportTicketStatus.Resolved || status === SupportTicketStatus.Closed

const faDate = (value: string) => new Date(value).toLocaleDateString('fa-IR')

function StatusChip({ status }: { status: SupportTicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export function SupportCenter({ staff = false }: { staff?: boolean }) {
  const [tickets, setTickets] = useState<SupportTicketListItem[]>([])
  const [active, setActive] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | 'all'>('all')
  const [creating, setCreating] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('General')
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTickets(await listSupportTickets())
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'خطای نامشخص')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openTicket = useCallback(async (id: string) => {
    try {
      setActive(await getSupportTicket(id))
    } catch (error) {
      toast.error('دریافت جزئیات ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [])

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return tickets.filter((ticket) => {
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false
      if (!term) return true
      return (
        ticket.subject.toLowerCase().includes(term) ||
        ticket.category.toLowerCase().includes(term) ||
        ticket.memberUserId.toLowerCase().includes(term)
      )
    })
  }, [tickets, query, statusFilter])

  const create = async () => {
    if (subject.trim().length < 3 || message.trim().length < 5) {
      toast.error('عنوان و شرح درخواست را کامل کنید.')
      return
    }
    setBusy(true)
    try {
      const ticket = await createSupportTicket({
        subject: subject.trim(),
        category,
        message: message.trim(),
      })
      setCreating(false)
      setSubject('')
      setMessage('')
      setActive(ticket)
      await load()
      toast.success('درخواست پشتیبانی ثبت شد')
    } catch (error) {
      toast.error('ثبت درخواست ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const sendReply = async () => {
    if (!active || reply.trim().length < 2) return
    setBusy(true)
    try {
      setActive(await replySupportTicket(active.id, reply.trim()))
      setReply('')
      await load()
      toast.success('پاسخ ارسال شد')
    } catch (error) {
      toast.error('ارسال پاسخ ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (status: SupportTicketStatus) => {
    if (!active) return
    setBusy(true)
    try {
      await setSupportTicketStatus(active.id, status, active.priority)
      setActive(await getSupportTicket(active.id))
      await load()
      toast.success('وضعیت درخواست تغییر کرد')
    } catch (error) {
      toast.error('تغییر وضعیت ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const changePriority = async (priority: SupportTicketPriority) => {
    if (!active) return
    setBusy(true)
    try {
      await setSupportTicketStatus(active.id, active.status, priority)
      setActive(await getSupportTicket(active.id))
      await load()
      toast.success('اولویت درخواست تغییر کرد')
    } catch (error) {
      toast.error('تغییر اولویت ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  const locked = active ? isLocked(active.status) : false

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <LifeBuoy className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">
                {staff ? 'مرکز پشتیبانی' : 'درخواست‌های پشتیبانی'}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {staff
                  ? 'صندوق مشترک گفتگو با اعضا؛ پاسخ بدهید و وضعیت را به‌روز نگه دارید.'
                  : 'گفتگو با تیم پشتیبانی و پیگیری وضعیت درخواست‌ها'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {staff && (
            <Link
              href="/live-console"
              className="border-border hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition"
            >
              <Radio className="me-2 size-4" />
              پخش زنده
            </Link>
          )}
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          {!staff && (
            <Button onClick={() => setCreating((value) => !value)}>
              <Plus className="me-2 size-4" />
              درخواست جدید
            </Button>
          )}
        </div>
      </div>

      {creating && !staff && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ثبت درخواست جدید</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <Input
                placeholder="عنوان درخواست"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                aria-label="عنوان درخواست"
              />
              <select
                className="bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="دستهٔ درخواست"
              >
                <option value="General">عمومی</option>
                <option value="Account">حساب کاربری</option>
                <option value="Payment">پرداخت و عضویت</option>
                <option value="Training">برنامه و تمرین</option>
                <option value="Technical">مشکل فنی</option>
              </select>
            </div>
            <Textarea
              placeholder="شرح کامل مشکل یا درخواست..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              aria-label="شرح درخواست"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>
                انصراف
              </Button>
              <Button onClick={() => void create()} disabled={busy}>
                ثبت درخواست
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.6fr)]">
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="space-y-3 pb-3">
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <Ticket className="size-4" />
                درخواست‌ها
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                {visible.length} از {tickets.length}
              </span>
            </CardTitle>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجو در عنوان یا دسته..."
                className="ps-9"
                aria-label="جستجوی درخواست‌ها"
              />
            </div>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
              {(['all', ...STATUS_VALUES] as const).map((value) => {
                const selected = statusFilter === value
                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`focus-visible:ring-ring shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition focus-visible:ring-2 focus-visible:outline-none ${
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {value === 'all' ? 'همه' : STATUS_LABEL[value]}
                  </button>
                )
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-muted/60 h-[74px] animate-pulse rounded-lg" />
              ))
            ) : loadError ? (
              <div className="grid place-items-center gap-2 py-10 text-center">
                <AlertCircle className="text-destructive size-7" />
                <p className="text-sm font-semibold">دریافت درخواست‌ها ناموفق بود</p>
                <p className="text-muted-foreground max-w-[24ch] text-xs">{loadError}</p>
                <Button size="sm" variant="outline" onClick={() => void load()}>
                  تلاش دوباره
                </Button>
              </div>
            ) : visible.length === 0 ? (
              <div className="grid place-items-center gap-2 py-10 text-center">
                <Inbox className="text-muted-foreground/60 size-8" />
                <p className="text-muted-foreground text-sm">
                  {tickets.length === 0 ? 'هنوز درخواستی ثبت نشده است.' : 'درخواستی با این فیلتر پیدا نشد.'}
                </p>
              </div>
            ) : (
              visible.map((ticket) => {
                const selected = active?.id === ticket.id
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => void openTicket(ticket.id)}
                    className={`w-full rounded-lg border p-3 text-right transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-bold">{ticket.subject}</span>
                      <StatusChip status={ticket.status} />
                    </div>
                    <div className="text-muted-foreground mt-2 flex items-center justify-between gap-2 text-[11px]">
                      <span className="line-clamp-1">
                        {ticket.category} · {ticket.messageCount} پیام
                        {staff && ` · ${ticket.memberUserId.slice(0, 8)}`}
                      </span>
                      <time dateTime={ticket.lastActivityAt}>{faDate(ticket.lastActivityAt)}</time>
                    </div>
                    {ticket.priority !== SupportTicketPriority.Normal && (
                      <span
                        className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_TONE[ticket.priority]}`}
                      >
                        اولویت {PRIORITY_LABEL[ticket.priority]}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[420px]">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                <MessageCircle className="size-4 shrink-0" />
                <span className="truncate">{active ? active.subject : 'جزئیات گفتگو'}</span>
              </CardTitle>
              {active && <StatusChip status={active.status} />}
            </div>
            {active && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">{active.category}</Badge>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${PRIORITY_TONE[active.priority]}`}
                >
                  اولویت: {PRIORITY_LABEL[active.priority]}
                </span>
                <span className="text-muted-foreground">شروع {faDate(active.createdAt)}</span>
                {staff && (
                  <div className="ms-auto flex flex-wrap items-center gap-2">
                    <label className="text-muted-foreground flex items-center gap-1.5">
                      وضعیت
                      <select
                        aria-label="وضعیت درخواست"
                        className="bg-background h-8 rounded-md border px-2 text-xs"
                        value={active.status}
                        disabled={busy}
                        onChange={(event) =>
                          void changeStatus(Number(event.target.value) as SupportTicketStatus)
                        }
                      >
                        {STATUS_VALUES.map((value) => (
                          <option key={value} value={value}>
                            {STATUS_LABEL[value]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-muted-foreground flex items-center gap-1.5">
                      اولویت
                      <select
                        aria-label="اولویت درخواست"
                        className="bg-background h-8 rounded-md border px-2 text-xs"
                        value={active.priority}
                        disabled={busy}
                        onChange={(event) =>
                          void changePriority(Number(event.target.value) as SupportTicketPriority)
                        }
                      >
                        {PRIORITY_VALUES.map((value) => (
                          <option key={value} value={value}>
                            {PRIORITY_LABEL[value]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {!active ? (
              <div className="text-muted-foreground grid min-h-64 place-items-center text-center text-sm">
                <div>
                  <MessageCircle className="mx-auto mb-2 size-8 opacity-40" />
                  برای مشاهده گفتگو، یک درخواست را از فهرست انتخاب کنید.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/25 max-h-[48vh] space-y-3 overflow-y-auto rounded-lg p-3">
                  {active.messages.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">پیامی ثبت نشده است.</p>
                  ) : (
                    active.messages.map((entry) => (
                      <div
                        key={entry.id}
                        className={`max-w-[92%] rounded-xl border p-3 ${
                          entry.isStaffReply ? 'bg-card me-auto' : 'bg-primary/10 ms-auto'
                        }`}
                      >
                        <div className="text-muted-foreground mb-1 flex items-center justify-between gap-3 text-[11px]">
                          <span className="font-bold">
                            {entry.isStaffReply ? 'پشتیبانی' : staff ? 'کاربر' : 'شما'}
                          </span>
                          <time dateTime={entry.createdAt} dir="ltr">
                            {new Date(entry.createdAt).toLocaleString('fa-IR')}
                          </time>
                        </div>
                        <p className="text-sm leading-7 whitespace-pre-wrap">{entry.body}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder={
                      locked
                        ? 'این درخواست بسته شده است.'
                        : 'پاسخ خود را بنویسید...'
                    }
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    disabled={busy || locked}
                    aria-label="متن پاسخ"
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        event.preventDefault()
                        void sendReply()
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-[11px]">
                      {locked
                        ? 'برای ادامه، وضعیت را از حالت حل‌شده/بسته خارج کنید.'
                        : 'Ctrl + Enter برای ارسال'}
                    </span>
                    <Button
                      onClick={() => void sendReply()}
                      disabled={busy || locked || reply.trim().length < 2}
                    >
                      <Send className="me-2 size-4" />
                      ارسال پاسخ
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {staff && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <ChevronLeft className="size-3.5" />
          فهرست تا ۱۰۰ درخواست اخیر را نشان می‌دهد؛ برای آرشیو از فیلتر وضعیت استفاده کنید.
        </p>
      )}
    </div>
  )
}
