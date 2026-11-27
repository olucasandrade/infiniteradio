/**
 * Gentle tanh waveshaping for warmth. `amount` 0 disables (linear curve),
 * higher values drive more harmonics. Kept subtle by default to avoid
 * harshness on pads.
 */
export function createSaturationCurve(amount: number, length = 1024): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(length)
  const drive = 1 + amount * 8
  for (let i = 0; i < length; i++) {
    const x = (i / (length - 1)) * 2 - 1
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive)
  }
  return curve
}

export function createSaturation(
  ctx: BaseAudioContext,
  amount: number,
): WaveShaperNode | null {
  if (amount <= 0) return null
  const shaper = ctx.createWaveShaper()
  shaper.curve = createSaturationCurve(amount)
  shaper.oversample = '2x'
  return shaper
}
