/**
 * ADSR envelopes scheduled with AudioParam methods.
 *
 * All ramps use the AudioContext clock, never React state, so voices
 * release cleanly without clicks: the release ramp always ends at the
 * oscillator's scheduled stop time.
 */
export interface AdsrEnvelope {
  /** Seconds. */
  attack: number
  /** Seconds, measured from the end of attack. */
  decay: number
  /** Sustain level 0..1 (fraction of peak). */
  sustain: number
  /** Seconds, scheduled after the note duration ends. */
  release: number
}

export const DEFAULT_ENVELOPE: AdsrEnvelope = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.8,
  release: 0.2,
}

/**
 * Schedule an ADSR envelope on a gain AudioParam.
 *
 * @param param   the gain AudioParam to drive
 * @param time    AudioContext time of the note start
 * @param peak    peak gain (velocity-scaled by the caller)
 * @param duration note duration in seconds (attack→sustain portion)
 * @param envelope ADSR settings
 * @returns the AudioContext time at which the voice is fully silent
 */
export function applyEnvelope(
  param: AudioParam,
  time: number,
  peak: number,
  duration: number,
  envelope: AdsrEnvelope,
): number {
  const { attack, decay, sustain, release } = envelope
  const sustainLevel = Math.max(0.0001, peak * sustain)
  const body = Math.max(0.003, duration)
  const attackEnd = time + Math.min(body, Math.max(0.003, attack))
  const endTime = time + body
  const decayEnd = Math.min(endTime, attackEnd + decay)
  const releaseEnd = endTime + Math.max(0.005, release)

  param.setValueAtTime(0.0001, time)
  param.exponentialRampToValueAtTime(Math.max(0.0001, peak), attackEnd)
  if (decayEnd > attackEnd) {
    param.exponentialRampToValueAtTime(sustainLevel, decayEnd)
    param.setValueAtTime(sustainLevel, endTime)
  }
  param.exponentialRampToValueAtTime(0.0001, releaseEnd)

  return releaseEnd
}
