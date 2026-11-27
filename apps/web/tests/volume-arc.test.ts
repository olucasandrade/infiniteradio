import { describe, expect, it } from 'vitest'

import {
  arcAngleToVolume,
  pointerAngleToVolume,
  quantizeVolume,
  volumeToPoint,
} from '../src/features/scene/volumeArc'

const CENTER = { x: 100, y: 100 }
const RADIUS = 50

function pointAtAngle(angleDeg: number) {
  const angle = (angleDeg * Math.PI) / 180
  return { x: CENTER.x + Math.cos(angle) * RADIUS, y: CENTER.y + Math.sin(angle) * RADIUS }
}

describe('volume arc math', () => {
  it('maps both arc endpoints to 0 and 100', () => {
    const start = volumeToPoint(0, RADIUS, CENTER)
    const end = volumeToPoint(1, RADIUS, CENTER)
    expect(pointerAngleToVolume(start.x, start.y, CENTER)).toBeCloseTo(0)
    expect(pointerAngleToVolume(end.x, end.y, CENTER)).toBeCloseTo(1)
  })

  it('maps the top of the arc to 50 for the symmetric 300° sweep', () => {
    expect(pointerAngleToVolume(CENTER.x, CENTER.y - RADIUS, CENTER)).toBeCloseTo(0.5)
  })

  it('travels up the left side first: the left point maps below 50', () => {
    const left = pointAtAngle(180)
    const volume = pointerAngleToVolume(left.x, left.y, CENTER)!
    expect(volume).toBeGreaterThan(0)
    expect(volume).toBeLessThan(0.5)
  })

  it('clamps values at both endpoints', () => {
    // Just inside the start edge and beyond the end edge.
    expect(arcAngleToVolume(121)).toBeCloseTo(1 / 300)
    expect(arcAngleToVolume(59)).toBeCloseTo(1)
  })

  it('returns null for pointer input inside the bottom gap', () => {
    expect(pointerAngleToVolume(CENTER.x, CENTER.y + RADIUS, CENTER)).toBeNull()
    expect(arcAngleToVolume(90)).toBeNull()
    expect(arcAngleToVolume(75)).toBeNull()
    expect(arcAngleToVolume(105)).toBeNull()
  })

  it('maps gap edges to the endpoints without jumping', () => {
    expect(arcAngleToVolume(120)).toBeCloseTo(0)
    expect(arcAngleToVolume(60)).toBeCloseTo(1)
  })

  it('quantizes only for display and clamps to the segment range', () => {
    expect(quantizeVolume(0)).toBe(0)
    expect(quantizeVolume(0.5)).toBe(30)
    expect(quantizeVolume(1)).toBe(60)
    expect(quantizeVolume(1.4)).toBe(60)
    expect(quantizeVolume(-0.4)).toBe(0)
  })
})
