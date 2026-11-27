import { chance, randomBetween, type RandomSource } from '../generation/rng'
import { nearestScaleTone } from '../theory/scales'

/** Small velocity changes (humanization). */
export function varyVelocity(rng: RandomSource, velocity: number, amount = 0.08): number {
  return Math.min(1, Math.max(0.05, velocity + randomBetween(rng, -amount, amount)))
}

/** Occasional octave displacement. */
export function varyOctave(
  rng: RandomSource,
  pitch: number,
  probability = 0.2,
  direction: 1 | -1 = 1,
): number {
  return chance(rng, probability) ? pitch + 12 * direction : pitch
}

/** Transpose a pitch along a scale, keeping the result diatonic. */
export function transposeInScale(
  scaleNotes: readonly number[],
  pitch: number,
  steps: number,
): number {
  const nearest = nearestScaleTone(scaleNotes, pitch)
  const index = scaleNotes.indexOf(nearest)
  if (index === -1) return nearest
  const target = index + steps
  const clamped = Math.min(scaleNotes.length - 1, Math.max(0, target))
  return scaleNotes[clamped]!
}

/** Subtle timing humanization, in beats. */
export function varyTiming(rng: RandomSource, amountBeats = 0.02): number {
  return randomBetween(rng, -amountBeats, amountBeats)
}
