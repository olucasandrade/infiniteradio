/**
 * Seeded random generation.
 *
 * All composition randomness flows through these sources so a given seed
 * and section index always reproduce the same output — essential for
 * testing, debugging, and comparing configurations. Lives in shared so
 * both the composition engine and the audio scheduler can use it
 * without crossing package boundaries.
 */

export type RandomSource = () => number

/** mulberry32: small, fast, good-enough PRNG for musical decisions. */
export function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Mix a session seed with a section index into a derived 32-bit seed. */
export function hashSeed(seed: number, sectionIndex: number): number {
  let h = (seed ^ Math.imul(sectionIndex + 1, 0x9e3779b1)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x21f0aaad) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x735a2d97) >>> 0
  return (h ^ (h >>> 15)) >>> 0
}

/**
 * Independent random source for one section. Deriving per section (rather
 * than advancing one global stream) means section N is reproducible on its
 * own even if earlier sections change.
 */
export function createSectionRandom(seed: number, sectionIndex: number): RandomSource {
  return mulberry32(hashSeed(seed, sectionIndex))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function pick<T>(rng: RandomSource, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() requires a non-empty array')
  const index = Math.floor(rng() * items.length)
  return items[Math.min(index, items.length - 1)] as T
}

export function randomBetween(rng: RandomSource, min: number, max: number): number {
  return min + rng() * (max - min)
}

export function randomInt(rng: RandomSource, min: number, max: number): number {
  return Math.floor(randomBetween(rng, min, max + 1))
}

export function chance(rng: RandomSource, probability: number): boolean {
  return rng() < probability
}

/** Weighted pick: weights need not be normalized. */
export function pickWeighted<T>(
  rng: RandomSource,
  entries: ReadonlyArray<{ value: T; weight: number }>,
): T {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0)
  if (total <= 0) throw new Error('pickWeighted() requires positive total weight')
  let roll = rng() * total
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight)
    if (roll <= 0) return entry.value
  }
  return entries[entries.length - 1]!.value
}
