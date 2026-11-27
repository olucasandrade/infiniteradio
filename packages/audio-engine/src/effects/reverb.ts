/**
 * Algorithmic reverb: generated exponential-decay noise impulse responses.
 * IRs are created once per configuration and reused — never per voice.
 */
export interface ReverbConfig {
  /** Impulse response length in seconds. */
  decaySeconds: number
  /** Wet mix 0..1. */
  wet: number
  sendOnly?: boolean
  /** Stereo width 0..1 (detunes the two IR channels). */
  width?: number
}

export function createImpulseResponse(
  ctx: BaseAudioContext,
  decaySeconds: number,
  width = 1,
): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * decaySeconds))
  const buffer = ctx.createBuffer(2, length, sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    const channelOffset = channel === 0 ? width : -width
    for (let i = 0; i < length; i++) {
      const t = i / length
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2) * channelOffset
    }
  }
  return buffer
}

export interface EffectNode {
  input: GainNode
  output: GainNode
  dispose(): void
}

/** Convolver reverb with wet/dry mixing. */
export function createReverb(ctx: BaseAudioContext, config: ReverbConfig): EffectNode {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const convolver = ctx.createConvolver()

  convolver.buffer = createImpulseResponse(ctx, config.decaySeconds, config.width ?? 1)
  wet.gain.value = config.wet
  dry.gain.value = config.sendOnly ? 0 : 1 - config.wet * 0.5

  input.connect(dry)
  dry.connect(output)
  input.connect(convolver)
  convolver.connect(wet)
  wet.connect(output)

  return {
    input,
    output,
    dispose() {
      input.disconnect()
      output.disconnect()
      dry.disconnect()
      wet.disconnect()
      convolver.disconnect()
    },
  }
}
