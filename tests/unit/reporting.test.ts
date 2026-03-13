import { describe, it, expect } from 'vitest'
import { parseDateRange, escapeCsvField, toCsv } from '../../server/utils/reporting'

describe('reporting utils', () => {
  it('requires both from and to values', () => {
    expect(() => parseDateRange(undefined, '2026-03-10')).toThrow('Both "from" and "to"')
    expect(() => parseDateRange('2026-03-01', undefined)).toThrow('Both "from" and "to"')
  })

  it('parses valid date range with UTC boundaries', () => {
    const { from, to } = parseDateRange('2026-03-01', '2026-03-10')
    expect(from.toISOString()).toBe('2026-03-01T00:00:00.000Z')
    expect(to.toISOString()).toBe('2026-03-10T23:59:59.999Z')
  })

  it('throws on invalid date format', () => {
    expect(() => parseDateRange('not-a-date', '2026-03-10')).toThrow('Invalid date format')
  })

  it('throws on invalid order', () => {
    expect(() => parseDateRange('2026-03-11', '2026-03-10')).toThrow()
  })

  it('throws when date range exceeds max window', () => {
    expect(() => parseDateRange('2026-01-01', '2027-01-03')).toThrow('must not exceed 366 days')
  })

  it('escapes CSV values safely', () => {
    expect(escapeCsvField('plain')).toBe('plain')
    expect(escapeCsvField('a,b')).toBe('"a,b"')
    expect(escapeCsvField('a"b')).toBe('"a""b"')
  })

  it('builds csv with CRLF and trailing newline', () => {
    const csv = toCsv(['name', 'note'], [['Mason', 'hello,world']])
    expect(csv).toBe('name,note\r\nMason,"hello,world"\r\n')
  })
})
