import type { StationId } from '@infinite-radio/shared'
import { getCurrentEpisode, getUpNextEpisode, type EpisodeReference } from '@infinite-radio/stations'

import { getEngine } from './engine'

/**
 * Drives the transmission rotation. While playback is active, the current
 * window's episode is applied to the engine and a timer re-arms at every
 * window boundary, so one melody hands over to the next as wall-clock time
 * passes — the engine crossfades each change. The rotation itself is
 * clock-derived (`getCurrentEpisode`), so a pause/resume simply re-syncs
 * to whatever episode is current.
 */
let activeStationId: StationId | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export function startEpisodeClock(stationId: StationId): void {
  activeStationId = stationId
  applyCurrentEpisode()
}

export function stopEpisodeClock(): void {
  activeStationId = null
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function applyCurrentEpisode(): void {
  if (activeStationId === null) return
  const stationId = activeStationId
  const now = Date.now()
  const current = getCurrentEpisode(stationId, now)
  const next = getUpNextEpisode(stationId, now)
  if (timer !== null) clearTimeout(timer)
  const apply = (episode: EpisodeReference) => getEngine().setEpisodeConstraint(episode.constraint, {
    stationId,
    startsAtMs: episode.startedAtMs,
    endsAtMs: episode.endsAtMs,
  })
  apply(current)

  // Queue the incoming audio against the Web Audio clock before the wall
  // clock reaches the boundary. Catch up to the live slot after timer stalls.
  timer = setTimeout(() => {
    if (Date.now() < next.endsAtMs) apply(next)
    timer = setTimeout(applyCurrentEpisode, Math.max(0, next.startedAtMs - Date.now()) + 25)
  }, Math.max(0, next.startedAtMs - now - 750))
}
