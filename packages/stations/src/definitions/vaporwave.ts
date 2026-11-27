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

import { degreeAt, param, scaleChord, sectionBeats, sectionFrom } from './shared'
import { planStationSet, setPhrase, setState } from './set-plan'

const SCALE: ScaleName = 'naturalMinor'
const ROOT_PC = 1
const PROGRESSIONS = [[0, 5, 2, 3], [0, 3, 5, 2], [0, 2, 6, 3], [0, 4, 2, 5]]

class VaporTrailsGenerator implements SectionGenerator {
  generateSection(context: GenerationContext) {
    const rng = context.random
    const event = createEventFactory(`vt-${context.sectionIndex}`)
    const events: MusicalEvent[] = []
    const bars = context.bars
    const beats = sectionBeats(bars)
    const textureDensity = param(context.parameters, 'textureDensity')
    const tapeWobble = param(context.parameters, 'tapeWobble')
    const rhythmicDensity = param(context.parameters, 'rhythmicDensity')
    const spatialDepth = param(context.parameters, 'spatialDepth')
    const episode = context.episode
    const rootMidi = 36 + (episode?.keyRootPc ?? ROOT_PC)
    const scale = episode?.scale ?? SCALE
    const movement = episode?.movement ?? 0.5
    const arrangement = densityForState(setState(context))
    const phrase = setPhrase(context)
    const degrees = PROGRESSIONS[context.setPlan?.harmony ?? 0]!
    const chordAt = (bar: number) => degreeAt(degrees, bar + phrase * 4, 4)
    const wobble = Math.min(1, tapeWobble + (episode?.texture ?? 0.5) * 0.18)

    for (let bar = 0; bar < bars; bar += 4) {
      const degree = chordAt(bar)
      const chord = scaleChord(rootMidi + 12, scale, degree, 4)
      const layers = Math.max(2, Math.round(2 + textureDensity * 3 + (episode?.brightness ?? 0.5)))
      for (let layer = 0; layer < layers; layer++) {
        const pitch = chord[layer % chord.length]! + (layer >= chord.length ? 12 : 0)
        events.push(event({
          type: 'note', instrument: 'synth-pad', time: bar * 4, duration: 14 + spatialDepth * 2,
          pitch, velocity: (0.2 + spatialDepth * 0.16) * Math.max(0.55, arrangement),
          parameters: { wobble, texture: episode?.texture ?? 0.5 },
        }))
      }
      events.push(event({
        type: 'note', instrument: 'drone', time: bar * 4, duration: 15,
        pitch: chord[0]! - 12, velocity: 0.34 + spatialDepth * 0.2,
      }))
    }

    if (rhythmicDensity > 0.04 && arrangement > 0.35) {
      for (let bar = 0; bar < bars; bar++) {
        events.push(event({
          type: 'drum', instrument: 'kick', time: bar * 4, duration: 0,
          velocity: 0.32 + rhythmicDensity * 0.28, parameters: { punch: 0.25 },
        }))
        events.push(event({
          type: 'drum', instrument: 'snare', time: bar * 4 + 2.08, duration: 0,
          velocity: 0.2 + rhythmicDensity * 0.2, parameters: { age: 0.85 },
        }))
        const hats = euclideanRhythm(8, Math.max(1, Math.round(1 + rhythmicDensity * 5)))
        for (let step = 0; step < 8; step++) {
          if (!hats[(step + (context.setPlan?.groove ?? 0) + phrase) % 8]) continue
          events.push(event({
            type: 'drum', instrument: 'hi-hat', time: bar * 4 + step * 0.5,
            duration: 0, velocity: 0.1 + rng() * 0.13, parameters: { age: 0.8 },
          }))
        }
      }
    }

    if (arrangement > 0.45) {
      for (let bar = 0; bar < bars; bar += 2) {
        const degree = chordAt(bar)
        const chord = scaleChord(rootMidi, scale, degree, 4)
        events.push(event({
          type: 'note', instrument: 'sub-bass', time: bar * 4, duration: 7.8,
          pitch: chord[0]!, velocity: 0.28 + movement * 0.2,
        }))
        if (chance(rng, 0.22 + movement * 0.45)) {
          events.push(event({
            type: 'note', instrument: 'pluck', time: bar * 4 + (phrase % 2 === 0 ? 3 : 1.5),
            duration: 3.5, pitch: chord[context.setPlan?.motif[(bar / 2) % 4] ?? 2]! + 24, velocity: 0.18 + spatialDepth * 0.16,
          }))
        }
      }
    }

    const textures = tapeWobble > 0.78 || spatialDepth > 0.9 ? 1 : 0
    for (let layer = 0; layer < textures; layer++) {
      events.push(event({
        type: 'note', instrument: 'noise-texture', time: layer * beats * 0.25,
        duration: beats * 0.75, velocity: 0.18 + spatialDepth * 0.36,
        parameters: { texture: 0.15 + spatialDepth * 0.4, age: 0.8 },
      }))
    }

    return sectionFrom(context, bars, events, {
      energy: 0.2 + rhythmicDensity * 0.28 + textureDensity * 0.15,
      harmony: degrees.map((degree) => `${scale}:${degree}`),
    })
  }
}

export const vaporTrailsGenerator = new VaporTrailsGenerator()

export const vaporTrailsStation: StationDefinition = {
  id: 'vaporwave',
  name: 'Vapor Trails',
  tagline: 'Slow signals dissolving into synthetic air.',
  description: 'Original vaporwave generation with detuned pads, half-time percussion, tape-like pitch drift, sparse bass, and degraded noise.',
  category: 'Vaporwave',
  artworkPath: '/stations/vaporwave/artwork.svg',
  accent: 'vaporwave',
  defaultMood: 'dreamscape',
  moods: [
    { id: 'dreamscape', name: 'Dreamscape', parameters: { textureDensity: 0.68, tapeWobble: 0.35, rhythmicDensity: 0.3, spatialDepth: 0.75 } },
    { id: 'mallsoft', name: 'Mallsoft', parameters: { textureDensity: 0.82, tapeWobble: 0.18, rhythmicDensity: 0.14, spatialDepth: 0.95 } },
    { id: 'signal-loss', name: 'Signal Loss', parameters: { textureDensity: 0.45, tapeWobble: 0.88, rhythmicDensity: 0.48, spatialDepth: 0.55 } },
  ],
  parameters: { textureDensity: 0.68, tapeWobble: 0.35, rhythmicDensity: 0.3, spatialDepth: 0.75 },
  parameterSpecs: [
    { id: 'textureDensity', label: 'Texture density', min: 0, max: 1, step: 0.01, defaultValue: 0.68, format: 'percent' },
    { id: 'tapeWobble', label: 'Tape wobble', min: 0, max: 1, step: 0.01, defaultValue: 0.35, format: 'percent' },
    { id: 'rhythmicDensity', label: 'Rhythmic density', min: 0, max: 1, step: 0.01, defaultValue: 0.3, format: 'percent' },
    { id: 'spatialDepth', label: 'Spatial depth', min: 0, max: 1, step: 0.01, defaultValue: 0.75, format: 'percent' },
  ],
  tempo: { minBpm: 60, maxBpm: 84 },
  barsPerSection: 8,
  effects: { reverbWet: 0.58, reverbDecaySeconds: 6.8, delayTimeBeats: 1.5, delayFeedback: 0.48, delayWet: 0.26 },
  planSet: (seed, episode) => planStationSet('vaporwave', vaporTrailsStation.tempo, vaporTrailsStation.barsPerSection, seed, episode),
  generator: vaporTrailsGenerator,
}
