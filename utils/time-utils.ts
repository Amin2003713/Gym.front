/**
 * Time format utilities for TimePicker component
 */

import { parse, format, isValid } from 'date-fns'

export type TimeFormat = '12' | '24'

export interface TimeValue {
  hour: number
  minute: number
  period?: 'AM' | 'PM'
}

export function convertToTime(input: string) {
  const timeRegex = /^\d{2}:\d{2}$/
  const secondsRegex = /^\d{2}:\d{2}:\d{2}$/

  if (timeRegex.test(input)) {
    return input
  }
  if (secondsRegex.test(input)) {
    return input.substring(0, 5)
  }

  try {
    const parsedDate = parse(input, "yyyy-MM-dd'T'HH:mm:ss", new Date())
    if (isValid(parsedDate)) {
      return format(parsedDate, 'HH:mm')
    }
  } catch {
    return ''
  }
  return ''
}

/**
 * Validates if a time string is in valid format
 */
export function isValidTimeString(time: string, format: TimeFormat): boolean {
  const timeRegex =
    format === '12'
      ? /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i
      : /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/

  return timeRegex.test(time)
}

/**
 * Parses a time string into TimeValue object
 */
export function parseTimeString(
  time: string,
  format: TimeFormat,
): TimeValue | null {
  const formattedTime = convertToTime(time)
  if (!isValidTimeString(formattedTime, format)) {
    return null
  }

  if (format === '12') {
    const match = formattedTime.match(
      /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i,
    )
    if (!match) return null

    return {
      hour: Number.parseInt(match[1], 10),
      minute: Number.parseInt(match[2], 10),
      period: match[3].toUpperCase() as 'AM' | 'PM',
    }
  } else {
    const match = formattedTime.match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/)
    if (!match) return null

    return {
      hour: Number.parseInt(match[1], 10),
      minute: Number.parseInt(match[2], 10),
    }
  }
}

/**
 * Formats TimeValue object into a time string
 */
export function formatTimeValue(value: TimeValue, format: TimeFormat): string {
  const { hour, minute, period } = value

  if (format === '12') {
    const formattedHour = hour.toString().padStart(2, '0')
    const formattedMinute = minute.toString().padStart(2, '0')
    return `${formattedHour}:${formattedMinute} ${period || 'AM'}`
  } else {
    const formattedHour = hour.toString().padStart(2, '0')
    const formattedMinute = minute.toString().padStart(2, '0')
    return `${formattedHour}:${formattedMinute}`
  }
}

/**
 * Converts 12-hour format to 24-hour format
 */
export function convert12To24(hour: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hour === 12 ? 0 : hour
  } else {
    return hour === 12 ? 12 : hour + 12
  }
}

/**
 * Converts 24-hour format to 12-hour format
 */
export function convert24To12(hour: number): {
  hour: number
  period: 'AM' | 'PM'
} {
  if (hour === 0) {
    return { hour: 12, period: 'AM' }
  } else if (hour < 12) {
    return { hour, period: 'AM' }
  } else if (hour === 12) {
    return { hour: 12, period: 'PM' }
  } else {
    return { hour: hour - 12, period: 'PM' }
  }
}

/**
 * Generates array of hours based on format
 */
export function generateHours(format: TimeFormat): number[] {
  if (format === '12') {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  } else {
    return Array.from({ length: 24 }, (_, i) => i)
  }
}

/**
 * Generates array of minutes (0-59)
 */
export function generateMinutes(): number[] {
  return Array.from({ length: 60 }, (_, i) => i)
}
