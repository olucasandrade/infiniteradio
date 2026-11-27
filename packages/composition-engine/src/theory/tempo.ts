import { BEATS_PER_BAR } from '@infinite-radio/shared'

export function secondsPerBeat(bpm: number): number {
  return 60 / bpm
}

export function beatsToSeconds(beats: number, bpm: number): number {
  return beats * secondsPerBeat(bpm)
}

export function secondsToBeats(seconds: number, bpm: number): number {
  return seconds / secondsPerBeat(bpm)
}

export function barsToBeats(bars: number): number {
  return bars * BEATS_PER_BAR
}

/** Global beat position (0-based) of a bar's start. */
export function barToBeat(bar: number): number {
  return barsToBeats(bar)
}

export function beatToBar(beat: number): number {
  return Math.floor(beat / BEATS_PER_BAR)
}

/** Position within the current bar, in beats (0..BEATS_PER_BAR). */
export function beatInBar(beat: number): number {
  return beat % BEATS_PER_BAR
}
