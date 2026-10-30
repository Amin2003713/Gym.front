import { createData, readData, updateData } from '@/core/http-service'

import type {
  CoachConversation,
  CoachConversationKind,
  CoachConversationStatus,
  CoachConversationSummary,
  CoachMessage,
} from '../_model/coach'

const route = 'coach/conversations'

/** Threads of the caller; staff receive the human queue instead of their own AI chats. */
export const listCoachConversations = () =>
  readData<CoachConversationSummary[]>(route)

export const getCoachConversation = (id: string) =>
  readData<CoachConversation>(`${route}/${encodeURIComponent(id)}`)

/** Starts a thread; the first message is the request itself. */
export const createCoachConversation = (kind: CoachConversationKind, message: string) =>
  createData<{ kind: CoachConversationKind; message: string }, CoachConversation>(route, {
    kind,
    message,
  })

export const sendCoachMessage = (id: string, body: string) =>
  createData<{ body: string }, CoachMessage[]>(
    `${route}/${encodeURIComponent(id)}/messages`,
    { body },
  )

export const setCoachConversationStatus = (id: string, status: CoachConversationStatus) =>
  updateData<CoachConversationStatus, CoachConversationSummary>(
    `${route}/${encodeURIComponent(id)}/status`,
    status,
  )
