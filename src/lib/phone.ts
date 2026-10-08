export const PHONE_PATTERN = /^\+?\d{7,15}$/

export const PHONE_MESSAGE = 'Enter a valid phone number, e.g. 0917 123 4567.'

/** Strips spaces, dashes, dots and brackets, matching what the API stores. */
export const normalizePhone = (phone: string) =>
  phone.replace(/[\s\-().]+/g, '')

export const isValidPhone = (phone: string) =>
  PHONE_PATTERN.test(normalizePhone(phone))
