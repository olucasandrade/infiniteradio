import type { ScaleName } from './scales'

export interface KeyDefinition {
  /** Root MIDI note, e.g. 60 for C. */
  rootMidi: number
  scale: ScaleName
}

/** MIDI note for pitch class at or above a floor MIDI note. */
export function midiAtOrAbove(pc: number, floorMidi: number): number {
  const normalized = ((pc % 12) + 12) % 12
  const floorPc = ((floorMidi % 12) + 12) % 12
  const delta = (normalized - floorPc + 12) % 12
  return floorMidi + delta
}
