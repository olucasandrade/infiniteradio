import { getStation } from '@infinite-radio/stations'

import { usePlayerStore } from '../../stores/playerStore'

export interface MoodSelectorProps {
  stationId: Parameters<typeof getStation>[0]
}

export function MoodSelector({ stationId }: MoodSelectorProps) {
  const station = getStation(stationId)
  const moodId = usePlayerStore((state) => state.moodByStation[stationId])
  const setMood = usePlayerStore((state) => state.setMood)
  const current = moodId ?? station.defaultMood

  return (
    <div className="flex flex-col gap-2">
      <span id="mood-label" className="text-small font-medium uppercase tracking-wider text-text-secondary">
        Mood
      </span>
      <div role="radiogroup" aria-labelledby="mood-label" className="flex gap-2">
        {station.moods.map((mood) => (
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={mood.id === current}
            onClick={() => setMood(stationId, mood.id)}
            className={
              'h-9 flex-1 rounded-full border px-3 text-small transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
              (mood.id === current
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary')
            }
          >
            {mood.name}
          </button>
        ))}
      </div>
    </div>
  )
}
