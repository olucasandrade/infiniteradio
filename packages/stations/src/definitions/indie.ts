import type {
  GenerationContext,
  MusicalEvent,
  SectionGenerator,
  StationDefinition,
} from '@infinite-radio/shared'
import {
  chance,
  createEventFactory,
  densityForState,
  euclideanRhythm,
  type ScaleName,
} from '@infinite-radio/composition-engine'

import { param, scaleChord, sectionBeats, sectionFrom } from './shared'
import { planStationSet, setPhrase, setState } from './set-plan'

const SCALE: ScaleName = 'major'
const ROOT_PC = 4
const PROGRESSIONS = [[0, 4, 5, 3], [0, 5, 3, 4], [0, 2, 3, 4], [0, 3, 5, 4]]

class OpenWindowGenerator implements SectionGenerator {
  generateSection(context: GenerationContext) {
    const rng = context.random
    const event = createEventFactory(`ow-${context.sectionIndex}`)
    const events: MusicalEvent[] = []
    const bars = context.bars
    const beats = sectionBeats(bars)
    const strumDensity = param(context.parameters, 'strumDensity')
    const melodicActivity = param(context.parameters, 'melodicActivity')
    const percussionIntensity = param(context.parameters, 'percussionIntensity')
    const atmosphericTexture = param(context.parameters, 'atmosphericTexture')
    const episode = context.episode
    const rootMidi = 36 + (episode?.keyRootPc ?? ROOT_PC)
    const scale = episode?.scale ?? SCALE
    const movement = episode?.movement ?? 0.5
    const arrangement = densityForState(setState(context))
    const phrase = setPhrase(context)
    const degrees = PROGRESSIONS[context.setPlan?.harmony ?? 0]!
    const picked = (phrase + (context.setPlan?.groove ?? 0)) % 3 === 1

    for (let bar = 0; bar < bars; bar++) {
      const degree = degrees[(Math.floor(bar / 2) + phrase) % degrees.length]!
      const chord = scaleChord(rootMidi + 24, scale, degree, 4)
      const strums = strumDensity > 0.68 ? [0, 2, 3.5] : strumDensity > 0.25 ? [0, 2.5] : [0]
      for (const offset of strums) {
        if (offset > 0 && !chance(rng, 0.45 + strumDensity * 0.5)) continue
        for (const [index, pitch] of chord.entries()) {
          events.push(event({
            type: 'note', instrument: 'guitar-string', time: bar * 4 + offset + index * (picked ? 0.14 : 0.035),
            duration: 1.5 + strumDensity * 0.8, pitch, velocity: 0.3 + rng() * 0.22,
            parameters: { damping: 0.35 + (episode?.texture ?? 0.5) * 0.35 },
          }))
        }
      }

      if (atmosphericTexture > 0.05 && bar % 2 === 0) {
        for (const pitch of chord.slice(0, 3)) {
          events.push(event({
            type: 'note', instrument: 'synth-pad', time: bar * 4, duration: 9,
            pitch: pitch - 12, velocity: 0.12 + atmosphericTexture * 0.22,
          }))
        }
      }

      if (arrangement > 0.35) {
        events.push(event({
          type: 'note', instrument: 'soft-bass', time: bar * 4, duration: 2.4,
          pitch: chord[0]! - 24, velocity: 0.44 + movement * 0.18,
        }))
        if (movement > 0.5 && chance(rng, movement * 0.6)) {
          events.push(event({
            type: 'note', instrument: 'soft-bass', time: bar * 4 + 3, duration: 0.8,
            pitch: chord[0]! - 17, velocity: 0.38,
          }))
        }
      }

      if (percussionIntensity > 0.04 && arrangement > 0.4) {
        events.push(event({ type: 'drum', instrument: 'kick', time: bar * 4, duration: 0, velocity: 0.38 + percussionIntensity * 0.25 }))
        if (percussionIntensity > 0.5) {
          events.push(event({ type: 'drum', instrument: 'kick', time: bar * 4 + 2.5, duration: 0, velocity: 0.36 }))
        }
        for (const backbeat of [1, 3]) {
          events.push(event({
            type: 'drum', instrument: 'snare', time: bar * 4 + backbeat, duration: 0,
            velocity: 0.28 + percussionIntensity * 0.2, parameters: { age: 0.4 },
          }))
        }
        const hats = euclideanRhythm(8, 2 + Math.round(percussionIntensity * 4))
        for (let step = 0; step < 8; step++) {
          if (!hats[step]) continue
          events.push(event({
            type: 'drum', instrument: 'hi-hat', time: bar * 4 + step * 0.5,
            duration: 0, velocity: 0.12 + rng() * 0.15, parameters: { age: 0.35 },
          }))
        }
      }
    }

    if (melodicActivity > 0.05 && arrangement > 0.45) {
      const motifDegrees = context.setPlan?.motif ?? [0, 2, 1, 3, 2]
      const notes = 1 + Math.round(melodicActivity * 4)
      const start = (phrase % 2) * Math.min(16, beats / 2)
      for (let index = 0; index < notes; index++) {
        const bar = Math.min(bars - 1, Math.floor((start + index * 3) / 4))
        const degree = degrees[(Math.floor(bar / 2) + phrase) % degrees.length]!
        const chord = scaleChord(rootMidi + 36, scale, degree, 4)
        events.push(event({
          type: 'note', mixRole: 'lead', instrument: index % 3 === 2 ? 'bell' : 'guitar-string',
          time: start + index * 3, duration: 2.2,
          pitch: chord[motifDegrees[(index + (phrase % 2)) % motifDegrees.length]!]!,
          velocity: 0.26 + rng() * 0.2, parameters: { damping: 0.25 },
        }))
      }
    }

    return sectionFrom(context, bars, events, {
      energy: 0.3 + percussionIntensity * 0.3 + strumDensity * 0.2,
      harmony: degrees.map((degree) => `${scale}:${degree}`),
    })
  }
}

export const openWindowGenerator = new OpenWindowGenerator()

export const openWindowStation: StationDefinition = {
  id: 'indie',
  name: 'Open Window',
  tagline: 'Plucked strings, soft rhythm, and room to breathe.',
  description: 'Instrumental indie with Karplus-Strong guitar-like strings, repeating motifs, restrained percussion, soft bass, and atmospheric pads.',
  category: 'Instrumental indie',
  artworkPath: '/stations/indie/artwork.svg',
  accent: 'indie',
  defaultMood: 'daydream',
  moods: [
    { id: 'daydream', name: 'Daydream', parameters: { strumDensity: 0.52, melodicActivity: 0.5, percussionIntensity: 0.35, atmosphericTexture: 0.62 } },
    { id: 'sunlit', name: 'Sunlit', parameters: { strumDensity: 0.78, melodicActivity: 0.68, percussionIntensity: 0.58, atmosphericTexture: 0.35 } },
    { id: 'nocturnal', name: 'Nocturnal', parameters: { strumDensity: 0.3, melodicActivity: 0.34, percussionIntensity: 0.2, atmosphericTexture: 0.88 } },
  ],
  parameters: { strumDensity: 0.52, melodicActivity: 0.5, percussionIntensity: 0.35, atmosphericTexture: 0.62 },
  parameterSpecs: [
    { id: 'strumDensity', label: 'Strum density', min: 0, max: 1, step: 0.01, defaultValue: 0.52, format: 'percent' },
    { id: 'melodicActivity', label: 'Melodic activity', min: 0, max: 1, step: 0.01, defaultValue: 0.5, format: 'percent' },
    { id: 'percussionIntensity', label: 'Percussion intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.35, format: 'percent' },
    { id: 'atmosphericTexture', label: 'Atmospheric texture', min: 0, max: 1, step: 0.01, defaultValue: 0.62, format: 'percent' },
  ],
  tempo: { minBpm: 88, maxBpm: 118 },
  barsPerSection: 8,
  effects: { reverbWet: 0.4, reverbDecaySeconds: 3.8, delayTimeBeats: 0.75, delayFeedback: 0.32, delayWet: 0.15 },
  planSet: (seed, episode) => planStationSet('indie', openWindowStation.tempo, openWindowStation.barsPerSection, seed, episode),
  generator: openWindowGenerator,
}
