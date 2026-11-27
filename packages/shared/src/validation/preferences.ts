import { DEFAULT_VOLUME, MAX_VOLUME, MIN_VOLUME } from '../constants'
import type { PlayerPreferences } from '../types/player'
import { isStationId, type StationId } from '../types/station'
import { clamp } from '../utils/random'

export { clamp }

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validateStationIdArray(value: unknown): StationId[] | null {
  if (!Array.isArray(value)) return null
  const ids = value.filter(isStationId)
  return ids.length === value.length ? ids : null
}

function validateMoodMap(value: unknown): PlayerPreferences['lastMoodByStation'] | null {
  if (!isRecord(value)) return null
  const result: PlayerPreferences['lastMoodByStation'] = {}
  for (const [key, mood] of Object.entries(value)) {
    if (!isStationId(key) || typeof mood !== 'string') return null
    result[key] = mood
  }
  return result
}

function validateParameterMap(
  value: unknown,
): PlayerPreferences['parametersByStation'] | null {
  if (!isRecord(value)) return null
  const result: PlayerPreferences['parametersByStation'] = {}
  for (const [station, params] of Object.entries(value)) {
    if (!isStationId(station) || !isRecord(params)) return null
    const cleaned: Record<string, number> = {}
    for (const [key, paramValue] of Object.entries(params)) {
      if (!isFiniteNumber(paramValue)) return null
      cleaned[key] = clamp(paramValue, 0, 1)
    }
    result[station] = cleaned
  }
  return result
}

/**
 * Validate and normalize untrusted persisted data. Returns null when the
 * shape is unusable, so callers can fall back to defaults instead of
 * crashing on corrupted or outdated localStorage content.
 */
export function validatePreferences(raw: unknown): PlayerPreferences | null {
  if (!isRecord(raw)) return null

  const lastStationId = isStationId(raw.lastStationId) ? raw.lastStationId : null
  if (!lastStationId) return null

  const favorites = validateStationIdArray(raw.favoriteStationIds)
  const moods = validateMoodMap(raw.lastMoodByStation)
  const params = validateParameterMap(raw.parametersByStation)

  return {
    favoriteStationIds: favorites ?? [],
    lastStationId,
    lastMoodByStation: moods ?? {},
    parametersByStation: params ?? {},
    volume:
      isFiniteNumber(raw.volume) && raw.volume >= MIN_VOLUME && raw.volume <= MAX_VOLUME
        ? raw.volume
        : DEFAULT_VOLUME,
    muted: typeof raw.muted === 'boolean' ? raw.muted : false,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : false,
    visualizerEnabled:
      typeof raw.visualizerEnabled === 'boolean' ? raw.visualizerEnabled : true,
    defaultStationId: isStationId(raw.defaultStationId) ? raw.defaultStationId : lastStationId,
  }
}

export function parsePreferences(json: string | null): PlayerPreferences | null {
  if (json === null) return null
  try {
    return validatePreferences(JSON.parse(json))
  } catch {
    return null
  }
}
