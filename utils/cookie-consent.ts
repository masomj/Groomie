export type CookieConsentStatus = 'accepted' | 'declined' | 'undecided'

export function normalizeCookieConsentStatus(value: string | undefined | null): CookieConsentStatus {
  if (value === 'accepted' || value === 'declined') return value
  return 'undecided'
}

export function isBannerVisible(status: CookieConsentStatus): boolean {
  return status === 'undecided'
}

export function hasAnalyticsConsent(status: CookieConsentStatus): boolean {
  return status === 'accepted'
}
