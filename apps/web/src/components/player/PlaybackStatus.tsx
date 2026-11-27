import { Spinner } from '@infinite-radio/design-system'
import type { PlaybackStatus } from '@infinite-radio/shared'

import { INITIALIZING_NOTE, STATUS_LABELS } from '../../features/listening/status'

export interface PlaybackStatusProps {
  status: PlaybackStatus
}

/**
 * Live status line under the transport. Status changes are politely
 * announced; the error branch is an assertive alert with guidance. Volume
 * changes are never routed through this region.
 */
export function PlaybackStatus({ status }: PlaybackStatusProps) {
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-2">
        <p aria-live="polite" aria-atomic="true" className="text-sm font-medium text-text-primary">
          {STATUS_LABELS.error}
        </p>
        <p role="alert" className="max-w-xs text-center text-small text-text-secondary">
          Your browser could not start audio playback. Check that audio is not blocked, then press
          Try again.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p
        aria-live="polite"
        aria-atomic="true"
        className="flex items-center gap-2 text-sm text-text-secondary"
      >
        {(status === 'initializing' || status === 'transitioning') && (
          <Spinner className="h-3.5 w-3.5" aria-hidden />
        )}
        <span>{STATUS_LABELS[status]}</span>
      </p>
      {status === 'initializing' && (
        <p className="text-center text-small text-text-muted">{INITIALIZING_NOTE}</p>
      )}
    </div>
  )
}
