import { describe, expect, it } from 'vitest'
import {
  hasAnalyticsConsent,
  isBannerVisible,
  normalizeCookieConsentStatus,
} from '../../utils/cookie-consent'

describe('cookie consent utils', () => {
  it('normalizes unknown values to undecided', () => {
    expect(normalizeCookieConsentStatus(undefined)).toBe('undecided')
    expect(normalizeCookieConsentStatus(null)).toBe('undecided')
    expect(normalizeCookieConsentStatus('other')).toBe('undecided')
  })

  it('keeps accepted/declined values', () => {
    expect(normalizeCookieConsentStatus('accepted')).toBe('accepted')
    expect(normalizeCookieConsentStatus('declined')).toBe('declined')
  })

  it('shows banner only when undecided', () => {
    expect(isBannerVisible('undecided')).toBe(true)
    expect(isBannerVisible('accepted')).toBe(false)
    expect(isBannerVisible('declined')).toBe(false)
  })

  it('analytics consent is true only when accepted', () => {
    expect(hasAnalyticsConsent('accepted')).toBe(true)
    expect(hasAnalyticsConsent('declined')).toBe(false)
    expect(hasAnalyticsConsent('undecided')).toBe(false)
  })
})
