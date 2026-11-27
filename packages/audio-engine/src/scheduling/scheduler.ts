import {
  BEATS_PER_BAR,
  SCHEDULER_INTERVAL_MS,
  SCHEDULER_LOOKAHEAD_SECONDS,
  createSectionRandom,
  type GenerationContext,
  type InstrumentId,
  type MusicalSection,
} from '@infinite-radio/shared'

import type { StationRuntime } from '../core/engine'
import type { Instrument, VoiceHandle } from '../instruments/types'
import { triggerMusicalEvent } from '../instruments/types'

export interface SchedulerOptions {
  /** Delay before the first section sounds (station crossfade), seconds. */
  startDelaySeconds?: number
}

/** Minimal surface the engine needs from a section scheduler. */
export interface SectionScheduler {
  start(): void
  stop(): void
  updateParameters(parameters: Record<string, number>): void
  dispose(): void
}

interface ScheduledSection {
  section: MusicalSection
  startTime: number
  endTime: number
  voices: VoiceHandle[]
}

/**
 * Lookahead scheduler: the classic pattern from the Web Audio "tale of
 * two clocks" approach. A coarse interval timer (100ms) checks the
 * AudioContext clock and schedules whole sections slightly ahead of
 * playback, so JavaScript event-loop jitter never becomes audible.
 *
 * Musical events are generated per section by the station's
 * SectionGenerator with a seeded random source — continuous playback is
 * generation-driven, never a loop.
 */
export class LookaheadScheduler {
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly sections: ScheduledSection[] = []
  private parameters: Record<string, number>
  private originTime = 0
  private transportBeat = 0
  private sectionIndex = 0
  private running = false
  private started = false
  private samplePhrase = -1
  private sampleResolver?: (id: InstrumentId) => Instrument

  constructor(
    private readonly ctx: BaseAudioContext,
    private readonly runtime: StationRuntime,
    private readonly instrumentFor: (id: InstrumentId) => Instrument,
    private readonly options: SchedulerOptions = {},
  ) {
    this.parameters = { ...runtime.parameters }
  }

  start(atTime = this.ctx.currentTime + (this.options.startDelaySeconds ?? 0), offsetSeconds?: number): void {
    if (this.running) return
    this.running = true
    if (offsetSeconds !== undefined) {
      const beat = this.secondsToBeats(Math.max(0, offsetSeconds))
      this.sectionIndex = Math.floor(beat / this.sectionBeats())
      this.transportBeat = this.sectionIndex * this.sectionBeats()
      this.originTime = atTime - this.beatsToSeconds(beat)
      if (beat > this.transportBeat) {
        this.generateAndSchedule(this.originTime + this.beatsToSeconds(this.transportBeat), atTime)
      }
    } else if (!this.started) {
      this.originTime = atTime
    } else {
      this.originTime = this.ctx.currentTime - this.beatsToSeconds(this.transportBeat)
    }
    this.started = true
    this.timer = setInterval(() => this.tick(), SCHEDULER_INTERVAL_MS)
    this.tick()
  }

  stop(): void {
    if (!this.running) return
    this.retire()
    const positionBeat = this.positionBeats()
    const sectionBeats = this.sectionBeats()
    const nextBoundary = Math.ceil((positionBeat + 0.001) / sectionBeats) * sectionBeats
    this.transportBeat = Math.max(this.transportBeat, nextBoundary)
    this.sectionIndex = this.transportBeat / sectionBeats
    this.clearVoices()
  }

  /** Stop generating while leaving already scheduled music and effect tails on the bus. */
  retire(): void {
    this.running = false
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private clearVoices(): void {
    for (const scheduled of this.sections.splice(0)) {
      for (const voice of scheduled.voices) voice.stop()
    }
  }

  updateParameters(parameters: Record<string, number>): void {
    this.parameters = { ...this.parameters, ...parameters }
  }

  dispose(): void {
    this.retire()
    this.clearVoices()
  }

  isRunning(): boolean {
    return this.running
  }

  /** Scheduled sections currently buffered ahead of playback. */
  get scheduledCount(): number {
    return this.sections.length
  }

  /** Current transport position in beats. */
  positionBeats(): number {
    if (!this.started) return 0
    return Math.max(0, this.secondsToBeats(this.ctx.currentTime - this.originTime))
  }

  // --------------------------------------------------------------------- core

  private tick(): void {
    const horizon = this.ctx.currentTime + SCHEDULER_LOOKAHEAD_SECONDS
    while (true) {
      this.pruneEndedSections()
      const nextStart = this.originTime + this.beatsToSeconds(this.transportBeat)
      if (nextStart > horizon || nextStart >= this.windowEnd()) break
      // Skip completed sections after a suspended or heavily throttled tab.
      if (nextStart + this.beatsToSeconds(this.sectionBeats()) <= this.ctx.currentTime) {
        this.transportBeat += this.sectionBeats()
        this.sectionIndex += 1
        continue
      }
      this.generateAndSchedule(nextStart)
    }
  }

  private generateAndSchedule(startTime: number, seekTime?: number): void {
    const sectionBeats = this.sectionBeats()
    const context: GenerationContext = {
      seed: this.runtime.seed,
      sectionIndex: this.sectionIndex,
      startBar: this.transportBeat / BEATS_PER_BAR,
      bars: this.runtime.definition.barsPerSection,
      energy: this.runtime.episode?.energy ?? 0.5,
      setPlan: this.runtime.setPlan,
      parameters: { ...this.parameters },
      episode: this.runtime.episode ?? undefined,
      random: createSectionRandom(this.runtime.seed, this.sectionIndex),
    }
    const section = this.runtime.definition.generator.generateSection(context)

    const voices: VoiceHandle[] = []
    const secondsPerBeat = this.secondsPerBeat()
    const phrase = Math.floor(this.sectionIndex / (this.runtime.setPlan?.sectionsPerPhrase ?? 1))
    if (phrase !== this.samplePhrase) {
      this.sampleResolver = this.runtime.samples?.forSection()
      this.samplePhrase = phrase
    }
    const resolve = this.sampleResolver ?? this.instrumentFor
    const windowEnd = this.windowEnd()
    const earliest = Math.max(this.ctx.currentTime, seekTime ?? -Infinity)
    for (const event of section.events) {
      if (event.pitch !== undefined && !Number.isFinite(event.pitch)) continue
      const eventTime = startTime + event.time * secondsPerBeat
      if (eventTime >= windowEnd) continue
      const time = Math.max(earliest, eventTime)
      const elapsed = (time - eventTime) / secondsPerBeat
      if (elapsed > 0 && (seekTime === undefined || event.duration - elapsed < 0.5)) continue
      const note = elapsed > 0 ? { ...event, duration: event.duration - elapsed } : event
      const bus = this.runtime.bus
      voices.push(triggerMusicalEvent(
        this.ctx, resolve(event.instrument), bus.inputFor?.(event.instrument, event.mixRole) ?? bus.input,
        note, time, secondsPerBeat,
      ))
    }

    this.sections.push({
      section,
      startTime,
      endTime: startTime + this.beatsToSeconds(sectionBeats),
      voices,
    })
    this.transportBeat += sectionBeats
    this.sectionIndex += 1
  }

  private pruneEndedSections(): void {
    const now = this.ctx.currentTime
    for (let i = this.sections.length - 1; i >= 0; i--) {
      if (this.sections[i]!.endTime < now - 1 && this.sections[i]!.voices.every((voice) => voice.endTime <= now)) {
        this.sections.splice(i, 1)
      }
    }
  }

  private windowEnd(): number {
    const window = this.runtime.window
    if (!window) return Infinity
    return this.originTime + (window.endsAtMs - window.startsAtMs) / 1000 - 0.000001
  }

  private sectionBeats(): number {
    return this.runtime.definition.barsPerSection * BEATS_PER_BAR
  }

  private secondsPerBeat(): number {
    return 60 / this.runtime.bpm
  }

  private beatsToSeconds(beats: number): number {
    return beats * this.secondsPerBeat()
  }

  private secondsToBeats(seconds: number): number {
    return seconds / this.secondsPerBeat()
  }
}
