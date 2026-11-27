import type { ChordSpec } from '../theory/chords'

export type { ChordSpec }

/**
 * Predefined progression templates, expressed as scale-degree chord specs
 * in a major key. Transpose with `transposeProgression`.
 */
export const PROGRESSIONS = {
  /** I–vi–IV–V: warm, familiar. */
  popTurnaround: [
    { rootPc: 0, quality: 'major7' },
    { rootPc: 9, quality: 'minor7' },
    { rootPc: 5, quality: 'major7' },
    { rootPc: 7, quality: 'dominant7' },
  ],
  /** ii–V–I–vi: the jazz workhorse. */
  twoFiveOne: [
    { rootPc: 2, quality: 'minor7' },
    { rootPc: 7, quality: 'dominant7' },
    { rootPc: 0, quality: 'major7' },
    { rootPc: 9, quality: 'minor7' },
  ],
  /** i–VI–III–VII: minor, moody, nocturnal. */
  minorDescent: [
    { rootPc: 0, quality: 'minor9' },
    { rootPc: 8, quality: 'major7' },
    { rootPc: 3, quality: 'major7' },
    { rootPc: 10, quality: 'dominant7' },
  ],
  /** I–III–vi–VII: lifted, open. */
  openLift: [
    { rootPc: 0, quality: 'major7' },
    { rootPc: 4, quality: 'major7' },
    { rootPc: 9, quality: 'minor7' },
    { rootPc: 10, quality: 'dominant7' },
  ],
  /** i–iv–VII–V: modal drift. */
  modalDrift: [
    { rootPc: 0, quality: 'minor11' },
    { rootPc: 5, quality: 'minor7' },
    { rootPc: 10, quality: 'dominant7' },
    { rootPc: 7, quality: 'dominant7' },
  ],
} as const satisfies Record<string, ChordSpec[]>

export type ProgressionName = keyof typeof PROGRESSIONS

/** Shift a progression's roots by semitones (templates are in C). */
export function transposeProgression(progression: readonly ChordSpec[], semitones: number): ChordSpec[] {
  return progression.map((chord) => ({
    rootPc: (chord.rootPc + semitones + 12) % 12,
    quality: chord.quality,
  }))
}
