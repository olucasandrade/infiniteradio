import {
  AUDIO_ENGINE_ERROR_EVENT,
  DEFAULT_TRANSITION_SECONDS,
  DEFAULT_VOLUME,
  type AudioEngine,
  type EpisodeConstraint,
  type EpisodeWindow,
  type PlaybackStatus,
  type StationDefinition,
  type SetPlan,
  type StationId,
} from '@infinite-radio/shared'

import { AudioEngineError, createAudioContext } from './context'

export { AudioEngineError } from './context'
import { createMasterChain, StationBus, type MasterChain } from '../mixing/bus'
import { LookaheadScheduler } from '../scheduling/scheduler'
import { createInstrument } from '../instruments/registry'
import { createSamplePalette } from '../instruments/samples'

/** Everything the engine needs to run one station's audio graph. */
export interface StationRuntime {
  definition: StationDefinition
  bus: StationBus
  /** Concrete tempo chosen when the station was activated. */
  bpm: number
  /** Session seed; a new one per station activation or episode. */
  seed: number
  /** Active generative episode, when the rotation has supplied one. */
  episode: EpisodeConstraint | null
  parameters: Record<string, number>
  scheduler: LookaheadScheduler | null
  setPlan?: SetPlan
  window?: EpisodeWindow
  samples?: ReturnType<typeof createSamplePalette>
}

export interface EngineOptions {
  /** Crossfade duration for station switches, in seconds. */
  transitionSeconds?: number
  sampleBaseUrl?: string
}

function reportError(message: string): void {
  const target = globalThis as { dispatchEvent?: (event: Event) => boolean; CustomEvent?: typeof CustomEvent }
  if (typeof target.dispatchEvent === 'function' && typeof target.CustomEvent === 'function') {
    target.dispatchEvent(
      new target.CustomEvent(AUDIO_ENGINE_ERROR_EVENT, {
        detail: { message },
      }),
    )
  }
}

/**
 * The Web Audio engine. Owns exactly one AudioContext for the app's
 * lifetime, the master output chain, and one StationBus per active
 * station. React never sees the nodes — only this API.
 */
export class WebAudioEngine implements AudioEngine {
  private ctx: AudioContext | null = null
  private master: MasterChain | null = null
  private runtime: StationRuntime | null = null
  private status: PlaybackStatus = 'idle'
  private readonly listeners = new Set<(status: PlaybackStatus) => void>()
  private readonly transitionSeconds: number
  private volume = DEFAULT_VOLUME
  private muted = false
  private disposed = false
  /** Episode to apply to the next (or current) station runtime. */
  private pendingEpisode: EpisodeConstraint | null = null
  private pendingWindow?: EpisodeWindow
  private readonly retiring = new Map<StationRuntime, ReturnType<typeof setTimeout>>()

  constructor(
    private readonly stations: Record<StationId, StationDefinition>,
    private readonly options: EngineOptions = {},
  ) {
    this.transitionSeconds = options.transitionSeconds ?? DEFAULT_TRANSITION_SECONDS
  }

  // ---------------------------------------------------------------- lifecycle

  async initialize(): Promise<void> {
    if (this.disposed) throw new AudioEngineError('Engine has been disposed')
    if (this.ctx) {
      await this.ctx.resume()
      return
    }
    try {
      this.ctx = createAudioContext()
      this.master = createMasterChain(this.ctx)
      this.applyVolume()
      this.setStatus('ready')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.setStatus('error')
      reportError(message)
      throw error instanceof AudioEngineError ? error : new AudioEngineError(message)
    }
  }

  async play(): Promise<void> {
    this.ensureReady()
    if (this.ctx!.state === 'suspended') {
      await this.ctx!.resume()
    }
    if (this.runtime) this.startRuntime(this.runtime)
    this.setStatus('playing')
  }

  pause(): void {
    if (this.disposed || !this.ctx) return
    this.runtime?.scheduler?.stop()
    this.clearRetiring()
    void this.ctx.suspend()
    if (this.status === 'playing') this.setStatus('paused')
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.clearRetiring()
    this.runtime?.scheduler?.dispose()
    this.runtime?.bus.dispose()
    this.runtime = null
    this.master = null
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close()
    }
    this.ctx = null
    this.listeners.clear()
    this.setStatus('idle')
  }

  // ------------------------------------------------------------------- output

  setMasterVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value))
    this.applyVolume()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.applyVolume()
  }

  getAnalyser(): AnalyserNode | null {
    return this.master?.analyser ?? null
  }

  // ------------------------------------------------------------------ stations

  getCurrentStationId(): StationId | null {
    return this.runtime?.definition.id ?? null
  }

  async switchStation(stationId: StationId): Promise<void> {
    const definition = this.stations[stationId]
    if (!definition) throw new AudioEngineError(`Unknown station: ${stationId}`)
    this.ensureReady()
    if (this.runtime?.definition.id === stationId) return

    this.activateRuntime(definition, this.pendingWindow && this.pendingWindow.stationId !== stationId ? null : this.pendingEpisode, {
      crossfade: this.status === 'playing',
      keepParameters: false,
    })
  }

  /** Live-update generation parameters; affects sections not yet scheduled. */
  updateParameters(parameters: Record<string, number>): void {
    if (!this.runtime) return
    this.runtime.parameters = { ...this.runtime.parameters, ...parameters }
    this.runtime.scheduler?.updateParameters(this.runtime.parameters)
  }

  /** Apply an episode to its station, preparing its audio ahead of the window if possible. */
  setEpisodeConstraint(constraint: EpisodeConstraint | null, window?: EpisodeWindow): void {
    this.pendingEpisode = constraint
    this.pendingWindow = window
    const runtime = this.runtime
    if (!runtime || (window && window.stationId !== runtime.definition.id)) return
    if (
      runtime.episode?.seed === constraint?.seed &&
      runtime.window?.startsAtMs === window?.startsAtMs &&
      runtime.window?.endsAtMs === window?.endsAtMs
    ) return

    const playing = this.status === 'playing' && runtime.scheduler?.isRunning() === true
    this.activateRuntime(runtime.definition, constraint, { crossfade: playing, keepParameters: true })
  }

  /** Internal: the active runtime, for module extensions. */
  getRuntime(): StationRuntime | null {
    return this.runtime
  }

  getContext(): AudioContext | null {
    return this.ctx
  }

  // -------------------------------------------------------------------- status

  getStatus(): PlaybackStatus {
    return this.status
  }

  onStatusChange(listener: (status: PlaybackStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ------------------------------------------------------------------- private

  /**
   * Bring a fresh runtime for `definition` live and retire the previous
   * one. The new scheduler starts with the crossfade and lets outgoing
   * audio ring out on its own bus. `keepParameters` carries live customization over (used
   * for same-station episode changes).
   */
  private activateRuntime(
    definition: StationDefinition,
    episode: EpisodeConstraint | null,
    options: { crossfade: boolean; keepParameters: boolean },
  ): void {
    const ctx = this.ctx!
    const previous = this.runtime

    const seed = episode?.seed ?? this.newSeed()
    const setPlan = definition.planSet?.(seed, episode ?? undefined)
    const window = this.pendingWindow?.stationId === definition.id ? this.pendingWindow : undefined
    const secondsPerBeat = 60 / (setPlan?.bpm ?? this.pickTempo(definition))
    const bus = new StationBus(ctx, definition.effects, secondsPerBeat)
    bus.output.connect(this.master!.input)
    bus.fadeTo(0, ctx.currentTime, 0)

    const runtime: StationRuntime = {
      definition,
      bus,
      bpm: 60 / secondsPerBeat,
      seed,
      setPlan,
      window,
      samples: this.options.sampleBaseUrl ? createSamplePalette(ctx, definition.id, this.options.sampleBaseUrl) : undefined,
      episode,
      parameters:
        options.keepParameters && previous
          ? { ...previous.parameters }
          : { ...definition.parameters },
      scheduler: null,
    }
    runtime.scheduler = new LookaheadScheduler(
      ctx,
      runtime,
      createInstrument,

    )
    this.runtime = runtime

    const now = Date.now()
    const lead = options.crossfade ? 0.035 : 0
    const waitSeconds = Math.max(lead, window ? (window.startsAtMs - now) / 1000 : 0)
    const startTime = ctx.currentTime + waitSeconds
    if (previous) {
      previous.bus.fadeTo(0, startTime, options.crossfade ? this.transitionSeconds : 0)
      if (options.crossfade) {
        // The outgoing scheduler can finish filling the last phrase. Its
        // episode window prevents attacks from spilling into the next one.
        const retire = setTimeout(() => {
          previous.scheduler?.dispose()
          previous.bus.dispose()
          this.retiring.delete(previous)
        }, (waitSeconds + this.transitionSeconds + 0.15) * 1000)
        this.retiring.set(previous, retire)
        if (previous.definition.id !== definition.id || !previous.window) previous.scheduler?.retire()
      } else {
        previous.scheduler?.dispose()
        previous.bus.dispose()
      }
    }

    bus.fadeTo(1, startTime, options.crossfade ? this.transitionSeconds : 0.05, 0)
    if (options.crossfade) this.startRuntime(runtime, startTime, now + waitSeconds * 1000)
  }

  private startRuntime(
    runtime: StationRuntime,
    startTime = this.ctx!.currentTime + 0.035,
    wallTime = Date.now() + 35,
  ): void {
    const offset = runtime.window ? Math.max(0, (wallTime - runtime.window.startsAtMs) / 1000) : undefined
    runtime.scheduler?.start(startTime, offset)
  }

  private clearRetiring(): void {
    for (const [runtime, timer] of this.retiring) {
      clearTimeout(timer)
      runtime.scheduler?.dispose()
      runtime.bus.dispose()
    }
    this.retiring.clear()
  }

  private setStatus(status: PlaybackStatus): void {
    if (this.status === status) return
    this.status = status
    for (const listener of this.listeners) listener(status)
  }

  private ensureReady(): void {
    if (this.disposed) throw new AudioEngineError('Engine has been disposed')
    if (!this.ctx || !this.master) {
      throw new AudioEngineError('Audio engine is not initialized')
    }
  }

  private applyVolume(): void {
    if (!this.master || !this.ctx) return
    const target = this.muted ? 0 : this.volume
    this.master.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03)
  }

  private pickTempo(definition: StationDefinition): number {
    const { minBpm, maxBpm } = definition.tempo
    return minBpm + Math.random() * (maxBpm - minBpm)
  }

  private newSeed(): number {
    return Math.floor(Math.random() * 0xffffffff) >>> 0
  }
}
