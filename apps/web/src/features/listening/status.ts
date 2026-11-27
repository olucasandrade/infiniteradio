import type { PlaybackStatus } from '@infinite-radio/shared'

/** Visible status copy for the single-screen player. */
export const STATUS_LABELS: Record<PlaybackStatus, string> = {
  idle: 'Press play to begin',
  ready: 'Ready to play',
  initializing: 'Starting your transmission…',
  playing: 'Live · Infinite transmission',
  paused: 'Paused',
  transitioning: 'Tuning the next station…',
  error: 'Audio unavailable',
}

/** Supporting explanation shown while the first transmission starts. */
export const INITIALIZING_NOTE = 'The first transmission can take a few seconds.'

/** Shared "is this station audible" helper. */
export function isAudible(status: PlaybackStatus): boolean {
  return status === 'playing' || status === 'transitioning'
}
