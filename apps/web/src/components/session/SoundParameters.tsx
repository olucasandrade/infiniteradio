import { Button, Slider } from '@infinite-radio/design-system'
import { getStation } from '@infinite-radio/stations'

import { usePlayerStore } from '../../stores/playerStore'

/**
 * The active station's four sound parameters, live-tuned through the
 * existing Slider primitive. Changes apply to the engine immediately and
 * never restart playback.
 */
export function SoundParameters() {
  const stationId = usePlayerStore((state) => state.stationId)
  const parameters = usePlayerStore((state) => state.parametersByStation[stationId])
  const setParameter = usePlayerStore((state) => state.setParameter)
  const station = getStation(stationId)

  const resetStation = () => {
    for (const spec of station.parameterSpecs) {
      setParameter(stationId, spec.id, spec.defaultValue)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {station.parameterSpecs.map((spec) => (
        <Slider
          key={spec.id}
          label={spec.label}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={parameters?.[spec.id] ?? spec.defaultValue}
          onChange={(value) => setParameter(stationId, spec.id, value)}
          formatValue={(value) =>
            spec.format === 'percent' ? `${Math.round(value * 100)}%` : value.toFixed(2)
          }
        />
      ))}
      <Button variant="ghost" size="sm" fullWidth onClick={resetStation}>
        Reset station customization
      </Button>
    </div>
  )
}
