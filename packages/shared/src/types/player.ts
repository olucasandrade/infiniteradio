import type { StationId } from './station'

/** High-level playback state of the application. */
export type PlaybackStatus =
  | 'idle'
  | 'ready'
  | 'initializing'
  | 'playing'
  | 'paused'
  | 'transitioning'
  | 'error'

/** Lifecycle of the underlying AudioContext. */
export type AudioContextStatus = 'created' | 'running' | 'suspended' | 'closed' | 'unsupported'

/** Everything the UI persists to localStorage. */
export interface PlayerPreferences {
  favoriteStationIds: StationId[]
  lastStationId: StationId
  lastMoodByStation: Partial<Record<StationId, string>>
  /** Customization values per station, keyed by parameter id. */
  parametersByStation: Partial<Record<StationId, Record<string, number>>>
  volume: number
  muted: boolean
  reducedMotion: boolean
  visualizerEnabled: boolean
  defaultStationId: StationId
}
