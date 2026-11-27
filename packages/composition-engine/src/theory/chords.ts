import { pitchClass } from './midi'

/** Chord qualities as semitone formulas from the root. */
export const CHORD_QUALITIES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  fifth: [0, 7],
  sixth: [0, 4, 7, 9],
  minor6: [0, 3, 7, 9],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
  minor7b5: [0, 3, 6, 10],
  diminished: [0, 3, 6, 9],
  add9: [0, 4, 7, 14],
  major9: [0, 4, 7, 11, 14],
  minor9: [0, 3, 7, 10, 14],
  minor11: [0, 3, 7, 10, 14, 17],
} as const

export type ChordQuality = keyof typeof CHORD_QUALITIES

export interface ChordSpec {
  /** Root pitch class 0..11 (0 = C). */
  rootPc: number
  quality: ChordQuality
}

/** Concrete MIDI notes for a chord rooted at the given MIDI note. */
export function buildChord(rootMidi: number, quality: ChordQuality): number[] {
  return CHORD_QUALITIES[quality].map((semitone) => rootMidi + semitone)
}

/**
 * Rotate a voicing to the given inversion. Inversions reorder the chord
 * tones by raising the lowest voices an octave; they never change the
 * underlying pitch classes.
 */
export function invert(chordNotes: readonly number[], inversion: number): number[] {
  if (chordNotes.length === 0) return []
  const sorted = [...chordNotes].sort((a, b) => a - b)
  const rotation = ((inversion % sorted.length) + sorted.length) % sorted.length
  return sorted
    .map((note, index) => (index < rotation ? note + 12 : note))
    .sort((a, b) => a - b)
}

/** Does the chord contain this pitch class? */
export function isChordTone(chordNotes: readonly number[], midi: number): boolean {
  const pc = pitchClass(midi)
  return chordNotes.some((note) => pitchClass(note) === pc)
}
