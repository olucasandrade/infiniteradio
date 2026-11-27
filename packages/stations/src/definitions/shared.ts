import type { GenerationContext, MusicalSection } from '@infinite-radio/shared'
import { SCALES, barsToBeats, type ScaleName } from '@infinite-radio/composition-engine'

/** Stack thirds on a scale degree to build a diatonic chord. */
export function scaleChord(
  keyRootMidi: number,
  scale: ScaleName,
  degree: number,
  size = 3,
): number[] {
  const pattern = SCALES[scale]
  const notes: number[] = []
  for (let i = 0; i < size; i++) {
    const step = degree + i * 2
    const octave = Math.floor(step / pattern.length)
    const semitone = pattern[(step % pattern.length + pattern.length) % pattern.length]!
    notes.push(keyRootMidi + octave * 12 + semitone)
  }
  return notes
}

export function degreeAt(degrees: readonly number[], bar: number, barsPerChord: number): number {
  return degrees[Math.floor(bar / barsPerChord) % degrees.length]!
}

export function sectionFrom(
  context: GenerationContext,
  bars: number,
  events: MusicalSection['events'],
  extra: Partial<Pick<MusicalSection, 'energy' | 'harmony' | 'tempoBpm'>> = {},
): MusicalSection {
  return {
    id: `section-${context.sectionIndex}`,
    startBar: context.startBar,
    bars,
    energy: extra.energy ?? 0.5,
    harmony: extra.harmony,
    tempoBpm: extra.tempoBpm,
    events,
  }
}

export function sectionBeats(bars: number): number {
  return barsToBeats(bars)
}

/** Normalize a parameter that may be missing (defaults to 0.5). */
export function param(parameters: Record<string, number>, key: string): number {
  const value = parameters[key]
  return typeof value === 'number' ? Math.min(1, Math.max(0, value)) : 0.5
}
