import { createError } from 'h3'

const MAX_RANGE_DAYS = 366

/**
 * Parse and validate a from/to date range from query parameters.
 * Returns UTC day boundaries (from = start of day, to = end of day).
 */
export function parseDateRange(fromStr: string | undefined, toStr: string | undefined) {
  if (!fromStr || !toStr) {
    throw createError({ statusCode: 400, statusMessage: 'Both "from" and "to" query parameters are required (YYYY-MM-DD).' })
  }

  const fromDate = new Date(`${fromStr}T00:00:00.000Z`)
  const toDate = new Date(`${toStr}T23:59:59.999Z`)

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date format. Use YYYY-MM-DD.' })
  }

  if (fromDate > toDate) {
    throw createError({ statusCode: 400, statusMessage: '"from" must be before or equal to "to".' })
  }

  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays > MAX_RANGE_DAYS) {
    throw createError({ statusCode: 400, statusMessage: `Date range must not exceed ${MAX_RANGE_DAYS} days.` })
  }

  return { from: fromDate, to: toDate }
}

/**
 * Escape a string value for safe CSV output (RFC 4180).
 */
export function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Build a CSV string from headers and rows.
 */
export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsvField).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(','))
  }
  return lines.join('\r\n') + '\r\n'
}
