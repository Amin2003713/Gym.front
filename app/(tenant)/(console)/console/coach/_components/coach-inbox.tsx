'use client'

import { Inbox, Loader2, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { listCoachConversations } from '@/app/(tenant)/_api/coach-api'
import { useGetUsers } from '@/app/(tenant)/_api/use-get-users'
import { CoachChat } from '@/app/(tenant)/_components/coach/coach-chat'
import {
  CoachConversationStatus,
  type CoachConversationSummary,
} from '@/app/(tenant)/_model/coach'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const activityFmt = new Intl.DateTimeFormat('fa-IR', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * The coach queue: every human conversation of the gym, open ones first. AI threads stay private to
 * the member, so they never show up here. Replies are the same chat component the member uses.
 */
export function CoachInbox() {
  const [threads, setThreads] = useState<CoachConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { users } = useGetUsers()

  const names = useMemo(
    () => new Map(users.map((user) => [user.id, `${user.firstName} ${user.lastName}`.trim()])),
    [users],
  )

  useEffect(() => {
    let cancelled = false

    void listCoachConversations()
      .then((rows) => {
        if (cancelled) return

        const sorted = [...rows].sort((a, b) => {
          if (a.status !== b.status) return a.status - b.status
          return (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')
        })

        setThreads(sorted)
        setActiveId((current) => current ?? sorted[0]?.id ?? null)
      })
      .catch((error: unknown) => {
        if (!cancelled)
          toast.error('دریافت صف مربی ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const open = threads.filter((thread) => thread.status === CoachConversationStatus.Open)

  return (
    <div className="space-y-4 p-3 sm:p-5 lg:p-7">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">صف مربی</h1>
        <p className="text-muted-foreground text-sm leading-6">
          درخواست‌های انسانی اعضا؛ بازها اول. گفتگوهای هوش مصنوعی خصوصی عضو می‌ماند.
        </p>
      </header>

      {loading ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
          <Loader2 className="me-1 size-4 animate-spin" />
          در حال بارگیری…
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-2 rounded-2xl border border-dashed p-10 text-center">
          <Inbox className="text-muted-foreground size-7" />
          <p className="text-sm font-bold">صف خالی است</p>
          <p className="text-muted-foreground max-w-sm text-xs leading-6">
            وقتی عضوی درخواست بازبینی برنامه بفرستد، همین‌جا ظاهر می‌شود.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[20rem_1fr]">
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
            {threads.map((thread) => {
              const isOpen = thread.status === CoachConversationStatus.Open

              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(thread.id)}
                    className={`w-full px-4 py-3 text-right transition-colors ${
                      activeId === thread.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {names.get(thread.memberUserId) ?? 'عضو'}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isOpen
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isOpen ? 'باز' : 'بسته'}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-xs">{thread.title}</p>
                    <p className="text-muted-foreground/70 mt-1 flex items-center gap-1 text-[10px]">
                      <MessageCircle className="size-3" />
                      {fa(thread.messageCount)}
                      {thread.lastMessageAt && (
                        <span>· {activityFmt.format(new Date(thread.lastMessageAt))}</span>
                      )}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>

          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {activeId ? (
              <CoachChat conversationId={activeId} staff />
            ) : (
              <div className="text-muted-foreground flex h-64 items-center justify-center text-xs">
                یک گفتگو را انتخاب کن.
              </div>
            )}
          </section>
        </div>
      )}

      {open.length > 0 && (
        <p className="text-muted-foreground text-xs">{fa(open.length)} درخواست باز منتظر پاسخ است.</p>
      )}
    </div>
  )
}
