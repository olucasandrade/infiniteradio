import type { PlaybackStatus } from './player'
import type { EpisodeConstraint } from './musical'
import type { StationId } from './station'

export interface EpisodeWindow {
  stationId: StationId
  startsAtMs: number
  endsAtMs: number
}

/**
 * The audio engine's public surface. Implemented in
 * `@infinite-radio/audio-engine`; consumed by the React app through a
 * singleton — never stored inside serializable UI state.
 */
export interface AudioEngine {
  initialize(): Promise<void>
  play(): Promise<void>
  pause(): void
  setMasterVolume(value: number): void
  setMuted(muted: boolean): void
  switchStation(stationId: StationId): Promise<void>
  /** Live-update generation parameters (customization or mood changes). */
  updateParameters(parameters: Record<string, number>): void
  /** Prepare an episode at its wall-clock boundary, or apply it immediately. */
  setEpisodeConstraint(constraint: EpisodeConstraint | null, window?: EpisodeWindow): void
  dispose(): void

  getStatus(): PlaybackStatus
  onStatusChange(listener: (status: PlaybackStatus) => void): () => void

  /**
   * Taps the master output for visualization. Null when the engine is not
   * initialized or the visualizer is unavailable.
   */
  getAnalyser(): AnalyserNode | null
}

export const AUDIO_ENGINE_ERROR_EVENT = 'infinite-radio:audio-error'

export interface AudioEngineErrorDetail {
  message: string
}
