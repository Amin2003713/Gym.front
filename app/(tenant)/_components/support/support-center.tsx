'use client'

import { useCallback, useEffect, useState } from 'react'
import { LifeBuoy, MessageCircle, Plus, Send, Ticket, RefreshCw } from 'lucide-react'
import { createSupportTicket, getSupportTicket, listSupportTickets, replySupportTicket, setSupportTicketStatus } from '@/app/(tenant)/_api/support-api'
import { SupportTicketPriority, SupportTicketStatus, type SupportTicket, type SupportTicketListItem } from '@/app/(tenant)/_model/support.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'

const statusLabel = (s: SupportTicketStatus) => ['باز','در حال بررسی','منتظر پاسخ شما','حل‌شده','بسته'][s] ?? 'نامشخص'
const priorityLabel = (p: SupportTicketPriority) => ['عادی','مهم','فوری'][p] ?? 'عادی'

export function SupportCenter({ staff = false }: { staff?: boolean }) {
  const [tickets, setTickets] = useState<SupportTicketListItem[]>([])
  const [active, setActive] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('General')
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setTickets(await listSupportTickets()) }
    catch (e) { toast.error('دریافت درخواست‌ها ناموفق بود', { description: e instanceof Error ? e.message : undefined }) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const openTicket = async (id: string) => {
    try { setActive(await getSupportTicket(id)) }
    catch (e) { toast.error('دریافت جزئیات ناموفق بود', { description: e instanceof Error ? e.message : undefined }) }
  }
  const create = async () => {
    if (subject.trim().length < 3 || message.trim().length < 5) return toast.error('عنوان و شرح درخواست را کامل کنید.')
    setBusy(true)
    try { const ticket = await createSupportTicket({ subject: subject.trim(), category, message: message.trim() }); setCreating(false); setSubject(''); setMessage(''); setActive(ticket); await load(); toast.success('درخواست پشتیبانی ثبت شد') }
    catch (e) { toast.error('ثبت درخواست ناموفق بود', { description: e instanceof Error ? e.message : undefined }) }
    finally { setBusy(false) }
  }
  const sendReply = async () => {
    if (!active || reply.trim().length < 2) return
    setBusy(true)
    try { setActive(await replySupportTicket(active.id, reply.trim())); setReply(''); await load(); toast.success('پاسخ ارسال شد') }
    catch (e) { toast.error('ارسال پاسخ ناموفق بود', { description: e instanceof Error ? e.message : undefined }) }
    finally { setBusy(false) }
  }
  const changeStatus = async (status: SupportTicketStatus) => {
    if (!active) return
    setBusy(true)
    try { await setSupportTicketStatus(active.id, status); setActive(await getSupportTicket(active.id)); await load(); toast.success('وضعیت درخواست تغییر کرد') }
    catch (e) { toast.error('تغییر وضعیت ناموفق بود', { description: e instanceof Error ? e.message : undefined }) }
    finally { setBusy(false) }
  }

  return <div className="space-y-5" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><LifeBuoy className="size-6"/><h1 className="text-2xl font-bold">{staff ? 'مرکز پشتیبانی' : 'درخواست‌های پشتیبانی'}</h1></div><p className="mt-1 text-sm text-muted-foreground">پیگیری درخواست‌ها و گفتگو با تیم پشتیبانی</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="ms-2 size-4"/>بروزرسانی</Button>{!staff && <Button onClick={() => setCreating(v => !v)}><Plus className="ms-2 size-4"/>درخواست جدید</Button>}</div></div>
    {creating && <Card><CardHeader><CardTitle>ثبت درخواست جدید</CardTitle></CardHeader><CardContent className="space-y-3"><Input placeholder="عنوان درخواست" value={subject} onChange={e => setSubject(e.target.value)}/><select className="h-10 w-full rounded-md border bg-background px-3" value={category} onChange={e => setCategory(e.target.value)}><option value="General">عمومی</option><option value="Account">حساب کاربری</option><option value="Payment">پرداخت و عضویت</option><option value="Training">برنامه و تمرین</option><option value="Technical">مشکل فنی</option></select><Textarea placeholder="شرح کامل مشکل یا درخواست..." value={message} onChange={e => setMessage(e.target.value)} rows={4}/><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCreating(false)}>انصراف</Button><Button onClick={() => void create()} disabled={busy}>ثبت درخواست</Button></div></CardContent></Card>}
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Ticket className="size-4"/>درخواست‌ها ({tickets.length})</CardTitle></CardHeader><CardContent className="space-y-2">{loading ? <p className="py-8 text-center text-sm text-muted-foreground">در حال دریافت...</p> : tickets.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">هنوز درخواستی ثبت نشده است.</p> : tickets.map(t => <button key={t.id} onClick={() => void openTicket(t.id)} className={`w-full rounded-lg border p-3 text-right transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active?.id === t.id ? 'border-primary bg-muted/50' : ''}`}><div className="flex items-start justify-between gap-2"><span className="font-semibold">{t.subject}</span><Badge variant="secondary">{statusLabel(t.status)}</Badge></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{t.category} · {t.messageCount} پیام</span><span>{new Date(t.lastActivityAt).toLocaleDateString('fa-IR')}</span></div></button>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>{active ? active.subject : 'جزئیات گفتگو'}</CardTitle></CardHeader><CardContent>{!active ? <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground"><div><MessageCircle className="mx-auto mb-2 size-8 opacity-40"/>برای مشاهده گفتگو، یک درخواست را انتخاب کنید.</div></div> : <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{statusLabel(active.status)}</Badge><Badge variant="outline">اولویت: {priorityLabel(active.priority)}</Badge><span className="text-xs text-muted-foreground">{active.category}</span>{staff && <select aria-label="وضعیت درخواست" className="ms-auto h-9 rounded-md border bg-background px-2 text-sm" value={active.status} disabled={busy} onChange={e => void changeStatus(Number(e.target.value) as SupportTicketStatus)}>{Object.values(SupportTicketStatus).filter(v => typeof v === 'number').map(v => <option key={v} value={v}>{statusLabel(v as SupportTicketStatus)}</option>)}</select>}</div><div className="max-h-[460px] space-y-3 overflow-y-auto rounded-lg bg-muted/30 p-3">{active.messages.map(m => <div key={m.id} className={`max-w-[90%] rounded-xl border p-3 ${m.isStaffReply ? 'me-auto bg-card' : 'ms-auto bg-primary/10'}`}><div className="mb-1 flex justify-between gap-3 text-xs text-muted-foreground"><span>{m.isStaffReply ? 'پشتیبانی' : 'شما'}</span><time>{new Date(m.createdAt).toLocaleString('fa-IR')}</time></div><p className="whitespace-pre-wrap text-sm leading-7">{m.body}</p></div>)}</div><div className="flex gap-2"><Textarea rows={2} placeholder="پیام خود را بنویسید..." value={reply} onChange={e => setReply(e.target.value)} disabled={busy || active.status === SupportTicketStatus.Closed || active.status === SupportTicketStatus.Resolved}/><Button className="shrink-0" onClick={() => void sendReply()} disabled={busy || reply.trim().length < 2 || active.status === SupportTicketStatus.Closed || active.status === SupportTicketStatus.Resolved}><Send className="size-4"/></Button></div></div>}</CardContent></Card></div>
  </div>
}
