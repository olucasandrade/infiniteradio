/**
 * Geometry of the circular volume control.
 *
 * The orbit sweeps 300° with a 60° gap centered at the bottom (6 o'clock).
 * Volume travels from the lower-left end of the gap, up the left side,
 * across the top, and down to the lower-right end. Angles are measured in
 * screen space: 0° points right, 90° points down, and values grow clockwise
 * on screen, which keeps atan2(dy, dx) math straightforward.
 */

export const VOLUME_TICK_COUNT = 60
export const VOLUME_SWEEP_DEG = 300
export const VOLUME_GAP_DEG = 360 - VOLUME_SWEEP_DEG

/** Screen-polar angle where the arc starts (lower-left end of the gap). */
export const ARC_START_DEG = 90 + VOLUME_GAP_DEG / 2

export interface Point {
  x: number
  y: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Normalized screen-polar angle in [0, 360). */
export function normalizeDeg(angle: number): number {
  return ((angle % 360) + 360) % 360
}

/**
 * Convert a pointer position (client coordinates) into a volume value.
 * Returns null when the pointer sits inside the bottom gap, so drags
 * across the gap never jump the volume.
 */
export function pointerAngleToVolume(
  pointerX: number,
  pointerY: number,
  center: Point,
): number | null {
  const angle = normalizeDeg((Math.atan2(pointerY - center.y, pointerX - center.x) * 180) / Math.PI)
  return arcAngleToVolume(angle)
}

/**
 * Convert a normalized screen-polar angle into a volume. The 60° bottom gap
 * maps to null; every other angle maps along the 300° sweep.
 */
export function arcAngleToVolume(angleDeg: number): number | null {
  const angle = normalizeDeg(angleDeg)
  const gapCenter = 90
  const gapHalf = VOLUME_GAP_DEG / 2
  const fromGap = normalizeDeg(angle - gapCenter)
  if (fromGap < gapHalf || fromGap > 360 - gapHalf) return null
  const travel = normalizeDeg(angle - ARC_START_DEG)
  return clamp(travel / VOLUME_SWEEP_DEG, 0, 1)
}

/** Point on the arc for a normalized volume, at the given radius. */
export function volumeToPoint(volume: number, radius: number, center: Point): Point {
  const angle = ((ARC_START_DEG + clamp(volume, 0, 1) * VOLUME_SWEEP_DEG) * Math.PI) / 180
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  }
}

/** Quantize a normalized volume for segment illumination only. */
export function quantizeVolume(volume: number, segments = VOLUME_TICK_COUNT): number {
  return clamp(Math.round(clamp(volume, 0, 1) * segments), 0, segments)
}
