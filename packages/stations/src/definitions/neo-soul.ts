import type {
  GenerationContext,
  MusicalEvent,
  SectionGenerator,
  StationDefinition,
} from '@infinite-radio/shared'
import {
  buildChord,
  chance,
  createEventFactory,
  createSectionRandom,
  SCALES,
  densityForState,
  generateMelodyPhrase,
  voiceChord,
  voiceLead,
  type ChordQuality,
  type ChordSpec,
  type ScaleName,
} from '@infinite-radio/composition-engine'

import { param, sectionBeats, sectionFrom } from './shared'
import { planStationSet, setPhrase, setState } from './set-plan'

const SCALE: ScaleName = 'dorian'
const ROOT_PC = 5
const PROGRESSIONS = [[0, 5, 3, 4], [0, 3, 5, 4], [0, 2, 5, 3], [0, 5, 1, 4]]
const POCKETS = [[0, 1.75, 2.5, 3.75], [0, 1.5, 2.75, 3.5], [0, 0.75, 2.5, 3.25], [0, 1.25, 2, 3.5]]

function qualityFor(rootPc: number, complexity: number): ChordQuality {
  if (complexity > 0.72) return rootPc === 0 ? 'minor11' : 'major9'
  if (complexity > 0.38) return rootPc === 0 ? 'minor9' : 'major9'
  return rootPc === 0 ? 'minor7' : 'major7'
}

class VelvetGenerator implements SectionGenerator {
  generateSection(context: GenerationContext) {
    const rng = context.random
    const event = createEventFactory(`ns-${context.sectionIndex}`)
    const events: MusicalEvent[] = []
    const bars = context.bars
    const beats = sectionBeats(bars)
    const harmonicComplexity = param(context.parameters, 'harmonicComplexity')
    const rhythmicDensity = param(context.parameters, 'rhythmicDensity')
    const bassMovement = param(context.parameters, 'bassMovement')
    const melodicActivity = param(context.parameters, 'melodicActivity')
    const episode = context.episode
    const rootPc = episode?.keyRootPc ?? ROOT_PC
    const scale = episode?.scale ?? SCALE
    const movement = episode?.movement ?? 0.5
    const drumDensity = rhythmicDensity * 0.75 + (episode?.rhythmicDensity ?? movement) * 0.25
    const arrangement = densityForState(setState(context))
    const behind = 0.075 + drumDensity * 0.055
    const phraseIndex = setPhrase(context)
    const pocket = POCKETS[((context.setPlan?.groove ?? 0) + Math.floor(phraseIndex / 2)) % POCKETS.length]!
    const specs: ChordSpec[] = PROGRESSIONS[context.setPlan?.harmony ?? 0]!.map((offset) => ({
      rootPc: (rootPc + (SCALES[scale][offset % SCALES[scale].length] ?? 0)) % 12,
      quality: qualityFor(offset, harmonicComplexity),
    }))

    const voicings: number[][] = []
    for (const spec of specs) {
      const chord = buildChord(48 + spec.rootPc, spec.quality)
      const previous = voicings.at(-1) ?? voiceChord(chord, 57, 4)
      voicings.push(voiceLead(previous, chord))
    }

    if (arrangement >= 0.35) {
      for (let bar = 0; bar < bars; bar += 2) {
        const chordIndex = (bar / 2 + phraseIndex) % specs.length
        const voicing = voicings[chordIndex]!
        events.push(event({
          type: 'note', instrument: 'synth-pad', time: bar * 4, duration: 8,
          pitch: specs[chordIndex]!.rootPc + 36, velocity: 0.2 + harmonicComplexity * 0.14,
        }))
        for (const [index, pitch] of voicing.entries()) {
          events.push(event({
            type: 'note', instrument: 'electric-piano', time: bar * 4 + 0.12 + index * 0.025,
            duration: 5.8, pitch, velocity: 0.34 + rng() * 0.14,
          }))
        }
        if (chance(rng, 0.35 + drumDensity * 0.45)) {
          for (const pitch of voicing.slice(1)) {
            events.push(event({
              type: 'note', instrument: 'electric-piano', time: bar * 4 + 3.5 + behind,
              duration: 0.8, pitch, velocity: 0.25 + rng() * 0.12,
            }))
          }
        }
      }
    }

    if (arrangement > 0.4) {
      for (let bar = 0; bar < bars; bar++) {
        const spec = specs[(Math.floor(bar / 2) + phraseIndex) % specs.length]!
        const root = 24 + spec.rootPc
        const pattern = bassMovement > 0.65 ? pocket : bassMovement > 0.25 ? [0, pocket[2]!] : [0]
        for (const [index, offset] of pattern.entries()) {
          if (index > 1 && !chance(rng, bassMovement)) continue
          events.push(event({
            type: 'note', instrument: 'soft-bass', time: bar * 4 + offset + (offset > 0 ? behind : 0),
            duration: index === 0 ? 1.4 : 0.65,
            pitch: root + (index === 2 ? 7 : index === 3 ? 12 : 0),
            velocity: 0.45 + bassMovement * 0.32,
          }))
        }

        if (rhythmicDensity > 0.04 && drumDensity > 0.04) {
          events.push(event({ type: 'drum', instrument: 'kick', time: bar * 4, duration: 0, velocity: 0.52 + drumDensity * 0.2 }))
          if (chance(rng, 0.3 + drumDensity * 0.55)) {
            events.push(event({ type: 'drum', instrument: 'kick', time: bar * 4 + 2.75, duration: 0, velocity: 0.45 }))
          }
          for (const backbeat of [1, 3]) {
            events.push(event({
              type: 'drum', instrument: 'snare', time: bar * 4 + backbeat + behind,
              duration: 0, velocity: 0.38 + drumDensity * 0.2, parameters: { age: 0.25 },
            }))
          }
          const subdivisions = drumDensity > 0.65 ? 4 : 2
          for (let step = 0; step < 4 * subdivisions; step++) {
            if (!chance(rng, 0.5 + drumDensity * 0.42)) continue
            events.push(event({
              type: 'drum', instrument: 'hi-hat', time: bar * 4 + step / subdivisions + behind * 0.5,
              duration: 0, velocity: 0.16 + rng() * 0.18,
            }))
          }
        }
      }
    }

    if (melodicActivity > 0.08 && arrangement > 0.45) {
      const phraseStart = phraseIndex % 2 ? 8 : 0
      const spec = specs[(phraseIndex + phraseStart / 8) % specs.length]!
      const phrase = generateMelodyPhrase({
        rng: createSectionRandom(context.seed, 71), keyRootMidi: 48 + rootPc, scale, chordRootMidi: 48 + spec.rootPc,
        chordQuality: spec.quality, phraseLengthBeats: Math.min(8, beats),
        noteCount: Math.max(1, Math.round(melodicActivity * 5)), complexity: harmonicComplexity,
        registerMidi: 72 + Math.round((episode?.brightness ?? 0.5) * 3), octaveSpan: 1,
      })
      for (const note of phrase) {
        events.push(event({
          type: 'note', mixRole: 'lead', instrument: phraseIndex % 2 === 0 ? 'bell' : 'electric-piano', time: phraseStart + note.time + behind,
          duration: note.duration * 1.2, pitch: note.pitch, velocity: note.velocity * 0.52,
        }))
      }
    }

    return sectionFrom(context, bars, events, {
      energy: 0.3 + drumDensity * 0.3 + bassMovement * 0.18,
      harmony: specs.map((spec) => `${spec.rootPc}:${spec.quality}`),
    })
  }
}

export const velvetGenerator = new VelvetGenerator()

export const velvetStation: StationDefinition = {
  id: 'neo-soul',
  name: 'Velvet',
  tagline: 'Close harmony and a groove that takes its time.',
  description: 'Neo-soul with behind-the-beat drums, extended electric-piano voicings, syncopated bass, and restrained melodic decoration.',
  category: 'Neo-soul',
  artworkPath: '/stations/neo-soul/artwork.svg',
  accent: 'neo-soul',
  defaultMood: 'velvet',
  moods: [
    { id: 'velvet', name: 'Velvet', parameters: { harmonicComplexity: 0.62, rhythmicDensity: 0.48, bassMovement: 0.58, melodicActivity: 0.34 } },
    { id: 'intimate', name: 'Intimate', parameters: { harmonicComplexity: 0.76, rhythmicDensity: 0.25, bassMovement: 0.36, melodicActivity: 0.5 } },
    { id: 'groove', name: 'Groove', parameters: { harmonicComplexity: 0.48, rhythmicDensity: 0.78, bassMovement: 0.84, melodicActivity: 0.25 } },
  ],
  parameters: { harmonicComplexity: 0.62, rhythmicDensity: 0.48, bassMovement: 0.58, melodicActivity: 0.34 },
  parameterSpecs: [
    { id: 'harmonicComplexity', label: 'Harmonic complexity', min: 0, max: 1, step: 0.01, defaultValue: 0.62, format: 'percent' },
    { id: 'rhythmicDensity', label: 'Rhythmic density', min: 0, max: 1, step: 0.01, defaultValue: 0.48, format: 'percent' },
    { id: 'bassMovement', label: 'Bass movement', min: 0, max: 1, step: 0.01, defaultValue: 0.58, format: 'percent' },
    { id: 'melodicActivity', label: 'Melodic activity', min: 0, max: 1, step: 0.01, defaultValue: 0.34, format: 'percent' },
  ],
  tempo: { minBpm: 68, maxBpm: 88 },
  barsPerSection: 8,
  effects: { reverbWet: 0.38, reverbDecaySeconds: 3.4, delayTimeBeats: 0.75, delayFeedback: 0.28, delayWet: 0.12 },
  planSet: (seed, episode) => planStationSet('neo-soul', velvetStation.tempo, velvetStation.barsPerSection, seed, episode),
  generator: velvetGenerator,
}
