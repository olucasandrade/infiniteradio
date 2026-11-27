/** localStorage key for persisted preferences. */
export const PREFERENCES_STORAGE_KEY = 'infinite-radio:preferences:v1'

export const DEFAULT_VOLUME = 0.8
export const MIN_VOLUME = 0
export const MAX_VOLUME = 1

/** Crossfade length when switching stations, in seconds. */
export const DEFAULT_TRANSITION_SECONDS = 3

/** Scheduler tuning (see packages/audio-engine/src/scheduling). */
export const SCHEDULER_INTERVAL_MS = 100
export const SCHEDULER_LOOKAHEAD_SECONDS = 1.0
/** Keep at least this many seconds of future material scheduled. */
export const MIN_SCHEDULED_AHEAD_SECONDS = 2.0

/** Beats per bar throughout the composition engine. */
export const BEATS_PER_BAR = 4
