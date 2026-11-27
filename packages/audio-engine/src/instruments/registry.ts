import type { InstrumentId } from '@infinite-radio/shared'

import type { Instrument } from './types'
import { bellInstrument, electricPianoInstrument } from './keys'
import { sineToneInstrument } from './sine-tone'
import { softBassInstrument, subBassInstrument } from './bass'
import { droneInstrument, synthPadInstrument } from './pad'
import { pluckInstrument } from './pluck'
import { guitarStringInstrument } from './guitar'
import { hiHatInstrument, kickInstrument, noiseTextureInstrument, snareInstrument } from './drums'

const registry: Record<InstrumentId, Instrument> = {
  'synth-pad': synthPadInstrument,
  drone: droneInstrument,
  'soft-bass': softBassInstrument,
  'sub-bass': subBassInstrument,
  'electric-piano': electricPianoInstrument,
  bell: bellInstrument,
  pluck: pluckInstrument,
  kick: kickInstrument,
  snare: snareInstrument,
  'hi-hat': hiHatInstrument,
  'noise-texture': noiseTextureInstrument,
  'guitar-string': guitarStringInstrument,
}

export const INSTRUMENT_IDS = Object.keys(registry) as InstrumentId[]

export function createInstrument(id: InstrumentId): Instrument {
  return registry[id] ?? sineToneInstrument
}
