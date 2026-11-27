import {
  DEFAULT_VOLUME,
  PREFERENCES_STORAGE_KEY,
  parsePreferences,
  type PlayerPreferences,
  type StationId,
} from '@infinite-radio/shared'

/** Default preferences for a first visit. */
export function defaultPreferences(): PlayerPreferences {
  return {
    favoriteStationIds: [],
    lastStationId: 'weightless',
    lastMoodByStation: {},
    parametersByStation: {},
    volume: DEFAULT_VOLUME,
    muted: false,
    reducedMotion: false,
    visualizerEnabled: true,
    defaultStationId: 'weightless',
  }
}

/**
 * Load persisted preferences, validating and falling back per-field.
 * Corrupted or outdated localStorage content never crashes the app.
 */
export function loadPreferences(): PlayerPreferences {
  if (typeof localStorage === 'undefined') return defaultPreferences()
  try {
    return parsePreferences(localStorage.getItem(PREFERENCES_STORAGE_KEY)) ?? defaultPreferences()
  } catch {
    return defaultPreferences()
  }
}

export function savePreferences(preferences: PlayerPreferences): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // Storage full or blocked: preferences simply won't persist.
  }
}

export function clearPreferences(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY)
  } catch {
    // Ignore.
  }
}

export type { StationId }
