import type { StationDefinition, StationId } from '@infinite-radio/shared'

export function makeStation(
  id: StationId,
  overrides: Partial<StationDefinition> = {},
): StationDefinition {
  return {
    id,
    name: id,
    tagline: 'tagline',
    description: 'description',
    category: 'category',
    artworkPath: `/stations/${id}/artwork.svg`,
    accent: id,
    defaultMood: 'default',
    moods: [{ id: 'default', name: 'Default', parameters: {} }],
    parameters: { density: 0.5 },
    parameterSpecs: [
      {
        id: 'density',
        label: 'Density',
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
        format: 'percent',
      },
    ],
    tempo: { minBpm: 90, maxBpm: 110 },
    barsPerSection: 4,
    effects: {
      reverbWet: 0.3,
      reverbDecaySeconds: 2,
      delayTimeBeats: 0.75,
      delayFeedback: 0.3,
      delayWet: 0.1,
    },
    generator: {
      generateSection: () => ({
        id: 'section',
        startBar: 0,
        bars: 4,
        energy: 0.5,
        events: [],
      }),
    },
    ...overrides,
  }
}
