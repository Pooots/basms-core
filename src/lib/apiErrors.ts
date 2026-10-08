import axios from 'axios'

export type FieldErrors = Partial<Record<string, string>>

/** First message per field from a Laravel 422 response. */
export function getFieldErrors(error: unknown): FieldErrors {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return {}
  const errors = (
    error.response.data as { errors?: Record<string, Array<string>> }
  ).errors
  if (!errors) return {}
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [field, messages[0]]),
  )
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return 'Cannot reach the server. Make sure the BASMS API is running.'
    const message = (error.response.data as { message?: string } | undefined)
      ?.message
    if (message) return message
  }
  return fallback
}
