/** Beat grids: subdivide bars into event positions, in beats. */

/** Offsets (in beats) of every subdivision point across `bars` bars. */
export function subdivisionGrid(bars: number, subdivisionsPerBeat: number): number[] {
  const total = bars * 4 * subdivisionsPerBeat
  const points: number[] = []
  for (let i = 0; i < total; i++) {
    points.push(i / subdivisionsPerBeat)
  }
  return points
}

/** Eighth-note positions (0, .5, 1, 1.5, ...) across `bars` bars. */
export function eighthGrid(bars: number): number[] {
  return subdivisionGrid(bars, 2)
}

/** Sixteenth-note positions across `bars` bars. */
export function sixteenthGrid(bars: number): number[] {
  return subdivisionGrid(bars, 4)
}

/** Is this beat position on a strong beat (beat 1 or 3 of the bar)? */
export function isStrongBeat(beat: number): boolean {
  const inBar = beat % 4
  return inBar === 0 || inBar === 2
}
