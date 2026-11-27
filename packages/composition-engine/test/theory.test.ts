import { describe, expect, it } from 'vitest'

import {
  buildChord,
  invert,
  isChordTone,
  midiToFrequency,
  midiToNoteName,
  noteNameToMidi,
  frequencyToMidi,
  pitchClass,
  transpose,
  pitchDistance,
  getScaleNotes,
  isScaleTone,
  nearestScaleTone,
  beatsToSeconds,
  secondsToBeats,
  barsToBeats,
  beatToBar,
  beatInBar,
  INTERVALS,
} from '../src'

describe('midi and frequency conversion', () => {
  it('converts A4 to 440Hz and C4 to ~261.63Hz', () => {
    expect(midiToFrequency(69)).toBe(440)
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 2)
  })

  it('round-trips frequency to midi', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69)
    expect(frequencyToMidi(midiToFrequency(57))).toBeCloseTo(57)
  })

  it('maps note names', () => {
    expect(noteNameToMidi('C4')).toBe(60)
    expect(noteNameToMidi('A4')).toBe(69)
    expect(noteNameToMidi('F#3')).toBe(54)
    expect(noteNameToMidi('Bb2')).toBe(46)
    expect(midiToNoteName(60)).toBe('C4')
    expect(midiToNoteName(70)).toBe('A#4')
  })

  it('computes pitch classes', () => {
    expect(pitchClass(60)).toBe(0)
    expect(pitchClass(70)).toBe(10)
    expect(pitchClass(59)).toBe(11)
  })
})

describe('intervals', () => {
  it('transposes by semitones', () => {
    expect(transpose(60, INTERVALS.perfectFifth)).toBe(67)
    expect(transpose(60, -INTERVALS.majorThird)).toBe(56)
  })

  it('computes shortest pitch-class distance', () => {
    expect(pitchDistance(60, 67)).toBe(5) // C to G: 7 up, 5 down
    expect(pitchDistance(60, 71)).toBe(1) // B is a semitone below C
    expect(pitchDistance(60, 72)).toBe(0) // same pitch class
  })
})

describe('scales', () => {
  it('builds scale notes across octaves', () => {
    const cMajor = getScaleNotes(60, 'major', 1)
    expect(cMajor).toEqual([60, 62, 64, 65, 67, 69, 71])
  })

  it('checks scale membership by pitch class', () => {
    const cMajor = getScaleNotes(60, 'major', 2)
    expect(isScaleTone(cMajor, 74)).toBe(true) // D5
    expect(isScaleTone(cMajor, 63)).toBe(false) // D#4
  })

  it('finds the nearest scale tone', () => {
    const cMajor = getScaleNotes(60, 'major', 2)
    expect(nearestScaleTone(cMajor, 61.4)).toBe(62)
    expect(nearestScaleTone(cMajor, 60)).toBe(60)
  })
})

describe('chords', () => {
  it('builds chord tones from the root', () => {
    expect(buildChord(60, 'major')).toEqual([60, 64, 67])
    expect(buildChord(60, 'minor7')).toEqual([60, 63, 67, 70])
    expect(buildChord(62, 'dominant7')).toEqual([62, 66, 69, 72])
  })

  it('produces inversions that preserve pitch classes', () => {
    const chord = buildChord(60, 'major')
    const first = invert(chord, 1)
    expect(first).toEqual([64, 67, 72])
    expect(first.map(pitchClass).sort()).toEqual([0, 4, 7])
    const second = invert(chord, 2)
    expect(second.map(pitchClass).sort()).toEqual([0, 4, 7])
    expect(invert(chord, 3)).toEqual(chord)
  })

  it('detects chord tones across octaves', () => {
    const chord = buildChord(60, 'minor7')
    expect(isChordTone(chord, 75)).toBe(true) // Eb5
    expect(isChordTone(chord, 66)).toBe(false) // F#4
  })
})

describe('tempo and beat calculations', () => {
  it('converts between beats and seconds', () => {
    expect(beatsToSeconds(4, 120)).toBe(2)
    expect(secondsToBeats(2, 120)).toBe(4)
    expect(beatsToSeconds(1, 60)).toBe(1)
  })

  it('computes bars and bar positions', () => {
    expect(barsToBeats(2)).toBe(8)
    expect(beatToBar(0)).toBe(0)
    expect(beatToBar(7.9)).toBe(1)
    expect(beatToBar(8)).toBe(2)
    expect(beatInBar(6)).toBe(2)
  })
})
