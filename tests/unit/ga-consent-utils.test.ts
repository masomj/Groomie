import { describe, expect, it } from 'vitest'
import { getGaScriptSrc, isAnalyticsCookieName } from '../../utils/ga-consent'

describe('ga consent utils', () => {
  it('builds GA script URL from measurement ID', () => {
    expect(getGaScriptSrc('G-TEST123')).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123')
  })

  it('identifies analytics cookie names', () => {
    expect(isAnalyticsCookieName('_ga')).toBe(true)
    expect(isAnalyticsCookieName('_ga_ABC')).toBe(true)
    expect(isAnalyticsCookieName('_gid')).toBe(true)
    expect(isAnalyticsCookieName('session')).toBe(false)
  })
})
