/** Contracts of /coach (Application/Coach + CoachController). */

export enum CoachConversationKind {
  Ai = 0,
  Human = 1,
}

export enum CoachConversationStatus {
  Open = 0,
  Closed = 1,
}

export enum CoachMessageSender {
  Member = 0,
  Coach = 1,
  Ai = 2,
}

export interface CoachMessage {
  id: string
  sender: CoachMessageSender
  senderUserId: string | null
  body: string
  createdAt: string
}

export interface CoachConversationSummary {
  id: string
  kind: CoachConversationKind
  status: CoachConversationStatus
  memberUserId: string
  coachUserId: string | null
  title: string
  lastMessageAt: string | null
  messageCount: number
}

export interface CoachConversation extends Omit<CoachConversationSummary, 'messageCount'> {
  messages: CoachMessage[]
}

export const COACH_KIND_COPY: Record<CoachConversationKind, { label: string; hint: string }> = {
  [CoachConversationKind.Ai]: {
    label: 'مربی هوشمند',
    hint: 'جواب فوری از روی داده‌های خودت — بدون معطلی',
  },
  [CoachConversationKind.Human]: {
    label: 'درخواست از مربی',
    hint: 'به صف مربیان باشگاه می‌رود و همان‌جا جواب می‌گیری',
  },
}
