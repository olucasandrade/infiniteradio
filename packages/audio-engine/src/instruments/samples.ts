import type { InstrumentId, StationId } from '@infinite-radio/shared'

import { createInstrument } from './registry'
import type { Instrument } from './types'

const drums = { kick: 'kick', snare: 'snare', 'hi-hat': 'hat' } as const
const buffers = new WeakMap<BaseAudioContext, Map<string, Promise<AudioBuffer | null>>>()

function load(ctx: BaseAudioContext, url: string): Promise<AudioBuffer | null> {
  let cache = buffers.get(ctx)
  if (!cache) {
    cache = new Map()
    buffers.set(ctx, cache)
  }
  const cached = cache.get(url)
  if (cached) return cached
  const pending = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Sample unavailable')
      return response.arrayBuffer()
    })
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => null)
  cache.set(url, pending)
  return pending
}

export function createSamplePalette(ctx: BaseAudioContext, station: StationId, base: string) {
  const banks = new Map<InstrumentId, string[]>()
  if (station !== 'weightless') {
    for (const [id, name] of Object.entries(drums)) {
      // After Hours keeps its synthesized kick as the steady pulse.
      if (station === 'after-hours' && id === 'kick') continue
      banks.set(id as InstrumentId, [`${name}-1`, `${name}-2`])
    }
  }
  function addPitched(id: InstrumentId, name: string, layers: readonly string[]) {
    banks.set(
      id,
      [3, 4, 5].flatMap((octave) => layers.map((layer) => `${name}-c${octave}${layer}`)),
    )
  }
  if (station === 'blue-notes') addPitched('electric-piano', 'piano', ['-soft', '-hard'])
  if (station === 'hip-hop' || station === 'neo-soul') addPitched('electric-piano', 'ep', [''])
  if (station === 'indie') addPitched('guitar-string', 'guitar', ['-soft', '-hard'])

  const decoded = new Map<string, AudioBuffer>()
  const ready = Promise.all(
    [...banks.values()].flat().map(async (name) => {
      const buffer = await load(ctx, `${base}${name}.mp3`)
      if (buffer) decoded.set(name, buffer)
    }),
  )

  function forSection(): (id: InstrumentId) => Instrument {
    const resolved = new Map<InstrumentId, Instrument>()
    for (const [id, names] of banks) {
      const samples = names.map((name) => decoded.get(name))
      if (samples.some((sample) => !sample)) continue
      let hit = 0
      const percussion = id === 'kick' || id === 'snare' || id === 'hi-hat'
      const layerCount = percussion ? 1 : names.length / 3
      const gain = id === 'kick' ? 0.65 : id === 'snare' ? 0.48 : id === 'hi-hat' ? 0.34 : 0.64
      resolved.set(id, {
        id,
        trigger(audio, event) {
          const pitch = event.pitch ?? 60
          const zone = Math.max(0, Math.min(2, Math.round((pitch - 48) / 12)))
          const layer = layerCount > 1 && event.velocity >= 0.53 ? 1 : 0
          const drumIndex =
            station === 'after-hours' || station === 'vaporwave'
              ? (Math.floor(hit++ / 3) + 1) % 2
              : hit++ % 2
          const index = percussion ? drumIndex : zone * layerCount + layer
          const source = audio.createBufferSource()
          const amp = audio.createGain()
          const filter = audio.createBiquadFilter()
          const rate = percussion ? 1 : 2 ** ((pitch - (48 + zone * 12)) / 12)
          source.buffer = samples[index]!
          source.playbackRate.value = rate
          filter.type = 'lowpass'
          const softness = event.parameters?.age ?? event.parameters?.damping ?? 0
          filter.frequency.value = 11000 - softness * 8300
          source.connect(filter)
          filter.connect(amp)
          amp.connect(event.destination)

          const body = percussion ? source.buffer.duration : event.durationSeconds
          const length = Math.min(source.buffer.duration / rate, body + 0.16)
          const endTime = event.time + length
          amp.gain.setValueAtTime(gain * event.velocity, event.time)
          amp.gain.setValueAtTime(gain * event.velocity, Math.max(event.time, endTime - 0.12))
          amp.gain.linearRampToValueAtTime(0, endTime)
          source.addEventListener(
            'ended',
            () => {
              source.disconnect()
              filter.disconnect()
              amp.disconnect()
            },
            { once: true },
          )
          source.start(event.time)
          source.stop(endTime)
          return {
            endTime,
            stop() {
              const now = audio.currentTime
              const end = Math.min(endTime, now + 0.08)
              if (end <= now) return
              amp.gain.cancelScheduledValues(now)
              amp.gain.setTargetAtTime(0, now, 0.012)
              source.stop(end)
            },
          }
        },
      })
    }
    return (id) => resolved.get(id) ?? createInstrument(id)
  }
  return { ready, forSection }
}
