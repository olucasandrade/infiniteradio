/**
 * Swing: push off-eighths toward triplet positions. `intensity` 0 = straight
 * time; 1 = full triplet swing (the "and" lands on 2/3 of the beat).
 * Works on positions expressed in beats.
 */
export function applySwing(timeInBeats: number, intensity: number): number {
  if (intensity <= 0) return timeInBeats
  const beat = Math.floor(timeInBeats)
  const fraction = timeInBeats - beat
  if (fraction < 0.5) return timeInBeats

  // Interpolate the off-beat region between straight (0.5) and triplet (2/3).
  const swung = 0.5 + intensity / 6 + (fraction - 0.5) * (1 - intensity / 3)
  return beat + Math.min(swung, 0.99)
}
