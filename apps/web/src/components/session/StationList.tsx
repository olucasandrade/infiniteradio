import { STATION_LIST } from '@infinite-radio/stations'

import { VISUAL_PROFILES } from '../../features/scene/visualProfiles'
import { usePlayerStore } from '../../stores/playerStore'

export interface StationListProps {
  onSelected: () => void
}

/**
 * Compact selector for all seven stations. Rows carry name, category, an
 * active indicator, and a small palette swatch from the visual profile.
 * Selecting a row reuses the store's selectStation behavior.
 */
export function StationList({ onSelected }: StationListProps) {
  const stationId = usePlayerStore((state) => state.stationId)
  const selectStation = usePlayerStore((state) => state.selectStation)

  return (
    <ul className="flex flex-col gap-1.5" aria-label="Stations">
      {STATION_LIST.map((station) => {
        const active = station.id === stationId
        const palette = VISUAL_PROFILES[station.id].palette
        return (
          <li key={station.id}>
            <button
              type="button"
              aria-current={active ? 'true' : undefined}
              onClick={() => {
                void selectStation(station.id)
                onSelected()
              }}
              className={
                'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors duration-fast ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                (active
                  ? 'border-[rgba(190,215,255,.3)] bg-[rgba(190,215,255,.07)]'
                  : 'border-transparent hover:border-[rgba(190,215,255,.13)] hover:bg-[rgba(190,215,255,.04)]')
              }
            >
              <span
                aria-hidden
                className="h-6 w-6 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(${palette[0]} 0 33%, ${palette[1]} 33% 66%, ${palette[2]} 66% 100%)`,
                }}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-text-primary">
                  {station.name}
                </span>
                <span className="truncate font-mono text-micro uppercase tracking-[0.12em] text-text-muted">
                  {station.category}
                </span>
              </span>
              {active && (
                <span
                  aria-label={`${station.name} active`}
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: 'var(--signal-color)' }}
                />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
