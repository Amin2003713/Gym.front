import { format, isValid } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { format as formatJalali } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'

// Default formats
const DATE_FORMATS = {
  gregorian: {
    default: 'yyyy-MM-dd',
    dateTime: 'yyyy-MM-dd HH:mm',
    timeOnly: 'HH:mm',
    full: 'yyyy-MM-dd HH:mm:ss',
  },
  jalali: {
    default: 'yyyy/MM/dd',
    dateTime: 'yyyy/MM/dd HH:mm',
    timeOnly: 'HH:mm',
    full: 'yyyy/MM/dd HH:mm:ss',
  },
} as const

// Convert to Gregorian date
const formatGregorianDate = (
  date?: string | Date | null,
  formatPattern: string = DATE_FORMATS.gregorian.default,
) => {
  if (!date) return null
  const formattedDate = new Date(date)
  if (!isValid(formattedDate)) return null
  return format(formattedDate, formatPattern, { locale: enUS })
}

// Convert to Jalali date
const formatJalaliDate = (
  date: string | Date | undefined,
  formatPattern: string = DATE_FORMATS.jalali.default,
) => {
  if (!date) return null
  return formatJalali(new Date(date), formatPattern, { locale: faIR })
}

export { DATE_FORMATS, formatJalaliDate, formatGregorianDate }
