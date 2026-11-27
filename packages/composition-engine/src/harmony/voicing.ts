import { pitchClass } from '../theory/midi'
import { midiAtOrAbove } from '../theory/keys'

/**
 * Voice a chord as a compact cluster around a target register. Every
 * pitch class appears once, voiced as close to `aroundMidi` as possible.
 */
export function voiceChord(
  chordNotes: readonly number[],
  aroundMidi: number,
  maxNotes = 4,
): number[] {
  const uniquePc = [...new Set(chordNotes.map(pitchClass))]
  const voiced = uniquePc
    .map((pc) => {
      const candidate = midiAtOrAbove(pc, aroundMidi - 6)
      return Math.abs(candidate - aroundMidi) <= 6 ? candidate : candidate - 12
    })
    .sort((a, b) => a - b)
  return voiced.slice(0, Math.max(1, maxNotes))
}

/**
 * Voice-lead from one chord to the next: choose octaves for the next
 * chord's pitch classes that minimize total voice movement.
 */
export function voiceLead(
  previousVoicing: readonly number[],
  nextChordNotes: readonly number[],
): number[] {
  if (previousVoicing.length === 0) return voiceChord(nextChordNotes, 60)
  const center =
    previousVoicing.reduce((sum, note) => sum + note, 0) / previousVoicing.length
  const uniquePc = [...new Set(nextChordNotes.map(pitchClass))]

  return uniquePc
    .map((pc) => {
      const atOrAbove = midiAtOrAbove(pc, Math.round(center) - 6)
      const candidates = [atOrAbove - 12, atOrAbove, atOrAbove + 12]
      let best = candidates[0]!
      let bestDistance = Infinity
      for (const candidate of candidates) {
        const distance = Math.min(
          ...previousVoicing.map((voice) => Math.abs(candidate - voice)),
          Math.abs(candidate - center),
        )
        if (distance < bestDistance) {
          best = candidate
          bestDistance = distance
        }
      }
      return best
    })
    .sort((a, b) => a - b)
}
