import type { LocationQuery, LocationQueryValue } from 'vue-router'

type QueryScalar = string | null | undefined

const readQueryValue = (value: LocationQueryValue | LocationQueryValue[] | undefined): QueryScalar => {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export const parseQueryString = (
  query: LocationQuery,
  key: string,
  fallback: string | null = null
): string | null => {
  const raw = readQueryValue(query[key])

  if (raw === null || raw === undefined || raw === '') {
    return fallback
  }

  return String(raw)
}

export const parseQueryNumber = (
  query: LocationQuery,
  key: string,
  fallback: number | null = null
): number | null => {
  const raw = readQueryValue(query[key])

  if (raw === null || raw === undefined || raw === '') {
    return fallback
  }

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const parseQueryPage = (query: LocationQuery, fallback = 1): number => {
  const page = parseQueryNumber(query, 'page', fallback)
  return page && page > 0 ? page : fallback
}

export const parseQueryBoolean = (
  query: LocationQuery,
  key: string,
  fallback: boolean | null = null
): boolean | null => {
  const raw = readQueryValue(query[key])

  if (raw === null || raw === undefined || raw === '') {
    return fallback
  }

  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false

  return fallback
}

export const setQueryString = (
  query: Record<string, string>,
  key: string,
  value: string | null | undefined
) => {
  if (value === null || value === undefined || value === '') {
    return
  }

  query[key] = value
}

export const setQueryNumber = (
  query: Record<string, string>,
  key: string,
  value: number | null | undefined
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return
  }

  query[key] = String(value)
}

export const setQueryBoolean = (
  query: Record<string, string>,
  key: string,
  value: boolean | null | undefined
) => {
  if (value === null || value === undefined) {
    return
  }

  query[key] = value ? 'true' : 'false'
}

export const formatDateQuery = (value: string | Date | null | undefined): string | null => {
  if (!value) return null

  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return String(value).slice(0, 10)
}

export const parseDateQuery = (query: LocationQuery, key: string): string | null => {
  return parseQueryString(query, key, null)
}

export const setDateQuery = (
  query: Record<string, string>,
  key: string,
  value: string | Date | null | undefined
) => {
  const formatted = formatDateQuery(value)
  setQueryString(query, key, formatted)
}

export const filtersChanged = (left: Record<string, unknown>, right: Record<string, unknown>) => {
  return JSON.stringify(left) !== JSON.stringify(right)
}
