import type { GenerationContext, MusicalEvent, SectionGenerator, StationDefinition } from '@infinite-radio/shared'
import {
  chance,
  createEventFactory,
  densityForState,
  euclideanRhythm,
  randomBetween,
  velocityAt,
  type ScaleName,
} from '@infinite-radio/composition-engine'

import { param, scaleChord, sectionBeats, sectionFrom } from './shared'
import { planStationSet, setPhrase, setState } from './set-plan'

/**
 * After Hours — downtempo / deep electronic with a stable groove.
 *
 * A four-on-the-floor kick, offbeat hats, a sub-heavy bass motif,
 * atmospheric pads and a 16th-note arpeggio. The arrangement engine
 * decides when layers appear and drop (breakdowns), so the groove stays
 * constant while the texture evolves.
 */

const SCALE: ScaleName = 'naturalMinor'
const DEFAULT_ROOT_PC = 9 // A
const PROGRESSIONS = [[0, 5, 2, 6], [0, 3, 6, 5], [0, 2, 5, 3], [0, 6, 3, 2]]

function chordForBar(bar: number, keyRootMidi: number, scale: ScaleName, degrees: number[]): number[] {
  const degree = degrees[Math.floor(bar / 2) % degrees.length]!
  return scaleChord(keyRootMidi, scale, degree, 4)
}

class AfterHoursGenerator implements SectionGenerator {
  generateSection(context: GenerationContext) {
    const rng = context.random
    const bars = context.bars
    const beats = sectionBeats(bars)
    const event = createEventFactory(`ah-${context.sectionIndex}`)
    const events: MusicalEvent[] = []

    const bassIntensity = param(context.parameters, 'bassIntensity')
    const percussionIntensity = param(context.parameters, 'percussionIntensity')
    const atmosphericTexture = param(context.parameters, 'atmosphericTexture')
    const melodicComplexity = param(context.parameters, 'melodicComplexity')

    const state = setState(context)
    const density = densityForState(state)
    const phrase = setPhrase(context)
    const degrees = PROGRESSIONS[context.setPlan?.harmony ?? 0]!
    const inBreakdown = state === 'breakdown'

    const episode = context.episode
    const keyRootMidi = 36 + (episode?.keyRootPc ?? DEFAULT_ROOT_PC) // A2 by default
    const scale = episode?.scale ?? SCALE
    const brightness = episode?.brightness ?? 0.5
    const movement = episode?.movement ?? 0.5

    const harmony: string[] = []

    // -- Kick: four on the floor, silenced in breakdowns.
    if (!inBreakdown && density > 0.4) {
      for (let beat = 0; beat < beats; beat++) {
        events.push(
          event({
            type: 'drum',
            instrument: 'kick',
            time: beat,
            duration: 0,
            velocity: velocityAt(rng, { beat, strong: true }, { base: 0.85, variation: 0.06, accent: 0 }),
          }),
        )
      }
    }

    // -- Hi-hats: offbeat eighths; denser 16ths at high intensity.
    if (density > 0.5) {
      const useSixteenths = percussionIntensity > 0.65 && chance(rng, 0.5)
      const steps = useSixteenths ? beats * 4 : beats * 2
      const pattern = euclideanRhythm(
        steps,
        Math.round(steps * (0.3 + percussionIntensity * 0.3)),
      )
      for (let i = 0; i < steps; i++) {
        if (!pattern[i]) continue
        const time = i / (useSixteenths ? 4 : 2)
        // Offbeat emphasis: quieter on the beat, crisp on the offbeat.
        const onBeat = time % 1 === 0
        events.push(
          event({
            type: 'drum',
            instrument: 'hi-hat',
            time,
            duration: 0,
            velocity: velocityAt(
              rng,
              { beat: time, strong: false },
              { base: onBeat ? 0.25 : 0.5 + percussionIntensity * 0.25, variation: 0.1 },
            ),
          }),
        )
      }
    }

    // -- Snare: backbeat on 2 and 4.
    if (!inBreakdown && density > 0.55 && percussionIntensity > 0.25) {
      for (let beat = 2; beat < beats; beat += 4) {
        events.push(
          event({
            type: 'drum',
            instrument: 'snare',
            time: beat,
            duration: 0,
            velocity: 0.4 + percussionIntensity * 0.3,
          }),
        )
      }
    }

    // -- Sub bass: long root notes following the chord cycle.
    if (bassIntensity > 0.1) {
      for (let bar = 0; bar < bars; bar += 2) {
        const chord = chordForBar(context.startBar + bar, keyRootMidi, scale, degrees)
        const root = chord[0]! - 12
        events.push(
          event({
            type: 'note',
            instrument: 'sub-bass',
            time: bar * 4,
            duration: 7.5,
            pitch: root,
            velocity: 0.5 + bassIntensity * 0.4,
          }),
        )
        if (bar === 0) harmony.push(`A${chord[0] === keyRootMidi ? 'm' : ''} sub`)
      }
    }

    // -- Bass motif: a repeating plucked figure, varied per section and
    //    busier when the episode calls for more movement.
    if (bassIntensity > 0.3 && !inBreakdown) {
      const motif = euclideanRhythm(8, 3 + (context.sectionIndex % 2) + (movement > 0.6 ? 1 : 0))
      const motifOffset = (context.setPlan?.groove ?? Math.floor(rng() * 2)) + phrase
      for (let bar = 0; bar < bars; bar++) {
        const chord = chordForBar(context.startBar + bar, keyRootMidi, scale, degrees)
        for (let i = 0; i < 8; i++) {
          if (!motif[(i + motifOffset) % 8]) continue
          const degree = [0, 0, 2, 1, 0, 2, 3, 2][i]!
          const pitch = chord[degree % chord.length]! - 12
          events.push(
            event({
              type: 'note',
              instrument: 'pluck',
              time: bar * 4 + i * 0.5,
              duration: 0.4,
              pitch,
              velocity: 0.35 + bassIntensity * 0.35,
            }),
          )
        }
      }
    }

    // -- Pads: one chord swell per 2 bars, present from build onwards.
    if (density >= 0.35 && atmosphericTexture > 0.15) {
      for (let bar = 0; bar < bars; bar += 2) {
        const chord = chordForBar(context.startBar + bar, keyRootMidi, scale, degrees)
        for (const tone of chord.slice(1)) {
          events.push(
            event({
              type: 'note',
              instrument: 'synth-pad',
              time: bar * 4 + (phrase % 2) * 1.5,
              duration: phrase % 2 ? 2.5 : 7.5,
              pitch: tone + 12,
              velocity: 0.2 + atmosphericTexture * 0.25,
            }),
          )
        }
      }
    }

    // -- Arpeggio: 16th pluck pattern, gated by melodic complexity. Bright
    //    episodes reach an octave higher more often.
    if (melodicComplexity > 0.35 && density > 0.5) {
      const densityGate = 0.3 + melodicComplexity * 0.55
      const octaveChance = 0.2 + (brightness - 0.5) * 0.3
      for (let bar = 0; bar < bars; bar++) {
        const chord = chordForBar(context.startBar + bar, keyRootMidi, scale, degrees)
        for (let i = 0; i < 16; i++) {
          if (!chance(rng, densityGate)) continue
          const tone = chord[context.setPlan?.motif[(i + phrase) % 4] ?? i % chord.length]! + 24 + (chance(rng, octaveChance) ? 12 : 0)
          events.push(
            event({
              type: 'note',
              instrument: 'pluck',
              time: bar * 4 + i * 0.25,
              duration: 0.22,
              pitch: tone,
              velocity: velocityAt(rng, { beat: i * 0.25, strong: false }, { base: 0.35, variation: 0.12 }),
            }),
          )
        }
      }
    }

    // -- Sparse bell motif at high melodic complexity.
    if (melodicComplexity > 0.6 && chance(rng, 0.6)) {
      const chord = chordForBar(context.startBar, keyRootMidi, scale, degrees)
      const tone = chord[Math.floor(rng() * chord.length)]! + 36
      events.push(
        event({
          type: 'note',
          instrument: 'bell',
          time: Math.floor(randomBetween(rng, 0, beats - 4)) + 2,
          duration: 3,
          pitch: tone,
          velocity: 0.3,
        }),
      )
    }

    return sectionFrom(context, bars, events, {
      energy: 0.4 + percussionIntensity * 0.4 + bassIntensity * 0.2,
      harmony,
    })
  }
}

export const afterHoursGenerator = new AfterHoursGenerator()

export const afterHoursStation: StationDefinition = {
  id: 'after-hours',
  name: 'After Hours',
  tagline: 'A place for late nights, deep focus, and uninterrupted movement.',
  description:
    'Deep downtempo electronica: a steady kick, warm sub bass, and slowly evolving synth patterns. Music for after midnight.',
  category: 'Downtempo electronic',
  artworkPath: '/stations/after-hours/artwork.svg',
  accent: 'after-hours',
  defaultMood: 'deep',
  moods: [
    {
      id: 'deep',
      name: 'Deep',
      parameters: { bassIntensity: 0.8, percussionIntensity: 0.5, atmosphericTexture: 0.6, melodicComplexity: 0.4 },
    },
    {
      id: 'hypnotic',
      name: 'Hypnotic',
      parameters: { bassIntensity: 0.6, percussionIntensity: 0.8, atmosphericTexture: 0.4, melodicComplexity: 0.7 },
    },
    {
      id: 'minimal',
      name: 'Minimal',
      parameters: { bassIntensity: 0.4, percussionIntensity: 0.25, atmosphericTexture: 0.8, melodicComplexity: 0.2 },
    },
  ],
  parameters: {
    bassIntensity: 0.8,
    percussionIntensity: 0.5,
    atmosphericTexture: 0.6,
    melodicComplexity: 0.4,
  },
  parameterSpecs: [
    { id: 'bassIntensity', label: 'Bass intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.8, format: 'percent' },
    { id: 'percussionIntensity', label: 'Percussion intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.5, format: 'percent' },
    { id: 'atmosphericTexture', label: 'Atmospheric texture', min: 0, max: 1, step: 0.01, defaultValue: 0.6, format: 'percent' },
    { id: 'melodicComplexity', label: 'Melodic complexity', min: 0, max: 1, step: 0.01, defaultValue: 0.4, format: 'percent' },
  ],
  tempo: { minBpm: 100, maxBpm: 112 },
  barsPerSection: 8,
  effects: {
    reverbWet: 0.35,
    reverbDecaySeconds: 3.2,
    delayTimeBeats: 0.75,
    delayFeedback: 0.4,
    delayWet: 0.18,
  },
  planSet: (seed, episode) => planStationSet('after-hours', afterHoursStation.tempo, afterHoursStation.barsPerSection, seed, episode),
  generator: afterHoursGenerator,
}
