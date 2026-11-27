import type { InstrumentId, MusicalEvent, StationEffectsConfig } from '@infinite-radio/shared'

import { createDelay, type EffectNode } from '../effects/delay'
import { createReverb } from '../effects/reverb'

/**
 * Master output chain:
 *
 *   station buses ──> masterGain ──> limiter ──> analyser ──> destination
 */
export interface MasterChain {
  input: GainNode
  gain: GainNode
  limiter: DynamicsCompressorNode
  analyser: AnalyserNode
}

export function createMasterChain(ctx: BaseAudioContext): MasterChain {
  const gain = ctx.createGain()
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -6
  limiter.knee.value = 4
  limiter.ratio.value = 12
  limiter.attack.value = 0.003
  limiter.release.value = 0.25

  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.8

  gain.connect(limiter)
  limiter.connect(analyser)
  analyser.connect(ctx.destination)

  return { input: gain, gain, limiter, analyser }
}

/**
 * Per-station bus with its own effect sends:
 *
 *   instrument voices ──> busInput ──┬─ dry ───────────────┐
 *                                    ├─ reverb (send) ─────┤
 *                                    └─ delay (send) ──────┴─> busOutput ──> master
 */
export class StationBus {
  readonly input: GainNode
  readonly output: GainNode
  private readonly reverb: EffectNode
  private readonly delay: EffectNode | null
  private readonly dry: GainNode
  private readonly channels: GainNode[] = []
  private readonly instrumentInputs = new Map<InstrumentId, GainNode>()
  private disposed = false

  inputFor(id: InstrumentId, role?: MusicalEvent['mixRole']): AudioNode {
    return this.instrumentInputs.get(role === 'lead' ? 'bell' : id) ?? this.input
  }

  constructor(
    private readonly ctx: BaseAudioContext,
    effects: StationEffectsConfig,
    secondsPerBeat: number,
  ) {
    this.input = ctx.createGain()
    this.output = ctx.createGain()
    this.dry = ctx.createGain()
    this.dry.gain.value = 0.78

    this.reverb = createReverb(ctx, {
      decaySeconds: effects.reverbDecaySeconds,
      wet: 1,
      sendOnly: true,
    })
    const reverbSend = ctx.createGain()
    reverbSend.gain.value = effects.reverbWet

    this.input.connect(this.dry)
    this.dry.connect(this.output)
    reverbSend.connect(this.reverb.input)
    this.reverb.output.connect(this.output)

    const delaySend = ctx.createGain()
    this.channels.push(reverbSend, delaySend)
    if (effects.delayWet > 0) {
      this.delay = createDelay(ctx, {
        timeSeconds: effects.delayTimeBeats * secondsPerBeat,
        feedback: effects.delayFeedback,
        wet: 1,
        sendOnly: true,
      })
      delaySend.gain.value = effects.delayWet
      delaySend.connect(this.delay.input)
      this.delay.output.connect(this.output)
    } else {
      this.delay = null
    }

    const groups: { ids: InstrumentId[]; level: number; send: number }[] = [
      { ids: ['kick', 'snare', 'hi-hat'], level: 0.65, send: 0.12 },
      { ids: ['soft-bass', 'sub-bass', 'drone'], level: 0.57, send: 0.06 },
      { ids: ['electric-piano', 'synth-pad', 'guitar-string'], level: 0.75, send: 0.75 },
      { ids: ['bell', 'pluck'], level: 0.62, send: 0.85 },
      { ids: ['noise-texture'], level: 0.24, send: 0 },
    ]
    for (const group of groups) {
      const channel = ctx.createGain()
      channel.gain.value = group.level
      channel.connect(this.input)
      this.channels.push(channel)
      for (const id of group.ids) this.instrumentInputs.set(id, channel)
      if (group.send === 0) continue
      const send = ctx.createGain()
      send.gain.value = group.send
      channel.connect(send)
      send.connect(reverbSend)
      if (this.delay) send.connect(delaySend)
      this.channels.push(send)
    }
  }

  /** Fade the whole bus; used for station crossfades. */
  fadeTo(value: number, atTime: number, rampSeconds: number, from = this.output.gain.value): void {
    const gain = this.output.gain
    gain.cancelScheduledValues(atTime)
    gain.setValueAtTime(from, atTime)
    gain.linearRampToValueAtTime(value, atTime + rampSeconds)
  }

  get level(): number {
    return this.output.gain.value
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    for (const channel of this.channels) channel.disconnect()
    this.input.disconnect()
    this.output.disconnect()
    this.dry.disconnect()
    this.reverb.dispose()
    this.delay?.dispose()
  }
}
