export enum SupportTicketStatus { Open = 0, InProgress = 1, WaitingForMember = 2, Resolved = 3, Closed = 4 }
export enum SupportTicketPriority { Normal = 0, High = 1, Urgent = 2 }
export interface SupportTicketMessage { id: string; senderUserId: string; isStaffReply: boolean; body: string; createdAt: string }
export interface SupportTicketListItem { id: string; subject: string; category: string; status: SupportTicketStatus; priority: SupportTicketPriority; memberUserId: string; assignedToUserId?: string | null; createdAt: string; lastActivityAt: string; messageCount: number }
export interface SupportTicket extends Omit<SupportTicketListItem, 'messageCount'> { messages: SupportTicketMessage[] }
