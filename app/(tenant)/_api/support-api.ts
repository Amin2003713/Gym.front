import { createData, readData, updateData } from '@/core/http-service'
import type { SupportTicket, SupportTicketListItem } from '../_model/support.types'
import type { SupportTicketPriority, SupportTicketStatus } from '../_model/support.types'
const BASE = 'support/tickets'
export const listSupportTickets = (status?: SupportTicketStatus) => readData<SupportTicketListItem[]>(`${BASE}${status == null ? '' : `?status=${status}`}`)
export const getSupportTicket = (id: string) => readData<SupportTicket>(`${BASE}/${encodeURIComponent(id)}`)
export const createSupportTicket = (payload: { subject: string; category: string; message: string }) => createData<typeof payload, SupportTicket>(BASE, payload)
export const replySupportTicket = (id: string, message: string) => createData<{ message: string }, SupportTicket>(`${BASE}/${encodeURIComponent(id)}/messages`, { message })
export const setSupportTicketStatus = (id: string, status: SupportTicketStatus, priority?: SupportTicketPriority) => updateData<{ status: SupportTicketStatus; priority?: SupportTicketPriority }, SupportTicketListItem>(`${BASE}/${encodeURIComponent(id)}/status`, { status, priority })
