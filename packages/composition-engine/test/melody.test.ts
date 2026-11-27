import { describe, expect, it } from 'vitest'

import {
  buildChord,
  generateMelodyPhrase,
  getScaleNotes,
  isChordTone,
  isScaleTone,
  midiToNoteName,
  createSectionRandom,
  voiceChord,
  voiceLead,
  PROGRESSIONS,
  transposeProgression,
  type PhraseNote,
} from '../src'

describe('melody generation', () => {
  const options = {
    keyRootMidi: 60,
    scale: 'major' as const,
    chordRootMidi: 60,
    chordQuality: 'major7' as const,
    phraseLengthBeats: 4,
    noteCount: 6,
    complexity: 0.5,
    registerMidi: 72,
    octaveSpan: 1,
  }

  it('only produces scale tones within the register range', () => {
    const rng = createSectionRandom(11, 0)
    const scale = getScaleNotes(48, 'major', 4)
    for (let i = 0; i < 25; i++) {
      const phrase = generateMelodyPhrase({ ...options, rng })
      for (const note of phrase) {
        expect(isScaleTone(scale, note.pitch)).toBe(true)
        expect(note.pitch).toBeGreaterThanOrEqual(60)
        expect(note.pitch).toBeLessThanOrEqual(90)
      }
    }
  })

  it('anchors strong beats to chord tones', () => {
    const chord = buildChord(60, 'major7')
    const rng = createSectionRandom(3, 0)
    let checked = 0
    for (let i = 0; i < 40; i++) {
      const phrase = generateMelodyPhrase({ ...options, rng, complexity: 0.2 })
      for (const note of phrase) {
        if (note.time === 0) {
          expect(isChordTone(chord, note.pitch)).toBe(true)
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('is reproducible for the same rng seed', () => {
    const a = generateMelodyPhrase({ ...options, rng: createSectionRandom(8, 2) })
    const b = generateMelodyPhrase({ ...options, rng: createSectionRandom(8, 2) })
    expect(a.map((n: PhraseNote) => `${n.pitch}@${n.time}`)).toEqual(
      b.map((n: PhraseNote) => `${n.pitch}@${n.time}`),
    )
  })

  it('limits leaps between consecutive notes', () => {
    const rng = createSectionRandom(21, 5)
    for (let i = 0; i < 30; i++) {
      const phrase = generateMelodyPhrase({ ...options, rng })
      for (let j = 1; j < phrase.length; j++) {
        expect(Math.abs(phrase[j]!.pitch - phrase[j - 1]!.pitch)).toBeLessThanOrEqual(12)
      }
    }
  })

  it('quotes previous phrases as variation', () => {
    const previous = generateMelodyPhrase({ ...options, rng: createSectionRandom(1, 0) })
    const varied = generateMelodyPhrase({
      ...options,
      rng: createSectionRandom(1, 1),
      previousPhrase: previous,
    })
    expect(varied.length).toBeGreaterThan(0)
  })
})

describe('voicing and voice leading', () => {
  it('voices chords compactly around a register', () => {
    const voiced = voiceChord(buildChord(60, 'major9'), 60)
    expect(voiced.length).toBe(4)
    for (const note of voiced) {
      expect(Math.abs(note - 60)).toBeLessThanOrEqual(12)
    }
  })

  it('minimizes movement between consecutive chords', () => {
    const first = voiceChord(buildChord(60, 'major7'), 60)
    const next = voiceLead(first, buildChord(62, 'minor7'))
    const movement = next.reduce(
      (sum, note) =>
        sum + Math.min(...first.map((voice) => Math.abs(note - voice))),
      0,
    )
    // A naive root-position jump (D3 F#3 ...) would move much farther.
    expect(movement).toBeLessThan(24)
    expect(next.length).toBe(4)
  })
})

describe('progressions', () => {
  it('provides transposable templates', () => {
    const prog = PROGRESSIONS.twoFiveOne
    expect(prog).toHaveLength(4)
    const transposed = transposeProgression(prog, 2)
    expect(transposed[0]).toEqual({ rootPc: 4, quality: 'minor7' })
    expect(transposed[2]).toEqual({ rootPc: 2, quality: 'major7' })
  })

  it('stays within pitch classes when transposed by octaves worth of semitones', () => {
    const transposed = transposeProgression(PROGRESSIONS.popTurnaround, 14)
    for (const chord of transposed) {
      expect(chord.rootPc).toBeGreaterThanOrEqual(0)
      expect(chord.rootPc).toBeLessThan(12)
    }
  })
})

describe('note naming sanity', () => {
  it('voiced chords print as readable notes', () => {
    const voiced = voiceChord(buildChord(57, 'minor7'), 57)
    expect(voiced.map(midiToNoteName)).toContain('A3')
  })
})
