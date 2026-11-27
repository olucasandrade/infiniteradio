/** Interval arithmetic in semitones. */

export const INTERVALS = {
  unison: 0,
  minorSecond: 1,
  majorSecond: 2,
  minorThird: 3,
  majorThird: 4,
  perfectFourth: 5,
  tritone: 6,
  perfectFifth: 7,
  minorSixth: 8,
  majorSixth: 9,
  minorSeventh: 10,
  majorSeventh: 11,
  octave: 12,
} as const

export type IntervalName = keyof typeof INTERVALS

export function transpose(midi: number, semitones: number): number {
  return midi + semitones
}

/** Shortest signed distance between two pitches, in semitones (-6..6). */
export function pitchDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 12
  return Math.min(diff, 12 - diff)
}
