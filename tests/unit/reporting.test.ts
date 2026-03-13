import { describe, it, expect } from 'vitest'
import { parseDateRange, escapeCsvField, toCsv } from '../../server/utils/reporting'

describe('reporting utils', () => {
  it('parses valid date range with UTC boundaries', () => {
    const { from, to } = parseDateRange('2026-03-01', '2026-03-10')
    expect(from.toISOString()).toBe('2026-03-01T00:00:00.000Z')
    expect(to.toISOString()).toBe('2026-03-10T23:59:59.999Z')
  })

  it('throws on invalid order', () => {
    expect(() => parseDateRange('2026-03-11', '2026-03-10')).toThrow()
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
