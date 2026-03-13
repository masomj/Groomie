import {
  hasAnalyticsConsent,
  isBannerVisible,
  normalizeCookieConsentStatus,
  type CookieConsentStatus,
} from '~/utils/cookie-consent'

const COOKIE_NAME = 'cookie_consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export function useCookieConsent() {
  const consentCookie = useCookie<CookieConsentStatus | undefined>(COOKIE_NAME, {
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    default: () => 'undecided',
  })

  const consentStatus = computed<CookieConsentStatus>(() => {
    return normalizeCookieConsentStatus(consentCookie.value)
  })

  const hasConsented = computed(() => hasAnalyticsConsent(consentStatus.value))
  const bannerVisible = computed(() => isBannerVisible(consentStatus.value))

  function acceptCookies() {
    consentCookie.value = 'accepted'
  }

  function declineCookies() {
    consentCookie.value = 'declined'
  }

  function resetConsent() {
    consentCookie.value = 'undecided'
  }

  return {
    consentStatus,
    hasConsented,
    bannerVisible,
    acceptCookies,
    declineCookies,
    resetConsent,
  }
}
