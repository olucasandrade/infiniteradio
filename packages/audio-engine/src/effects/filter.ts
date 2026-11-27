export type FilterType = 'lowpass' | 'highpass' | 'bandpass'

export interface FilterConfig {
  type: FilterType
  frequencyHz: number
  q?: number
}

export function createFilter(ctx: BaseAudioContext, config: FilterConfig): BiquadFilterNode {
  const filter = ctx.createBiquadFilter()
  filter.type = config.type
  filter.frequency.value = config.frequencyHz
  filter.Q.value = config.q ?? 0.7
  return filter
}
