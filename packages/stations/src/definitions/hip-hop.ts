import type {
  GenerationContext,
  MusicalEvent,
  SectionGenerator,
  StationDefinition,
} from '@infinite-radio/shared'
import {
  applySwing,
  chance,
  createEventFactory,
  densityForState,
  euclideanRhythm,
  randomBetween,
  type ScaleName,
} from '@infinite-radio/composition-engine'

import { param, scaleChord, sectionBeats, sectionFrom } from './shared'
import { planStationSet, setPhrase, setState } from './set-plan'

const SCALE: ScaleName = 'dorian'
const DEFAULT_ROOT_PC = 2
const PROGRESSIONS = [[0, 3, 5, 4], [0, 5, 2, 3], [0, 6, 3, 5], [0, 2, 4, 3]]
const KICK_GRIDS = [[0, 3, 5], [0, 4, 7], [0, 1, 5], [0, 3, 4, 7]]

function chordForBar(bar: number, rootMidi: number, scale: ScaleName, degrees: number[]): number[] {
  const degree = degrees[Math.floor(bar / 2) % degrees.length]!
  return scaleChord(rootMidi, scale, degree, 4)
}

class LowEndGenerator implements SectionGenerator {
  generateSection(context: GenerationContext) {
    const rng = context.random
    const event = createEventFactory(`le-${context.sectionIndex}`)
    const events: MusicalEvent[] = []
    const bars = context.bars
    const beats = sectionBeats(bars)
    const drumDensity = param(context.parameters, 'drumDensity')
    const swingIntensity = param(context.parameters, 'swingIntensity')
    const bassIntensity = param(context.parameters, 'bassIntensity')
    const textureAge = param(context.parameters, 'textureAge')
    const episode = context.episode
    const rootMidi = 36 + (episode?.keyRootPc ?? DEFAULT_ROOT_PC)
    const scale = episode?.scale ?? SCALE
    const movement = episode?.movement ?? 0.5
    const episodeDensity = episode?.rhythmicDensity ?? movement
    const swing = Math.min(0.9, swingIntensity * 0.75 + (episode?.swing ?? 0) * 0.25)
    const age = Math.min(1, textureAge * 0.8 + (episode?.texture ?? 0.5) * 0.2)
    const state = setState(context)
    const arrangement = densityForState(state)
    const phrase = setPhrase(context)
    const degrees = PROGRESSIONS[context.setPlan?.harmony ?? 0]!
    const firstMain = context.setPlan?.form.indexOf('main') ?? 0
    const variation = Math.floor(Math.max(0, phrase - firstMain) / 2)
    const groove = context.setPlan?.groove ?? context.seed % KICK_GRIDS.length
    const grid = KICK_GRIDS[(groove + variation) % KICK_GRIDS.length]!
    const active = state !== 'intro' && state !== 'breakdown'
    const displace = (time: number) => applySwing(time, swing)

    if (active && drumDensity > 0.04) {
      for (let bar = 0; bar < bars; bar++) {
        const kickSteps = bar % 4 === 3 && drumDensity > 0.6 ? [...grid, 7] : grid
        for (let step = 0; step < 8; step++) {
          if (!kickSteps.includes(step) || (step !== 0 && drumDensity < 0.35 && step > 4)) continue
                    events.push(event({
            type: 'drum', instrument: 'kick', time: displace(bar * 4 + step * 0.5), duration: 0,
            velocity: 0.65 + drumDensity * 0.25,
            parameters: { punch: 0.45 + drumDensity * 0.3 },
          }))
        }

        for (const backbeat of [1, 3]) {
          events.push(event({
            type: 'drum', instrument: 'snare',
            time: bar * 4 + backbeat + 0.035 + swing * 0.055,
            duration: 0, velocity: 0.62 + drumDensity * 0.2,
            parameters: { age },
          }))
        }
        if (drumDensity > 0.55 && chance(rng, drumDensity * 0.55)) {
          events.push(event({
            type: 'drum', instrument: 'snare', time: displace(bar * 4 + 3.75),
            duration: 0, velocity: 0.16 + rng() * 0.12, parameters: { age },
          }))
        }
      }

      const steps = beats * 2
      const hats = euclideanRhythm(steps, Math.round(steps * (0.48 + drumDensity * 0.42)))
      for (let step = 0; step < steps; step++) {
        if (!hats[step]) continue
        const straight = step * 0.5
        events.push(event({
          type: 'drum', instrument: 'hi-hat', time: displace(straight), duration: 0,
          velocity: (step % 2 === 0 ? 0.24 : 0.36) + rng() * 0.14 + episodeDensity * 0.08,
          parameters: { age },
        }))
      }
    }

    if (bassIntensity > 0.04 && arrangement > 0.35) {
      for (let bar = 0; bar < bars; bar++) {
        const chord = chordForBar(context.startBar + bar, rootMidi, scale, degrees)
        const root = chord[0]! - 12
        const times = bassIntensity > 0.6 ? [0, 1.75, 2.75] : [0, 2.75]
        for (let i = 0; i < times.length; i++) {
          if (i > 0 && !chance(rng, 0.45 + bassIntensity * 0.5)) continue
          events.push(event({
            type: 'note', instrument: 'soft-bass', time: displace(bar * 4 + times[i]!),
            duration: i === 0 ? (state === 'breakdown' ? 2.75 : 1.45) : 0.65,
            pitch: i === 2 && chance(rng, 0.5) ? root + 7 : root,
            velocity: 0.48 + bassIntensity * 0.38,
          }))
        }
      }
    }

    if (arrangement >= 0.35) {
      for (let bar = 0; bar < bars; bar += 2) {
        const chord = chordForBar(context.startBar + bar, rootMidi + 24, scale, degrees)
        const fragmentLength = 2 + Math.round(movement)
        for (let tone = 0; tone < fragmentLength; tone++) {
          events.push(event({
            type: 'note', instrument: 'electric-piano',
            time: displace(bar * 4 + (tone === 0 ? 0 : 0.5 + tone * 0.5 + (phrase % 2) * 0.25)),
            duration: (state === 'breakdown' ? 5.75 : 2.8) - tone * 0.35,
            pitch: chord[((context.setPlan?.motif[tone] ?? tone) + (phrase % 2 && tone === fragmentLength - 1 ? 1 : 0)) % chord.length]!,
            velocity: 0.32 + rng() * 0.2,
            parameters: { age },
          }))
        }
      }
    }

    if (movement > 0.3 && arrangement > 0.5 && chance(rng, 0.45 + movement * 0.35)) {
      const chord = chordForBar(context.startBar, rootMidi + 36, scale, degrees)
      const count = 2 + Math.round(movement * 2)
      const start = Math.floor(randomBetween(rng, 0, Math.max(1, beats - 8)))
      for (let i = 0; i < count; i++) {
        events.push(event({
          type: 'note', instrument: 'bell', time: displace(start + i * 1.5),
          duration: 1.4, pitch: chord[(i * 2 + context.sectionIndex) % chord.length]!,
          velocity: 0.2 + rng() * 0.16,
        }))
      }
    }

    if (textureAge > 0.72 && state !== 'intro') {
      events.push(event({
        type: 'note', instrument: 'noise-texture', time: 0, duration: beats * 0.65,
        velocity: 0.23 + textureAge * 0.2,
        parameters: { texture: Math.min(1, 0.18 + age * 0.5), age },
      }))
    }

    return sectionFrom(context, bars, events, {
      energy: 0.35 + drumDensity * 0.35 + bassIntensity * 0.2,
      harmony: degrees.map((degree) => `${scale}:${degree}`),
    })
  }
}

export const lowEndGenerator = new LowEndGenerator()

export const lowEndStation: StationDefinition = {
  id: 'hip-hop',
  name: 'Low End',
  tagline: 'Dusty drums, warm bass, and unhurried fragments.',
  description: 'Instrumental hip-hop with syncopated boom-bap drums, swung hats, electric-piano fragments, and a worn tape texture.',
  category: 'Instrumental hip-hop',
  artworkPath: '/stations/hip-hop/artwork.svg',
  accent: 'hip-hop',
  defaultMood: 'boom-bap',
  moods: [
    { id: 'boom-bap', name: 'Boom Bap', parameters: { drumDensity: 0.72, swingIntensity: 0.48, bassIntensity: 0.72, textureAge: 0.42 } },
    { id: 'dusty', name: 'Dusty', parameters: { drumDensity: 0.52, swingIntensity: 0.62, bassIntensity: 0.58, textureAge: 0.9 } },
    { id: 'night-drive', name: 'Night Drive', parameters: { drumDensity: 0.6, swingIntensity: 0.3, bassIntensity: 0.88, textureAge: 0.25 } },
  ],
  parameters: { drumDensity: 0.72, swingIntensity: 0.48, bassIntensity: 0.72, textureAge: 0.42 },
  parameterSpecs: [
    { id: 'drumDensity', label: 'Drum density', min: 0, max: 1, step: 0.01, defaultValue: 0.72, format: 'percent' },
    { id: 'swingIntensity', label: 'Swing intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.48, format: 'percent' },
    { id: 'bassIntensity', label: 'Bass intensity', min: 0, max: 1, step: 0.01, defaultValue: 0.72, format: 'percent' },
    { id: 'textureAge', label: 'Texture age', min: 0, max: 1, step: 0.01, defaultValue: 0.42, format: 'percent' },
  ],
  tempo: { minBpm: 78, maxBpm: 96 },
  barsPerSection: 8,
  effects: { reverbWet: 0.22, reverbDecaySeconds: 1.8, delayTimeBeats: 0.75, delayFeedback: 0.25, delayWet: 0.08 },
  planSet: (seed, episode) => planStationSet('hip-hop', lowEndStation.tempo, lowEndStation.barsPerSection, seed, episode),
  generator: lowEndGenerator,
}
