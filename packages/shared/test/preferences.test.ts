import { describe, expect, it } from 'vitest'

import {
  DEFAULT_VOLUME,
  STATION_IDS,
  isStationId,
  parsePreferences,
  validatePreferences,
  type PlayerPreferences,
} from '../src'

const valid: PlayerPreferences = {
  favoriteStationIds: ['weightless', 'after-hours'],
  lastStationId: 'blue-notes',
  lastMoodByStation: { weightless: 'vast' },
  parametersByStation: { 'blue-notes': { swing: 0.4 } },
  volume: 0.5,
  muted: false,
  reducedMotion: true,
  visualizerEnabled: false,
  defaultStationId: 'weightless',
}

describe('station ids', () => {
  it('exposes the seven stations in discovery order', () => {
    expect(STATION_IDS).toEqual([
      'weightless',
      'hip-hop',
      'blue-notes',
      'neo-soul',
      'vaporwave',
      'indie',
      'after-hours',
    ])
  })

  it('validates station ids', () => {
    expect(isStationId('weightless')).toBe(true)
    expect(isStationId('techno')).toBe(false)
    expect(isStationId(42)).toBe(false)
  })
})

describe('validatePreferences', () => {
  it('accepts a complete valid payload', () => {
    expect(validatePreferences(valid)).toEqual(valid)
  })

  it('rejects non-records', () => {
    expect(validatePreferences(null)).toBeNull()
    expect(validatePreferences('nope')).toBeNull()
    expect(validatePreferences([1, 2, 3])).toBeNull()
  })

  it('rejects payloads without a valid last station', () => {
    expect(validatePreferences({ ...valid, lastStationId: 'unknown' })).toBeNull()
  })

  it('falls back per-field instead of failing when optional data is corrupt', () => {
    const result = validatePreferences({
      ...valid,
      favoriteStationIds: ['weightless', 7],
      volume: 'loud',
      muted: 'yes',
    })
    expect(result).not.toBeNull()
    expect(result?.favoriteStationIds).toEqual([])
    expect(result?.volume).toBe(DEFAULT_VOLUME)
    expect(result?.muted).toBe(false)
    expect(result?.lastStationId).toBe('blue-notes')
  })

  it('clamps parameter values into 0..1', () => {
    const result = validatePreferences({
      ...valid,
      parametersByStation: { weightless: { density: 4 } },
    })
    expect(result?.parametersByStation.weightless?.density).toBe(1)
  })
})

describe('parsePreferences', () => {
  it('parses valid JSON', () => {
    expect(parsePreferences(JSON.stringify(valid))).toEqual(valid)
  })

  it('returns null on invalid JSON', () => {
    expect(parsePreferences('{broken')).toBeNull()
  })

  it('returns null on null input', () => {
    expect(parsePreferences(null)).toBeNull()
  })
})
