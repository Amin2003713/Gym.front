/**
 * Converts Persian and Arabic digits in a string to English digits.
 *
 * @param input - A string possibly containing Persian/Arabic digits.
 * @returns The string with all digits converted to English.
 */
export function toEnglishDigits(input: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹'
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩'

  return input.replace(/[\u06F0-\u06F9\u0660-\u0669]/g, (char) => {
    const index = persianDigits.indexOf(char)
    if (index !== -1) return String(index)

    const arabicIndex = arabicDigits.indexOf(char)
    return arabicIndex !== -1 ? String(arabicIndex) : char
  })
}

/**
 * Formats a number with comma separators for thousands.
 *
 * @param value - A number or string that represents a number.
 * @returns The formatted number as a string with commas.
 */
export function formatNumberWithCommas(value: number | string): string {
  const number =
    typeof value === 'string' ? Number(toEnglishDigits(value)) : value

  if (isNaN(number)) return ''

  return number.toLocaleString('en-US')
}
