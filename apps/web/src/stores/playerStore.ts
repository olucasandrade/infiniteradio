import type { PlaybackStatus, StationId } from '@infinite-radio/shared'
import { STATION_LIST, getStation, mergeMoodParameters } from '@infinite-radio/stations'
import { create } from 'zustand'

import { getEngine, onEngineStatus } from '../features/listening/engine'
import { startEpisodeClock, stopEpisodeClock } from '../features/listening/episodes'
import { isAudible } from '../features/listening/status'
import { loadPreferences } from './persistence'

export interface PlayerState {
  status: PlaybackStatus
  stationId: StationId
  moodByStation: Partial<Record<StationId, string>>
  /** Customization values per station, keyed by parameter id. */
  parametersByStation: Partial<Record<StationId, Record<string, number>>>
  volume: number
  muted: boolean
  favoriteStationIds: StationId[]

  play: () => Promise<void>
  pause: () => void
  togglePlay: () => Promise<void>
  selectStation: (stationId: StationId, options?: { autoplay?: boolean }) => Promise<void>
  nextStation: () => Promise<void>
  prevStation: () => Promise<void>
  setVolume: (volume: number) => void
  toggleMute: () => void
  setMood: (stationId: StationId, moodId: string) => void
  setParameter: (stationId: StationId, parameterId: string, value: number) => void
  toggleFavorite: (stationId: StationId) => void
}

const initialPreferences = loadPreferences()

function stationIndex(stationId: StationId): number {
  return STATION_LIST.findIndex((station) => station.id === stationId)
}

function stepStation(stationId: StationId, delta: number): StationId {
  const index = stationIndex(stationId)
  const next = (index + delta + STATION_LIST.length) % STATION_LIST.length
  return STATION_LIST[next]!.id
}

/** Push merged mood + customization parameters to the live engine. */
export function pushParameters(
  stationId: StationId,
  moodByStation: Partial<Record<StationId, string>>,
  parametersByStation: Partial<Record<StationId, Record<string, number>>>,
): void {
  const station = getStation(stationId)
  const moodId = moodByStation[stationId] ?? station.defaultMood
  getEngine().updateParameters(mergeMoodParameters(station, moodId, parametersByStation[stationId]))
}

export const usePlayerStore = create<PlayerState>()((set, get) => ({
  status: 'idle',
  stationId: initialPreferences.lastStationId,
  moodByStation: initialPreferences.lastMoodByStation,
  parametersByStation: initialPreferences.parametersByStation,
  volume: initialPreferences.volume,
  muted: initialPreferences.muted,
  favoriteStationIds: initialPreferences.favoriteStationIds,

  play: async () => {
    const engine = getEngine()
    const { stationId, moodByStation, parametersByStation, volume, muted } = get()
    // Creates the AudioContext; must run inside the user gesture.
    await engine.initialize()
    // Apply the current episode before switching so a fresh activation
    // starts on the episode's seed instead of crossfading to it.
    startEpisodeClock(stationId)
    if (engine.getCurrentStationId() !== stationId) {
      await engine.switchStation(stationId)
    }
    pushParameters(stationId, moodByStation, parametersByStation)
    engine.setMasterVolume(volume)
    engine.setMuted(muted)
    await engine.play()
  },

  pause: () => {
    stopEpisodeClock()
    getEngine().pause()
  },

  togglePlay: async () => {
    if (isAudible(get().status)) {
      get().pause()
    } else {
      await get().play()
    }
  },

  selectStation: async (stationId, options = {}) => {
    set({ stationId })
    const shouldPlay = options.autoplay || get().status === 'playing' || get().status === 'paused'
    if (!shouldPlay) return
    // play() initializes the engine (user gesture), switches when the
    // engine is on another station, and starts playback.
    await get().play()
  },

  nextStation: async () => {
    await get().selectStation(stepStation(get().stationId, 1), { autoplay: true })
  },

  prevStation: async () => {
    await get().selectStation(stepStation(get().stationId, -1), { autoplay: true })
  },

  setVolume: (volume) => {
    const clamped = Math.min(1, Math.max(0, volume))
    set({ volume: clamped })
    getEngine().setMasterVolume(clamped)
  },

  toggleMute: () => {
    const muted = !get().muted
    set({ muted })
    getEngine().setMuted(muted)
  },

  setMood: (stationId, moodId) => {
    const moodByStation = { ...get().moodByStation, [stationId]: moodId }
    set({ moodByStation })
    if (get().stationId === stationId) {
      pushParameters(stationId, moodByStation, get().parametersByStation)
    }
  },

  setParameter: (stationId, parameterId, value) => {
    const stationParams = { ...get().parametersByStation[stationId], [parameterId]: value }
    const parametersByStation = { ...get().parametersByStation, [stationId]: stationParams }
    set({ parametersByStation })
    if (get().stationId === stationId) {
      pushParameters(stationId, get().moodByStation, parametersByStation)
    }
  },

  toggleFavorite: (stationId) => {
    const favorites = get().favoriteStationIds
    const next = favorites.includes(stationId)
      ? favorites.filter((id) => id !== stationId)
      : [...favorites, stationId]
    set({ favoriteStationIds: next })
  },
}))

// Reflect engine status changes into the store.
onEngineStatus((status) => {
  usePlayerStore.setState({ status })
})
