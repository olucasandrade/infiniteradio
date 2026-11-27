import type { StationId } from '@infinite-radio/shared'
import { PREFERENCES_STORAGE_KEY, parsePreferences } from '@infinite-radio/shared'
import { create } from 'zustand'

import { clearPreferences, loadPreferences } from './persistence'
import { usePlayerStore } from './playerStore'

export interface SettingsState {
  reducedMotion: boolean
  visualizerEnabled: boolean
  defaultStationId: StationId
  setReducedMotion: (value: boolean) => void
  setVisualizerEnabled: (value: boolean) => void
  setDefaultStation: (stationId: StationId) => void
  /** Reset all persisted preferences to first-visit defaults. */
  resetPreferences: () => void
}

function hasStoredPreferences(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    return parsePreferences(localStorage.getItem(PREFERENCES_STORAGE_KEY)) !== null
  } catch {
    return false
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function initialSettings() {
  const stored = loadPreferences()
  return {
    // First visit follows the OS preference; returning visits use the
    // persisted choice.
    reducedMotion: hasStoredPreferences() ? stored.reducedMotion : stored.reducedMotion || prefersReducedMotion(),
    visualizerEnabled: stored.visualizerEnabled,
    defaultStationId: stored.defaultStationId,
  }
}

const initial = initialSettings()

export const useSettingsStore = create<SettingsState>()((set) => ({
  reducedMotion: initial.reducedMotion,
  visualizerEnabled: initial.visualizerEnabled,
  defaultStationId: initial.defaultStationId,
  setReducedMotion: (value) => set({ reducedMotion: value }),
  setVisualizerEnabled: (value) => set({ visualizerEnabled: value }),
  setDefaultStation: (stationId) => set({ defaultStationId: stationId }),
  resetPreferences: () => {
    clearPreferences()
    set({ reducedMotion: false, visualizerEnabled: true, defaultStationId: 'weightless' })
    usePlayerStore.setState({
      moodByStation: {},
      parametersByStation: {},
      volume: 0.8,
      muted: false,
      favoriteStationIds: [],
    })
  },
}))
