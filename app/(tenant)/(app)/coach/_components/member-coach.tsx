'use client'

import { Bot, Loader2, MessageSquarePlus, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  createCoachConversation,
  listCoachConversations,
} from '@/app/(tenant)/_api/coach-api'
import { CoachChat } from '@/app/(tenant)/_components/coach/coach-chat'
import {
  COACH_KIND_COPY,
  CoachConversationKind,
  type CoachConversationSummary,
} from '@/app/(tenant)/_model/coach'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

const fa = (value: number) => (value ?? 0).toLocaleString('fa-IR')

/**
 * The member's coach screen: two products behind one tab switch. The assistant answers immediately;
 * the human request lands in the gym's queue. A member can keep several threads, so the newest of the
 * selected kind opens by default.
 */
export function MemberCoach() {
  const [kind, setKind] = useState<CoachConversationKind>(CoachConversationKind.Ai)
  const [threads, setThreads] = useState<CoachConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const rows = await listCoachConversations()

        if (cancelled) return

        setThreads(rows)
        setActiveId((current) => {
          const visible = rows.filter((row) => row.kind === kind)
          return visible.some((row) => row.id === current) ? current : (visible[0]?.id ?? null)
        })
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت گفتگوها ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [kind, version])

  const visible = threads.filter((row) => row.kind === kind)

  const start = async () => {
    const message = draft.trim()
    if (!message) return

    setStarting(true)

    try {
      const created = await createCoachConversation(kind, message)
      setDraft('')
      setThreads((current) => [
        {
          ...created,
          messageCount: created.messages.length,
        },
        ...current,
      ])
      setActiveId(created.id)
      setVersion((current) => current + 1)
    } catch (error) {
      toast.error('ارسال پیام ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">مربی</h1>
        <p className="text-muted-foreground text-sm leading-6">
          سؤال تمرینی داری؟ مربی هوشمند با داده‌های خودت جواب می‌دهد؛ برای بازبینی برنامه هم می‌توانی
          از مربی باشگاه بخواهی.
        </p>
      </header>

      <div className="bg-muted flex rounded-full p-1">
        {[CoachConversationKind.Ai, CoachConversationKind.Human].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            aria-pressed={kind === value}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
              kind === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {value === CoachConversationKind.Ai ? (
              <Bot className="size-3.5" />
            ) : (
              <UserRound className="size-3.5" />
            )}
            {COACH_KIND_COPY[value].label}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs leading-5">{COACH_KIND_COPY[kind].hint}</p>

      {loading ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center text-xs">
          <Loader2 className="me-1 size-4 animate-spin" />
          در حال بارگیری…
        </div>
      ) : (
        <>
          {visible.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {visible.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setActiveId(thread.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeId === thread.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {thread.title.slice(0, 24) || 'گفتگو'}
                  <span className="ms-1 opacity-60">{fa(thread.messageCount)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="text-muted-foreground hover:bg-muted flex shrink-0 items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-xs font-semibold"
              >
                <MessageSquarePlus className="size-3.5" />
                جدید
              </button>
            </div>
          )}

          {activeId ? (
            <section className="bg-card overflow-hidden rounded-2xl border shadow-sm">
              <CoachChat conversationId={activeId} />
            </section>
          ) : (
            <section className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm">
              <h2 className="font-bold">
                {kind === CoachConversationKind.Ai ? 'از مربی هوشمند بپرس' : 'برای مربی بنویس'}
              </h2>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={
                  kind === CoachConversationKind.Ai
                    ? 'مثلاً: این هفته حجم پا کم بود؟ چه چیزی به برنامه اضافه کنم؟'
                    : 'مثلاً: هدفم افزایش عضله است؛ برنامه فعلی‌ام را بازبینی می‌کنید؟'
                }
                className="border-input bg-background focus-visible:ring-ring w-full rounded-xl border p-3 text-sm leading-6 outline-none focus-visible:ring-2"
              />
              <Button onClick={() => void start()} disabled={starting || !draft.trim()}>
                {starting ? 'در حال ارسال…' : 'شروع گفتگو'}
              </Button>
            </section>
          )}
        </>
      )}
    </div>
  )
}
