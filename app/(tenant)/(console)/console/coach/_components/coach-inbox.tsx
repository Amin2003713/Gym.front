'use client'

import { Inbox, Loader2, MessageCircle, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { listCoachQueue } from '@/app/(tenant)/console/_api/coach-queue-api'
import { CoachChat } from '@/app/(tenant)/_components/coach/coach-chat'
import {
  CoachConversationStatus,
  type CoachConversationSummary,
} from '@/app/(tenant)/_model/coach'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

const activityFmt = new Intl.DateTimeFormat('fa-IR', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Staff-facing coach queue. The API already limits staff to human requests, so this screen
 * is the gym's inbox: open requests first, newest activity next. The member name comes with
 * each row (no extra users request), and the list refreshes while the page is open.
 */
export function CoachInbox() {
  const [threads, setThreads] = useState<CoachConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true)

    try {
      const rows = await listCoachQueue()
      const sorted = [...rows].sort((a, b) => {
        const openA = a.status === CoachConversationStatus.Open ? 0 : 1
        const openB = b.status === CoachConversationStatus.Open ? 0 : 1
        if (openA !== openB) return openA - openB
        return (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')
      })

      setThreads(sorted)
      // Keep the selection when it still exists; otherwise open the first request.
      setActiveId((current) =>
        current && sorted.some((row) => row.id === current)
          ? current
          : (sorted.find((row) => row.status === CoachConversationStatus.Open)?.id ??
            sorted[0]?.id ??
            null),
      )
    } catch (error) {
      toast.error('دریافت صف مربی ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // A request that arrives while the coach is on the page should not need a manual refresh.
  useEffect(() => {
    const timer = window.setInterval(() => void load(), 20_000)
    return () => window.clearInterval(timer)
  }, [load])

  const openCount = useMemo(
    () =>
      threads.filter((thread) => thread.status === CoachConversationStatus.Open)
        .length,
    [threads],
  )

  return (
    <div className="space-y-4" dir="rtl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">صف مربی</h1>
          <p className="text-muted-foreground text-sm leading-6">
            درخواست‌های انسانی اعضا؛ بازها اول. گفتگوهای هوش مصنوعی خصوصی عضو می‌ماند.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
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
                    aria-current={activeId === thread.id}
                    className={`w-full px-4 py-3 text-right transition-colors ${
                      activeId === thread.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {thread.memberName || 'عضو'}
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
                    <p className="text-muted-foreground mt-1 truncate text-xs">
                      {thread.title}
                    </p>
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
              <CoachChat
                key={activeId}
                conversationId={activeId}
                staff
                onClosed={() => void load()}
              />
            ) : (
              <div className="text-muted-foreground flex h-64 items-center justify-center text-xs">
                یک گفتگو را انتخاب کن.
              </div>
            )}
          </section>
        </div>
      )}

      {openCount > 0 && (
        <p className="text-muted-foreground text-xs">
          {fa(openCount)} درخواست باز منتظر پاسخ است.
        </p>
      )}
    </div>
  )
}
