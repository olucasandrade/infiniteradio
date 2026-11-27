/** Standard MIDI note numbering (C4 = 60) and pitch math (re-exported from shared). */

export { A4_FREQUENCY, A4_MIDI, frequencyToMidi, midiToFrequency } from '@infinite-radio/shared'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** MIDI note number to name, e.g. 60 -> "C4". */
export function midiToNoteName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[pc]}${octave}`
}

/** Parse a note name like "C4", "F#3", "Bb2" to a MIDI number. */
export function noteNameToMidi(name: string): number {
  const match = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name.trim())
  if (!match) throw new Error(`Invalid note name: ${name}`)
  const letter = match[1]!.toUpperCase()
  const accidental = match[2]
  const octave = Number(match[3])
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let pc = base[letter]!
  if (accidental === '#') pc += 1
  if (accidental === 'b') pc -= 1
  return ((pc + 12) % 12) + (octave + 1) * 12
}

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12
}
