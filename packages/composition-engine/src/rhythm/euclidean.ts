/**
 * Euclidean rhythms (Bjorklund's algorithm): distribute `pulses` hits
 * evenly across `steps` positions. Classic tool for restrained,
 * non-repeating-sounding percussion patterns.
 */
export function euclideanRhythm(steps: number, pulses: number): boolean[] {
  if (steps <= 0) return []
  const count = Math.max(0, Math.min(pulses, steps))
  if (count === 0) return Array.from({ length: steps }, () => false)
  if (count === steps) return Array.from({ length: steps }, () => true)

  const counts: number[] = []
  const remainders: number[] = []
  let divisor = steps - count
  let level = 0
  remainders.push(count)

  while (true) {
    counts.push(Math.floor(divisor / remainders[level]!))
    remainders.push(divisor % remainders[level]!)
    divisor = remainders[level]!
    level += 1
    if (remainders[level]! <= 1) break
  }
  counts.push(divisor)

  const pattern: boolean[] = []
  const build = (target: number): void => {
    if (target === -1) {
      pattern.push(false)
      return
    }
    if (target === -2) {
      pattern.push(true)
      return
    }
    for (let i = 0; i < counts[target]!; i++) build(target - 1)
    if (remainders[target] !== 0) build(target - 2)
  }
  build(level)

  // Rotate so the pattern starts on a hit.
  const firstHit = pattern.indexOf(true)
  if (firstHit > 0) {
    pattern.push(...pattern.splice(0, firstHit))
  }
  return pattern
}
