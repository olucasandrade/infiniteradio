import type { EffectNode } from './reverb'

export type { EffectNode } from './reverb'

export interface DelayConfig {
  /** Delay time in seconds. */
  timeSeconds: number
  /** Feedback amount 0..0.9. */
  feedback: number
  /** Wet mix 0..1. */
  wet: number
  sendOnly?: boolean
}

/** Feedback delay with wet/dry mixing. */
export function createDelay(ctx: BaseAudioContext, config: DelayConfig): EffectNode {
  const input = ctx.createGain()
  const output = ctx.createGain()
  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const delay = ctx.createDelay(5)
  const feedbackGain = ctx.createGain()

  delay.delayTime.value = config.timeSeconds
  feedbackGain.gain.value = Math.min(0.9, Math.max(0, config.feedback))
  wet.gain.value = config.wet
  dry.gain.value = config.sendOnly ? 0 : 1 - config.wet * 0.5

  input.connect(dry)
  dry.connect(output)
  input.connect(delay)
  delay.connect(feedbackGain)
  feedbackGain.connect(delay)
  delay.connect(wet)
  wet.connect(output)

  return {
    input,
    output,
    dispose() {
      input.disconnect()
      output.disconnect()
      dry.disconnect()
      wet.disconnect()
      delay.disconnect()
      feedbackGain.disconnect()
    },
  }
}
