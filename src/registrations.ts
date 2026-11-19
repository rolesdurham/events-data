import { SOURCES, type Filters, type Registration } from './types'

export function filterRegistrations(list: Registration[], filters: Filters): Registration[] {
  return list.filter(
    (r) => (!filters.city || r.city === filters.city) && (!filters.status || r.status === filters.status)
  )
}

export function computeStats(list: Registration[]) {
  const bySource = Object.fromEntries(SOURCES.map((s) => [s, 0])) as Record<string, number>
  for (const r of list) bySource[r.source] = (bySource[r.source] ?? 0) + 1
  return {
    total: list.length,
    checkedIn: list.filter((r) => r.status === 'Checked in').length,
    bySource,
  }
}

const CSV_COLUMNS = ['name', 'company', 'city', 'source', 'status'] as const
const CSV_HEADERS = ['Name', 'Company', 'City', 'Source', 'Status']

function csvCell(value: string): string {
  // Stop spreadsheet apps from running cell text as a formula.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(list: Registration[]): string {
  const lines = [CSV_HEADERS.join(',')]
  for (const r of list) lines.push(CSV_COLUMNS.map((col) => csvCell(r[col])).join(','))
  return lines.join('\r\n') + '\r\n'
}
