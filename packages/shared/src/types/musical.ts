/**
 * Core musical types.
 *
 * These describe *what* should happen musically, never *how* it becomes
 * sound. They intentionally contain no Web Audio API objects so the
 * composition engine and station definitions stay platform independent.
 */

/**
 * Modal scale vocabulary shared by the composition engine and the track
 * catalog. Owned here (not in composition-engine) so catalog data can
 * reference scales without crossing package boundaries.
 */
export type ScaleName =
  | 'major'
  | 'naturalMinor'
  | 'dorian'
  | 'mixolydian'
  | 'pentatonicMinor'
  | 'pentatonicMajor'

/**
 * Musical constraints for one generative episode. Episodes are derived
 * from real recordings in the station catalog (metadata plus character
 * traits); the constraint steers key, mode, and energy of the music
 * actually generated. Never contains audio or expressive content from
 * the referenced recording.
 */
export interface EpisodeConstraint {
  /** Wall-clock catalog slot, when available. */
  index?: number
  previousKey?: { rootPc: number; scale: ScaleName }
  nextKey?: { rootPc: number; scale: ScaleName }
  /** Seed that makes this episode's sections reproducible. */
  seed: number
  /** Tonic pitch class, 0..11 (0 = C). */
  keyRootPc: number
  /** Modal scale vocabulary for the episode. */
  scale: ScaleName
  /** Overall energy 0..1. */
  energy: number
  /** Tonal brightness 0..1 (register and voicing decisions). */
  brightness: number
  /** Rhythmic and harmonic movement 0..1. */
  movement: number
  /** Optional rhythmic displacement 0..1; defaults to station behavior. */
  swing?: number
  /** Optional percussion density 0..1; defaults to movement. */
  rhythmicDensity?: number
  /** Optional texture/register preference 0..1; defaults to brightness. */
  texture?: number
}

/** Browser-independent visual direction for the Signal Space scene. */
export interface StationVisualProfile {
  palette: readonly [string, string, string]
  ringCount: number
  ringGap: number
  ribbonCount: number
  particleDensity: number
  driftSpeed: number
  rotationSpeed: number
  lowResponse: number
  midResponse: number
  highResponse: number
}

/** Instruments available to station sound palettes. */
export type InstrumentId =
  | 'synth-pad'
  | 'drone'
  | 'soft-bass'
  | 'sub-bass'
  | 'electric-piano'
  | 'bell'
  | 'pluck'
  | 'kick'
  | 'snare'
  | 'hi-hat'
  | 'noise-texture'
  | 'guitar-string'

export type MusicalEventType = 'note' | 'drum' | 'control'

/**
 * A single musical event. Times are expressed in beats relative to the
 * start of the section that contains the event.
 */
export interface MusicalEvent {
  id: string
  type: MusicalEventType
  instrument: InstrumentId
  /** Start time in beats relative to the section start. */
  time: number
  /** Duration in beats (0 for one-shot percussion). */
  duration: number
  /** MIDI note number, when the event has pitch. */
  pitch?: number
  /** Normalized velocity 0..1. */
  velocity?: number
  /** Route a foreground phrase separately from the instrument’s usual channel. */
  mixRole?: 'lead'
  /** Instrument- or control-specific parameters. */
  parameters?: Record<string, number>
}

/** A schedulable chunk of music: the unit of continuous playback. */
export interface MusicalSection {
  id: string
  /** Bar index (in whole beats / 4) at which this section starts. */
  startBar: number
  /** Section length in bars. */
  bars: number
  /** Concrete tempo for this section; overrides the station default. */
  tempoBpm?: number
  /** Overall energy 0..1, drives arrangement and variation decisions. */
  energy: number
  /** Human-readable harmonic context, useful for debugging and UI. */
  harmony?: string[]
  events: MusicalEvent[]
}

export interface SetPlan {
  bpm: number
  variant: number
  groove: number
  harmony: number
  motif: readonly number[]
  sectionsPerPhrase: number
  entranceTone?: number
  exitTone?: number
  form: readonly ('intro' | 'build' | 'main' | 'variation' | 'breakdown' | 'transition')[]
}

/**
 * Context handed to a station's section generator. `random` is a seeded
 * random source: the same seed and section index always produce the same
 * sequence, which makes generation reproducible and testable.
 */
export interface GenerationContext {
  /** Session seed. */
  seed: number
  /** Index of the section being generated (0-based, monotonically increasing). */
  sectionIndex: number
  /** Bar at which the section starts. */
  startBar: number
  /** Section length in bars. */
  bars: number
  /** Overall energy target 0..1 for the arrangement state. */
  energy: number
  /** Merged customization + mood parameters (normalized 0..1). */
  parameters: Record<string, number>
  /** Episode constraints for the current transmission, when one is active. */
  episode?: EpisodeConstraint
  setPlan?: SetPlan
  /** Seeded random source in [0, 1). */
  random: () => number
}

/**
 * A station's compositional brain. Implemented per station in
 * `@infinite-radio/stations`; consumed by the audio engine's scheduler.
 */
export interface SectionGenerator {
  generateSection(context: GenerationContext): MusicalSection
}
