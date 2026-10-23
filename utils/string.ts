export const generateId = () => {
    return Math.random().toString(36).substring(2, 9) + " " + new Date().getTime();
}

export const padWithZero = <T extends number | string, U extends number>(
    number: T,
    width: U,
): string => {
    return number.toString().padStart(width, "0");
}

export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') // Allow Persian characters
    .replace(/(^-|-$)/g, '') // Remove leading/trailing hyphens
}

export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9\u0600-\u06FF-]+$/.test(slug)
}

export const encodeSlug = (slug: string): string => {
  return encodeURIComponent(slug)
}

export const decodeSlug = (encodedSlug: string): string => {
  return decodeURIComponent(encodedSlug)
}