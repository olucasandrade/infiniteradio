import type { MusicalEvent } from '@infinite-radio/shared'

/**
 * Deterministic event-id factory. Ids are namespaced per section so the
 * same seed + configuration produces identical ids — useful for tests
 * and for the scheduler's event bookkeeping.
 */
export function createEventFactory(sectionId: string) {
  let counter = 0
  return function event(partial: Omit<MusicalEvent, 'id'>): MusicalEvent {
    const id = `${sectionId}:e${counter++}`
    return { id, ...partial }
  }
}
