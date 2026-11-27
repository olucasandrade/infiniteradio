import { Github, IconButton, Settings as SettingsIcon } from '@infinite-radio/design-system'
import { useState } from 'react'

import { SettingsMenu } from '../settings/SettingsMenu'

const REPO_URL = 'https://github.com/olucasandrade/infiniteradio'
const AUTHOR_URL = 'https://olucasandrade.com'

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium lowercase tracking-[0.1em] text-text-primary">
          infinite radio
        </span>
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 text-xs lowercase tracking-[0.06em] text-text-secondary transition-colors duration-fast hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <img
            src="/lucas-andrade.png"
            alt=""
            width={22}
            height={22}
            className="rounded-full transition-transform duration-fast group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span className="hidden sm:inline">built by lucas andrade</span>
        </a>
      </div>
      <div className="flex items-center">
        <IconButton
          label="GitHub repository"
          icon={<Github size={18} />}
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
        />
        <IconButton
          label="Settings"
          icon={<SettingsIcon size={18} />}
          onClick={() => setSettingsOpen(true)}
        />
      </div>
      <SettingsMenu open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  )
}
