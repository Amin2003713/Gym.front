import { addDays, isAfter, parseISO, subDays } from 'date-fns'
import { isValid as isValidDate } from 'date-fns/isValid'

import { formatGregorianDate } from '@/utils/date'

type ValidInputDate = string | null | undefined

const safeParse = (s?: string | null) => {
  if (!s) return null
  const d = parseISO(s)
  return isValidDate(d) ? d : null
}

/**
 * - Normalizes missing/invalid values using these rules:
 *    * none -> to=today, from=to-6d
 *    * only to -> from=to-6d
 *    * only from -> to=from+6d
 * - If from > to, fixes to a valid ascending range
 * **/
export function normalizeDateRange(
  firstDate: ValidInputDate,
  secondDate: ValidInputDate,
) {
  const todayISO = formatGregorianDate(new Date())!
  let from = safeParse(firstDate)
  let to = safeParse(secondDate)

  if (!from && !to) {
    to = parseISO(todayISO)
    from = subDays(to, 6)
  } else if (!from && to) {
    from = subDays(to, 6)
  } else if (from && !to) {
    to = addDays(from, 6)
  }

  // At this point both should exist; as an extra guard:
  if (!from) from = parseISO(todayISO)
  if (!to) to = parseISO(todayISO)

  // Ensure ascending order
  if (isAfter(from, to)) {
    // Choose the minimal change: make 'to' equal to 'from'
    to = from
  }

  return {
    fromISO: formatGregorianDate(from)!,
    toISO: formatGregorianDate(to)!,
  }
}
