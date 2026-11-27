import { createSectionRandom } from '@infinite-radio/shared'
import { describe, expect, it } from 'vitest'

import { getEpisodeAt, STATION_LIST } from '../src'

describe('evolving station sets', () => {
  for (const station of STATION_LIST) {
    it(`${station.name} plays a valid and reproducible set across 24 slots and all moods`, () => {
      let previousPlan
      const grooveSignatures = new Set<string>()
      for (let index = 100; index < 124; index++) {
        const { constraint: episode } = getEpisodeAt(station.id, index)
        const setPlan = station.planSet!(episode.seed, episode)
        expect(setPlan).toEqual(station.planSet!(episode.seed, episode))
        if (previousPlan) {
          expect(setPlan.groove).not.toBe(previousPlan.groove)
          expect(setPlan.harmony).not.toBe(previousPlan.harmony)
          expect(setPlan.entranceTone).toBe(previousPlan.exitTone)
        }
        previousPlan = setPlan

        for (const mood of station.moods) {
          const sections = Math.ceil(setPlan.bpm / station.barsPerSection)
          for (let sectionIndex = 0; sectionIndex < sections; sectionIndex++) {
            const renderSection = () =>
              station.generator.generateSection({
                seed: episode.seed,
                episode,
                setPlan,
                sectionIndex,
                startBar: sectionIndex * station.barsPerSection,
                bars: station.barsPerSection,
                energy: episode.energy,
                parameters: { ...station.parameters, ...mood.parameters },
                random: createSectionRandom(episode.seed, sectionIndex),
              })
            const section = renderSection()
            const audible = section.events.filter((event) => event.instrument !== 'noise-texture')
            if (sectionIndex === 0) {
              expect(audible.some((event) => event.time < 4)).toBe(true)
              expect(section).toEqual(renderSection())
            }
            if (mood.id === station.defaultMood) expect(audible.length).toBe(section.events.length)
            const phrase = Math.floor(sectionIndex / setPlan.sectionsPerPhrase)
            if (
              mood.id === station.defaultMood &&
              phrase === setPlan.form.indexOf('main') &&
              sectionIndex % setPlan.sectionsPerPhrase === 0
            ) {
              const instrument = station.id === 'after-hours' ? 'pluck' : 'kick'
              grooveSignatures.add(
                section.events
                  .filter((e) => e.instrument === instrument)
                  .map((e) => Math.round(e.time * 2))
                  .join(','),
              )
            }
            const invalid = section.events.filter(
              (event) =>
                !Number.isFinite(event.time) ||
                event.time < 0 ||
                event.time >= section.bars * 4 ||
                !Number.isFinite(event.duration) ||
                event.duration < 0 ||
                (event.pitch !== undefined &&
                  (!Number.isFinite(event.pitch) || event.pitch < 0 || event.pitch > 127)),
            )
            expect(invalid).toEqual([])
          }
        }
      }
      if (station.id === 'hip-hop' || station.id === 'after-hours') {
        expect(grooveSignatures.size).toBeGreaterThanOrEqual(4)
      }
    })
  }
})
