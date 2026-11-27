import { Button, Heading, Modal, Separator, Text } from '@infinite-radio/design-system'
import { STATION_LIST } from '@infinite-radio/stations'

import { useSettingsStore } from '../../stores/settingsStore'

export interface SettingsMenuProps {
  open: boolean
  onClose: () => void
}

export function SettingsMenu({ open, onClose }: SettingsMenuProps) {
  const defaultStationId = useSettingsStore((state) => state.defaultStationId)
  const setDefaultStation = useSettingsStore((state) => state.setDefaultStation)
  const resetPreferences = useSettingsStore((state) => state.resetPreferences)

  return (
    <Modal open={open} onClose={onClose} label="Settings">
      <div className="flex flex-col gap-5">
        <Heading level={2}>Settings</Heading>

        <div className="flex flex-col gap-2">
          <Text variant="small" color="secondary">
            Default station
          </Text>
          <div className="flex flex-wrap gap-2">
            {STATION_LIST.map((station) => (
              <button
                key={station.id}
                type="button"
                aria-pressed={defaultStationId === station.id}
                onClick={() => setDefaultStation(station.id)}
                className={
                  'h-9 flex-1 whitespace-nowrap rounded-md border px-2 text-small transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                  (defaultStationId === station.id
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border text-text-secondary hover:border-text-muted')
                }
              >
                {station.name}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <Button
          variant="destructive"
          size="sm"
          fullWidth
          onClick={() => {
            resetPreferences()
            onClose()
          }}
        >
          Reset preferences
        </Button>
      </div>
    </Modal>
  )
}
