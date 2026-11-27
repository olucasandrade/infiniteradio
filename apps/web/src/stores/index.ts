import type { PlayerPreferences } from '@infinite-radio/shared'

import { savePreferences } from './persistence'
import { usePlayerStore } from './playerStore'
import { useSettingsStore } from './settingsStore'

/**
 * Serialize the UI stores into the validated PlayerPreferences shape and
 * persist on every change. Audio objects are never part of this state.
 */
export function collectPreferences(): PlayerPreferences {
  const player = usePlayerStore.getState()
  const settings = useSettingsStore.getState()
  return {
    favoriteStationIds: player.favoriteStationIds,
    lastStationId: player.stationId,
    lastMoodByStation: player.moodByStation,
    parametersByStation: player.parametersByStation,
    volume: player.volume,
    muted: player.muted,
    reducedMotion: settings.reducedMotion,
    visualizerEnabled: settings.visualizerEnabled,
    defaultStationId: settings.defaultStationId,
  }
}

/**
 * Subscribe the persistence layer. Call once at app startup.
 * Returns an unsubscribe function.
 */
export function startPersistence(): () => void {
  const persist = () => savePreferences(collectPreferences())
  const unsubPlayer = usePlayerStore.subscribe(persist)
  const unsubSettings = useSettingsStore.subscribe(persist)
  persist()
  return () => {
    unsubPlayer()
    unsubSettings()
  }
}
