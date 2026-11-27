import { pitchClass } from './midi'
import type { ScaleName } from '@infinite-radio/shared'

/** Scale definitions as semitone patterns from the root. */
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonicMinor: [0, 3, 5, 7, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
} as const satisfies Record<ScaleName, readonly number[]>

export type { ScaleName }

/** Concrete MIDI notes for a scale across the given octave span. */
export function getScaleNotes(rootMidi: number, scale: ScaleName, octaves = 2): number[] {
  const pattern = SCALES[scale]
  const notes: number[] = []
  for (let octave = 0; octave < octaves; octave++) {
    for (const semitone of pattern) {
      notes.push(rootMidi + octave * 12 + semitone)
    }
  }
  return notes
}

export function isScaleTone(scaleNotes: readonly number[], midi: number): boolean {
  const pc = pitchClass(midi)
  return scaleNotes.some((note) => pitchClass(note) === pc)
}

/** Nearest scale tone to a target pitch (prefers the target itself). */
export function nearestScaleTone(scaleNotes: readonly number[], midi: number): number {
  let best = scaleNotes[0]!
  let bestDistance = Infinity
  for (const note of scaleNotes) {
    const distance = Math.abs(note - midi)
    if (distance < bestDistance) {
      best = note
      bestDistance = distance
    }
  }
  return best
}
