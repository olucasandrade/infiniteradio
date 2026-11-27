import type { EpisodeConstraint, SectionGenerator, SetPlan } from './musical'

/** Stable station identities in discovery order. */
export const STATION_IDS = [
  'weightless',
  'hip-hop',
  'blue-notes',
  'neo-soul',
  'vaporwave',
  'indie',
  'after-hours',
] as const
export type StationId = (typeof STATION_IDS)[number]

export function isStationId(value: unknown): value is StationId {
  return typeof value === 'string' && (STATION_IDS as readonly string[]).includes(value)
}

/** A mood preset: named generation-parameter overrides. */
export interface StationMood {
  id: string
  name: string
  /** Normalized 0..1 overrides merged over the station defaults. */
  parameters: Record<string, number>
}

/** Declarative spec for one customization slider. */
export interface CustomizationParameter {
  id: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  /** How the value is displayed next to the slider. */
  format: 'percent' | 'number'
}

/** Reverb/delay/filter configuration for a station's effect chain. */
export interface StationEffectsConfig {
  reverbWet: number
  reverbDecaySeconds: number
  delayTimeBeats: number
  delayFeedback: number
  delayWet: number
}

/**
 * A complete station: identity + musical configuration. Definitions are
 * plain data plus a section generator — no browser-specific code.
 */
export interface StationDefinition {
  id: StationId
  name: string
  tagline: string
  description: string
  category: string
  /** Static artwork asset path (served by the web app). */
  artworkPath: string
  /** Token suffix matching `--color-station-<accent>` in tokens.css. */
  accent: StationId
  defaultMood: string
  moods: StationMood[]
  /** Default customization values, keyed by parameter id. */
  parameters: Record<string, number>
  parameterSpecs: CustomizationParameter[]
  /** Tempo range; the concrete BPM is chosen per listening session. */
  tempo: { minBpm: number; maxBpm: number }
  barsPerSection: number
  effects: StationEffectsConfig
  generator: SectionGenerator
  planSet?(seed: number, episode?: EpisodeConstraint): SetPlan
}

/** Strip the generator for contexts that only need identity/metadata. */
export type StationSummary = Omit<StationDefinition, 'generator'>
