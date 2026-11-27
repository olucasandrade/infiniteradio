/** Pitch math shared by composition and audio engines (pure functions). */

export const A4_MIDI = 69
export const A4_FREQUENCY = 440

export function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12)
}

export function frequencyToMidi(frequency: number): number {
  return A4_MIDI + 12 * Math.log2(frequency / A4_FREQUENCY)
}
