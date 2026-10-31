import { readData } from '@/core/http-service'

import type { CoachConversationSummary } from '@/app/(tenant)/_model/coach'

/**
 * Staff queue.
 *
 * Semantically this is "the gym's human-request inbox". The backend already
 * filters staff requests to `Kind == Human`, but the console shell should call
 * its own helper so the failure path, cache boundary, and intent are explicit
 * and the member app keeps using its own "my conversations" flow.
 */
export const listCoachQueue = () =>
  readData<CoachConversationSummary[]>('coach/conversations')
