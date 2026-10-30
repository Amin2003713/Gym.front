'use client'

import { Bot, Loader2, Send, User, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  getCoachConversation,
  sendCoachMessage,
  setCoachConversationStatus,
} from '@/app/(tenant)/_api/coach-api'
import {
  CoachConversationStatus,
  CoachMessageSender,
  type CoachConversation,
  type CoachMessage,
} from '@/app/(tenant)/_model/coach'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

const timeFmt = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' })

/**
 * One thread, with polling every 10 seconds while it is open. Polling is deliberate: the app has no
 * realtime transport yet, and a coach reply appearing within a few seconds is enough for this flow.
 */
export function CoachChat({
  conversationId,
  staff = false,
  onClosed,
}: {
  conversationId: string
  staff?: boolean
  onClosed?: () => void
}) {
  const [conversation, setConversation] = useState<CoachConversation | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const loaded = await getCoachConversation(conversationId)
        if (!cancelled) setConversation(loaded)
      } catch (error) {
        if (!cancelled)
          toast.error('دریافت گفتگو ناموفق بود', {
            description: error instanceof Error ? error.message : undefined,
          })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const timer = window.setInterval(() => void load(), 10_000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [conversation?.messages.length])

  const send = async () => {
    const text = body.trim()
    if (!text) return

    setSending(true)

    try {
      const created = await sendCoachMessage(conversationId, text)
      setBody('')
      setConversation((current) =>
        current ? { ...current, messages: [...current.messages, ...created] } : current,
      )
    } catch (error) {
      toast.error('ارسال پیام ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSending(false)
    }
  }

  const toggleStatus = async () => {
    if (!conversation) return

    try {
      const next =
        conversation.status === CoachConversationStatus.Open
          ? CoachConversationStatus.Closed
          : CoachConversationStatus.Open

      await setCoachConversationStatus(conversationId, next)
      setConversation({ ...conversation, status: next })

      if (next === CoachConversationStatus.Closed) onClosed?.()
    } catch (error) {
      toast.error('تغییر وضعیت ناموفق بود', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-xs">
        <Loader2 className="me-1 size-4 animate-spin" />
        در حال بارگیری گفتگو…
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-xs">
        این گفتگو در دسترس نیست.
      </div>
    )
  }

  const closed = conversation.status === CoachConversationStatus.Closed

  return (
    <div className="flex h-[28rem] flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <p className="truncate text-xs font-semibold">{conversation.title}</p>
        <button
          type="button"
          onClick={() => void toggleStatus()}
          className="text-muted-foreground hover:text-foreground shrink-0 text-[11px] font-semibold"
        >
          {closed ? 'بازگشایی' : 'بستن گفتگو'}
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
        {conversation.messages.map((message) => (
          <Bubble key={message.id} message={message} staff={staff} />
        ))}
        <div ref={bottomRef} />
      </div>

      {closed ? (
        <p className="text-muted-foreground border-t px-4 py-3 text-center text-[11px]">
          این گفتگو بسته شده است.
        </p>
      ) : (
        <form
          className="flex items-center gap-2 border-t px-3 py-2.5"
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={staff ? 'پاسخ به عضو…' : 'پیامت را بنویس…'}
            aria-label="متن پیام"
            maxLength={2000}
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-full border px-4 text-sm outline-none focus-visible:ring-2"
          />
          <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label="ارسال">
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      )}
    </div>
  )
}

function Bubble({ message, staff }: { message: CoachMessage; staff: boolean }) {
  // A message is "mine" when it came from the side currently using this chat.
  const mine =
    message.sender === CoachMessageSender.Ai
      ? !staff
      : staff
        ? message.sender === CoachMessageSender.Coach
        : message.sender === CoachMessageSender.Member

  const Icon =
    message.sender === CoachMessageSender.Ai
      ? Bot
      : message.sender === CoachMessageSender.Coach
        ? UserRound
        : User

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <div className="mb-0.5 flex items-center gap-1 text-[10px] opacity-70">
          <Icon className="size-3" />
          {message.sender === CoachMessageSender.Ai
            ? 'مربی هوشمند'
            : message.sender === CoachMessageSender.Coach
              ? 'مربی'
              : 'عضو'}
          <span>·</span>
          <span>{timeFmt.format(new Date(message.createdAt))}</span>
        </div>
        <p className="whitespace-pre-line">{message.body}</p>
      </div>
    </div>
  )
}
