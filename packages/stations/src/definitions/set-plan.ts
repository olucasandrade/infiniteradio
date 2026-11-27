import type {
  EpisodeConstraint,
  GenerationContext,
  SetPlan,
  StationId,
} from '@infinite-radio/shared'
import {
  arrangementForSection,
  createSectionRandom,
  SCALES,
  type ArrangementState,
} from '@infinite-radio/composition-engine'

const forms: Record<StationId, readonly ArrangementState[]> = {
  weightless: ['main', 'variation', 'build', 'breakdown', 'variation', 'transition'],
  'hip-hop': ['build', 'main', 'variation', 'breakdown', 'main', 'transition'],
  'blue-notes': ['build', 'variation', 'main', 'breakdown', 'variation', 'transition'],
  'neo-soul': ['build', 'main', 'variation', 'main', 'breakdown', 'transition'],
  vaporwave: ['main', 'build', 'breakdown', 'variation', 'main', 'transition'],
  indie: ['build', 'variation', 'breakdown', 'main', 'variation', 'transition'],
  'after-hours': ['main', 'build', 'variation', 'main', 'breakdown', 'transition'],
}

export function planStationSet(
  id: StationId,
  tempo: { minBpm: number; maxBpm: number },
  bars: number,
  seed: number,
  episode?: EpisodeConstraint,
): SetPlan {
  const random = createSectionRandom(seed, 0)
  const energy = episode?.energy ?? random()
  const bpm = Math.round(tempo.minBpm + (tempo.maxBpm - tempo.minBpm) * (0.2 + energy * 0.6))
  const variant = (((episode?.index ?? seed) % 8) + 8) % 8
  const form = forms[id]
  const sectionsPerPhrase = Math.max(1, Math.round(38 / ((bars * 4 * 60) / bpm)))
  const motif = [
    0,
    1 + Math.floor(random() * 3),
    Math.floor(random() * 4),
    1 + Math.floor(random() * 3),
  ]
  return {
    bpm,
    variant,
    groove: variant % 4,
    harmony: (variant + Math.floor(variant / 4) * 2) % 4,
    entranceTone: commonTone(episode, episode?.previousKey),
    exitTone: commonTone(episode, episode?.nextKey),
    motif,
    sectionsPerPhrase,
    form: [form[0]!, ...form.slice(1, 5).map((_, i) => form[1 + ((i + variant) % 4)]!), form[5]!],
  }
}

function commonTone(
  episode?: EpisodeConstraint,
  neighbor?: EpisodeConstraint['previousKey'],
): number | undefined {
  if (!episode || !neighbor) return undefined
  const pitches = SCALES[episode.scale].map((degree) => (degree + episode.keyRootPc) % 12)
  const other = SCALES[neighbor.scale].map((degree) => (degree + neighbor.rootPc) % 12)
  const pitch = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5].find(
    (pc) => pitches.includes(pc) && other.includes(pc),
  )
  return pitch === undefined ? undefined : 60 + pitch
}

export function setState(context: GenerationContext): ArrangementState {
  const form = context.setPlan?.form
  return form?.[setPhrase(context) % form.length] ?? arrangementForSection(context.sectionIndex)
}

export function setPhrase(context: GenerationContext): number {
  return Math.floor(context.sectionIndex / (context.setPlan?.sectionsPerPhrase ?? 1))
}
