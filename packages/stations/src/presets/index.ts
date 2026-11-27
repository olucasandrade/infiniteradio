import type { StationDefinition, StationId, StationMood } from '@infinite-radio/shared'

import { weightlessStation } from '../definitions/weightless'
import { blueNotesStation } from '../definitions/blue-notes'
import { afterHoursStation } from '../definitions/after-hours'
import { lowEndStation } from '../definitions/hip-hop'
import { velvetStation } from '../definitions/neo-soul'
import { vaporTrailsStation } from '../definitions/vaporwave'
import { openWindowStation } from '../definitions/indie'

export const STATIONS: Record<StationId, StationDefinition> = {
  weightless: weightlessStation,
  'hip-hop': lowEndStation,
  'blue-notes': blueNotesStation,
  'neo-soul': velvetStation,
  vaporwave: vaporTrailsStation,
  indie: openWindowStation,
  'after-hours': afterHoursStation,
}

export const STATION_LIST: StationDefinition[] = [
  weightlessStation,
  lowEndStation,
  blueNotesStation,
  velvetStation,
  vaporTrailsStation,
  openWindowStation,
  afterHoursStation,
]

export function getStation(id: StationId): StationDefinition {
  return STATIONS[id]
}

export function getMood(station: StationDefinition, moodId: string): StationMood {
  return station.moods.find((mood) => mood.id === moodId) ?? station.moods[0]!
}

/**
 * Effective generation parameters for a station: station defaults, then
 * mood overrides, then user customization (already merged by the caller
 * for the customization layer).
 */
export function mergeMoodParameters(
  station: StationDefinition,
  moodId: string,
  customization: Record<string, number> = {},
): Record<string, number> {
  const mood = getMood(station, moodId)
  return { ...station.parameters, ...mood.parameters, ...customization }
}
