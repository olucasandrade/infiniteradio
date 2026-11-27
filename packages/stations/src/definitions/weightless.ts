import type { EpisodeConstraint, GenerationContext, MusicalEvent, SectionGenerator } from '@infinite-radio/shared'
import {
  chance,
  createEventFactory,
  densityForState,
  randomBetween,
  type ScaleName,
} from '@infinite-radio/composition-engine'
import type { StationDefinition } from '@infinite-radio/shared'

import { param, scaleChord, sectionBeats, sectionFrom } from './shared'
import { planStationSet, setPhrase, setState } from './set-plan'

/**
 * Weightless — ambient drone music with no fixed rhythmic pulse.
 *
 * Every section layers: a harmonic floor (drones), slowly evolving pads
 * stacked from scale tones, sparse bell events, and filtered noise air.
 * The key center drifts so long listening never feels like a loop.
 */

const SCALE: ScaleName = 'dorian'

/** Slow harmonic rhythm: how many beats a pad harmony lasts. */
const PAD_HARMONY_BEATS = 16

interface WeightlessKeyCenter {
  rootMidi: number
  name: string
}

const KEY_CENTERS: WeightlessKeyCenter[] = [
  { rootMidi: 50, name: 'D' }, // D dorian
  { rootMidi: 53, name: 'F' }, // F dorian
  { rootMidi: 45, name: 'A' }, // A dorian
  { rootMidi: 48, name: 'C' }, // C dorian
  { rootMidi: 43, name: 'G' }, // G dorian
]

function keyCenterFor(context: GenerationContext): WeightlessKeyCenter {
  const drift = Math.floor(context.sectionIndex * (0.4 + param(context.parameters, 'evolutionSpeed')))
  const index = (drift + Math.floor(context.random() * 2)) % KEY_CENTERS.length
  return KEY_CENTERS[index]!
}

const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

/**
 * Episode key: the tonic and mode of the reference track currently
 * steering the station, held in the same register as the preset centers.
 */
function episodeKey(episode: EpisodeConstraint): WeightlessKeyCenter {
  const root = 48 + episode.keyRootPc
  return { rootMidi: root > 52 ? root - 12 : root, name: NOTE_NAMES[episode.keyRootPc]! }
}

class WeightlessGenerator implements SectionGenerator {
  generateSection(context: GenerationContext) {
    const rng = context.random
    const bars = context.bars
    const beats = sectionBeats(bars)
    const event = createEventFactory(`w-${context.sectionIndex}`)
    const events: MusicalEvent[] = []

    const textureDensity = param(context.parameters, 'textureDensity')
    const harmonicMovement = param(context.parameters, 'harmonicMovement')
    const spatialDepth = param(context.parameters, 'spatialDepth')
    const evolutionSpeed = param(context.parameters, 'evolutionSpeed')

    const state = setState(context)
    const phrase = setPhrase(context)
    const density = densityForState(state)

    const episode = context.episode
    const key = episode ? episodeKey(episode) : keyCenterFor(context)
    const scale: ScaleName = episode?.scale ?? SCALE
    const brightness = episode?.brightness ?? 0.5
    const movement = episode?.movement ?? 0.5
    const harmony: string[] = []

    // -- Drones: the harmonic floor. Always present, but thinner in intros.
    const droneCount = density >= 0.7 && textureDensity > 0.6 ? 2 : 1
    for (let i = 0; i < droneCount; i++) {
      const root = key.rootMidi - 12 * i
      events.push(
        event({
          type: 'note',
          instrument: 'drone',
          time: 0,
          duration: beats + 2, // ring across the section boundary
          pitch: root,
          velocity: 0.5 + spatialDepth * 0.2,
        }),
      )
      if (i === 0) harmony.push(`${key.name} drone`)
    }

    // -- Pads: stacks of scale tones that shift with harmonicMovement.
    const padLayers = Math.max(1, Math.round((1 + textureDensity * 2) * density))
    const padShiftBeats = Math.max(8, PAD_HARMONY_BEATS - harmonicMovement * 8)
    for (let layer = 0; layer < padLayers; layer++) {
      const degree = context.setPlan ? (context.setPlan.harmony + phrase + layer * 2) % 7 : Math.floor(rng() * 5)
      const chord = scaleChord(key.rootMidi + 12, scale, degree, 3)
      const registerShift = (context.setPlan ? ((context.setPlan.variant + phrase + layer) % 3 === 1) : chance(rng, 0.2 + brightness * 0.4)) ? 12 : 0
      const start = Math.floor((layer * beats) / padLayers / 4) * 4
      for (const tone of chord) {
        events.push(
          event({
            type: 'note',
            instrument: 'synth-pad',
            time: start,
            duration: Math.min(padShiftBeats, beats - start + 2),
            pitch: tone + registerShift,
            velocity: 0.35 + rng() * 0.25,
          }),
        )
      }
      if (layer === 0) {
        harmony.push(`${key.name}${registerShift ? '+' : ''} pad:${['i', 'ii', 'III', 'IV', 'v', 'VI', 'VII'][degree]}`)
      }
    }

    // -- Bells: sparse melodic events, more with texture, evolution, movement.
    const bellChance = 0.18 + textureDensity * 0.45 + evolutionSpeed * 0.2 + movement * 0.15
    const bellCount = chance(rng, bellChance) ? Math.floor(randomBetween(rng, 1, 3 + textureDensity * 3)) : 0
    for (let i = 0; i < bellCount; i++) {
      const degree = context.setPlan?.motif[i % 4] ?? Math.floor(rng() * 7)
      const chord = scaleChord(key.rootMidi + 24, scale, degree % 5, 1)
      const time = Math.floor(randomBetween(rng, 0, beats - 2)) + (chance(rng, 0.3) ? 0.5 : 0)
      events.push(
        event({
          type: 'note',
          instrument: 'bell',
          time,
          duration: randomBetween(rng, 1.5, 4),
          pitch: chord[0]! + (chance(rng, 0.3) ? 12 : 0),
          velocity: 0.2 + rng() * 0.3,
        }),
      )
    }

    const plan = context.setPlan
    const beatsToWindowEnd = plan ? plan.bpm * 4 - context.startBar * 4 : Infinity
    const bridgePitch = context.sectionIndex === 0 ? plan?.entranceTone : plan?.exitTone
    if (bridgePitch !== undefined && (context.sectionIndex === 0 || beatsToWindowEnd <= beats)) {
      const time = context.sectionIndex === 0 ? 0 : Math.max(0, beatsToWindowEnd - 8)
      events.push(event({
        type: 'note', instrument: 'synth-pad', time, duration: 10,
        pitch: bridgePitch, velocity: 0.33,
      }))
    }

    // -- Noise air: long filtered textures, gated by spatial depth.
    if (spatialDepth > 0.9 && chance(rng, 0.45)) {
      const count = 1
      for (let i = 0; i < count; i++) {
        events.push(
          event({
            type: 'note',
            instrument: 'noise-texture',
            time: randomBetween(rng, 0, beats / 2),
            duration: beats * randomBetween(rng, 0.5, 1),
            velocity: 0.3 + spatialDepth * 0.3,
            parameters: { texture: spatialDepth },
          }),
        )
      }
    }

    return sectionFrom(context, bars, events, {
      energy: 0.3 + textureDensity * 0.3,
      harmony,
    })
  }
}

export const weightlessGenerator = new WeightlessGenerator()

export const weightlessStation: StationDefinition = {
  id: 'weightless',
  name: 'Weightless',
  tagline: 'A quiet space for drifting, thinking, and disconnecting.',
  description:
    'Slowly evolving drones and soft harmonic layers with no fixed pulse. Music for letting go of time.',
  category: 'Ambient',
  artworkPath: '/stations/weightless/artwork.svg',
  accent: 'weightless',
  defaultMood: 'floating',
  moods: [
    {
      id: 'floating',
      name: 'Floating',
      parameters: { textureDensity: 0.6, harmonicMovement: 0.5, spatialDepth: 0.7, evolutionSpeed: 0.5 },
    },
    {
      id: 'vast',
      name: 'Vast',
      parameters: { textureDensity: 0.4, harmonicMovement: 0.3, spatialDepth: 1, evolutionSpeed: 0.3 },
    },
    {
      id: 'meditative',
      name: 'Meditative',
      parameters: { textureDensity: 0.3, harmonicMovement: 0.7, spatialDepth: 0.4, evolutionSpeed: 0.7 },
    },
  ],
  parameters: {
    textureDensity: 0.6,
    harmonicMovement: 0.5,
    spatialDepth: 0.7,
    evolutionSpeed: 0.5,
  },
  parameterSpecs: [
    { id: 'textureDensity', label: 'Texture density', min: 0, max: 1, step: 0.01, defaultValue: 0.6, format: 'percent' },
    { id: 'harmonicMovement', label: 'Harmonic movement', min: 0, max: 1, step: 0.01, defaultValue: 0.5, format: 'percent' },
    { id: 'spatialDepth', label: 'Spatial depth', min: 0, max: 1, step: 0.01, defaultValue: 0.7, format: 'percent' },
    { id: 'evolutionSpeed', label: 'Evolution speed', min: 0, max: 1, step: 0.01, defaultValue: 0.5, format: 'percent' },
  ],
  tempo: { minBpm: 48, maxBpm: 58 },
  barsPerSection: 4,
  effects: {
    reverbWet: 0.55,
    reverbDecaySeconds: 6,
    delayTimeBeats: 1.5,
    delayFeedback: 0.35,
    delayWet: 0.12,
  },
  planSet: (seed, episode) => planStationSet('weightless', weightlessStation.tempo, weightlessStation.barsPerSection, seed, episode),
  generator: weightlessGenerator,
}
