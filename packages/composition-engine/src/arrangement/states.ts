import { randomBetween, type RandomSource } from '../generation/rng'

/**
 * Musical arrangement states — these describe layer density and energy,
 * not separate tracks. The cycle gives long-form music its shape.
 */
export type ArrangementState =
  | 'intro'
  | 'build'
  | 'main'
  | 'variation'
  | 'breakdown'
  | 'transition'

const CYCLE: ArrangementState[] = ['build', 'main', 'main', 'variation', 'main', 'breakdown']

/** Deterministic arrangement state for a section index. */
export function arrangementForSection(sectionIndex: number): ArrangementState {
  if (sectionIndex === 0) return 'intro'
  return CYCLE[(sectionIndex - 1) % CYCLE.length]!
}

/**
 * Energy for a section: slow drift around a base value so the music
 * breathes without obvious looping. Deterministic per seed + index.
 */
export function energyForSection(rng: RandomSource, baseEnergy: number): number {
  const drift = randomBetween(rng, -0.15, 0.15)
  return Math.min(1, Math.max(0, baseEnergy + drift))
}

/** Layer-density multiplier for an arrangement state (1 = full arrangement). */
export function densityForState(state: ArrangementState): number {
  switch (state) {
    case 'intro':
      return 0.35
    case 'build':
      return 0.55
    case 'main':
      return 0.85
    case 'variation':
      return 0.7
    case 'breakdown':
      return 0.45
    case 'transition':
      return 0.6
  }
}
