export function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (value == null) return fallback
  return String(value)
}

export function asLowerText(value: unknown): string {
  return asText(value).toLowerCase()
}

export function asFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export function formatAmount(value: unknown): string {
  return `$${asFiniteNumber(value).toLocaleString()}`
}

export function compareDateDesc(a: unknown, b: unknown): number {
  return asText(b).localeCompare(asText(a))
}

export function formatDonationTypeLabel(raw: unknown): string {
  const normalized = asText(raw, 'Unknown')
  const spaced = normalized.replace(/([a-z])([A-Z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

export function normalizeSupportKey(raw: string): string {
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}
