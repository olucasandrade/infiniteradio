import { clamp } from '@infinite-radio/shared'

import type { RandomSource } from '../generation/rng'

export interface VelocityOptions {
  base: number
  /** Humanization amount 0..1. */
  variation?: number
  /** Accent boost on strong positions 0..1. */
  accent?: number
}

/** Deterministic velocity with optional humanization and accent. */
export function velocityAt(
  rng: RandomSource,
  position: { beat: number; strong: boolean },
  options: VelocityOptions,
): number {
  const variation = options.variation ?? 0.1
  const accent = options.accent ?? 0.15
  const humanize = (rng() * 2 - 1) * variation
  const accentBoost = position.strong ? accent : 0
  return clamp(options.base + humanize + accentBoost, 0.05, 1)
}
