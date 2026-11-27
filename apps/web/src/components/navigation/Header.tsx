import { IconButton, Settings as SettingsIcon } from '@infinite-radio/design-system'
import { useState } from 'react'

import { SettingsMenu } from '../settings/SettingsMenu'

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-4 sm:h-16 sm:px-6">
      <span className="text-sm font-medium lowercase tracking-[0.1em] text-text-primary">
        infinite radio
      </span>
      <IconButton
        label="Settings"
        icon={<SettingsIcon size={18} />}
        onClick={() => setSettingsOpen(true)}
      />
      <SettingsMenu open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  )
}
