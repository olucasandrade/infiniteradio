import type { VoiceHandle } from './types'

/** Per-context cached noise buffer (2s white noise). */
const noiseBufferCache = new WeakMap<BaseAudioContext, AudioBuffer>()

export function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseBufferCache.get(ctx)
  if (cached) return cached
  const length = Math.floor(ctx.sampleRate * 2)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  noiseBufferCache.set(ctx, buffer)
  return buffer
}

interface Stoppable {
  stop(at?: number): void
  disconnect(): void
}

/**
 * Assemble a voice handle from stoppable sources and gain nodes.
 * `stop()` fades the amp nodes quickly and stops the sources.
 */
export function buildVoiceHandle(
  ctx: BaseAudioContext,
  sources: Stoppable[],
  ampNodes: AudioNode[],
  endTime: number,
): VoiceHandle {
  let stopped = false
  return {
    endTime,
    stop() {
      if (stopped) return
      stopped = true
      const now = ctx.currentTime
      for (const node of ampNodes) {
        const gain = (node as GainNode).gain
        if (gain) {
          gain.cancelScheduledValues(now)
          gain.setTargetAtTime(0.0001, now, 0.02)
        }
      }
      for (const source of sources) {
        try {
          source.stop(now + 0.1)
        } catch {
          // Already ended.
        }
      }
    },
  }
}
