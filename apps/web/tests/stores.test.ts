import {
  PREFERENCES_STORAGE_KEY,
  type AudioEngine,
  type PlaybackStatus,
} from '@infinite-radio/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setEngineForTesting } from '../src/features/listening/engine'
import { collectPreferences, startPersistence } from '../src/stores'
import { loadPreferences } from '../src/stores/persistence'
import { usePlayerStore, type PlayerState } from '../src/stores/playerStore'
import { useSettingsStore } from '../src/stores/settingsStore'

interface FakeEngine extends AudioEngine {
  calls: {
    switchStation: string[]
    setMasterVolume: number[]
    setMuted: boolean[]
    updateParameters: Record<string, number>[]
  }
  currentStationId: string | null
  getCurrentStationId: () => string | null
  emit: (status: PlaybackStatus) => void
}

function createFakeEngine(): FakeEngine {
  const listeners = new Set<(status: PlaybackStatus) => void>()
  const engine: FakeEngine = {
    calls: { switchStation: [], setMasterVolume: [], setMuted: [], updateParameters: [] },
    currentStationId: null as string | null,
    initialize: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockImplementation(() => {
      listeners.forEach((l) => l('playing'))
      return Promise.resolve()
    }),
    pause: vi.fn().mockImplementation(() => {
      listeners.forEach((l) => l('paused'))
    }),
    setMasterVolume: vi.fn((v: number) => {
      engine.calls.setMasterVolume.push(v)
    }),
    setMuted: vi.fn((m: boolean) => {
      engine.calls.setMuted.push(m)
    }),
    switchStation: vi.fn((id: string) => {
      engine.calls.switchStation.push(id)
      engine.currentStationId = id
      return Promise.resolve()
    }),
    updateParameters: vi.fn((p: Record<string, number>) => {
      engine.calls.updateParameters.push(p)
    }),
    setEpisodeConstraint: vi.fn(),
    dispose: vi.fn(),
    getStatus: vi.fn(() => 'idle' as PlaybackStatus),
    onStatusChange: (listener: (status: PlaybackStatus) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getAnalyser: vi.fn(() => null),
    getCurrentStationId: vi.fn(() => engine.currentStationId),
    emit: (status: PlaybackStatus) => listeners.forEach((l) => l(status)),
  }
  return engine
}

const initialPlayerState = {
  status: 'idle' as PlaybackStatus,
  stationId: 'weightless' as const,
  moodByStation: {},
  parametersByStation: {},
  volume: 0.8,
  muted: false,
  favoriteStationIds: [] as import('@infinite-radio/shared').StationId[],
}

function resetStores() {
  usePlayerStore.setState({ ...initialPlayerState }, false)
  useSettingsStore.setState(
    { reducedMotion: false, visualizerEnabled: true, defaultStationId: 'weightless' },
    false,
  )
}

describe('player store', () => {
  let engine: ReturnType<typeof createFakeEngine>

  beforeEach(() => {
    localStorage.clear()
    resetStores()
    engine = createFakeEngine()
    setEngineForTesting(engine as never)
  })

  it('play initializes the current station and starts playback', async () => {
    await usePlayerStore.getState().play()
    expect(engine.calls.switchStation).toEqual(['weightless'])
    expect(engine.play).toHaveBeenCalledOnce()
    expect(usePlayerStore.getState().status).toBe('playing')
  })

  it('applies volume, mute, mood, and customization to the engine', async () => {
    const store = usePlayerStore.getState()
    store.setVolume(0.4)
    expect(engine.calls.setMasterVolume).toContain(0.4)

    usePlayerStore.getState().toggleMute()
    expect(engine.calls.setMuted).toEqual([true])

    usePlayerStore.getState().setMood('weightless', 'vast')
    const moodParams = engine.calls.updateParameters!.at(-1) as Record<string, number>
    expect(moodParams.spatialDepth).toBe(1)

    usePlayerStore.getState().setParameter('weightless', 'spatialDepth', 0.2)
    const customParams = engine.calls.updateParameters!.at(-1) as Record<string, number>
    expect(customParams.spatialDepth).toBe(0.2)
  })

  it('mood changes do not touch playback state', () => {
    usePlayerStore.getState().setMood('blue-notes', 'smoky')
    expect(engine.switchStation).not.toHaveBeenCalled()
    expect(engine.play).not.toHaveBeenCalled()
    expect(usePlayerStore.getState().status).toBe('idle')
  })

  it('selectStation with autoplay switches and plays', async () => {
    await usePlayerStore.getState().selectStation('after-hours', { autoplay: true })
    expect(engine.calls.switchStation).toEqual(['after-hours'])
    expect(engine.play).toHaveBeenCalled()
    expect(usePlayerStore.getState().stationId).toBe('after-hours')
  })

  it('next/prev cycle through all seven stations in order', async () => {
    await usePlayerStore.getState().selectStation('blue-notes')
    for (const stationId of ['neo-soul', 'vaporwave', 'indie', 'after-hours', 'weightless']) {
      await usePlayerStore.getState().nextStation()
      expect(usePlayerStore.getState().stationId).toBe(stationId)
    }
    await usePlayerStore.getState().prevStation()
    expect(usePlayerStore.getState().stationId).toBe('after-hours')
  })

  it('favorites toggle', () => {
    usePlayerStore.getState().toggleFavorite('blue-notes')
    expect(usePlayerStore.getState().favoriteStationIds).toEqual(['blue-notes'])
    usePlayerStore.getState().toggleFavorite('blue-notes')
    expect(usePlayerStore.getState().favoriteStationIds).toEqual([])
  })

  it('engine status changes reflect into the store', () => {
    engine.emit('transitioning')
    expect(usePlayerStore.getState().status).toBe('transitioning')
    engine.emit('error')
    expect(usePlayerStore.getState().status).toBe('error')
  })

  it('togglePlay pauses while transitioning (audible) and plays otherwise', async () => {
    engine.emit('transitioning')
    await usePlayerStore.getState().togglePlay()
    expect(engine.pause).toHaveBeenCalled()

    engine.emit('paused')
    await usePlayerStore.getState().togglePlay()
    expect(engine.play).toHaveBeenCalled()
  })
})

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStores()
    setEngineForTesting(createFakeEngine() as never)
  })

  it('saves preferences on state changes', () => {
    const stop = startPersistence()
    usePlayerStore.getState().setVolume(0.3)
    usePlayerStore.getState().toggleFavorite('after-hours')
    usePlayerStore.getState().setMood('after-hours', 'minimal')
    useSettingsStore.getState().setReducedMotion(true)

    const stored = loadPreferences()
    expect(stored?.volume).toBe(0.3)
    expect(stored?.favoriteStationIds).toEqual(['after-hours'])
    expect(stored?.lastMoodByStation['after-hours']).toBe('minimal')
    expect(stored?.reducedMotion).toBe(true)
    stop()
  })

  it('round-trips the persisted shape through validation', () => {
    startPersistence()
    usePlayerStore.getState().setParameter('weightless', 'textureDensity', 0.9)
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = loadPreferences()
    expect(parsed?.parametersByStation.weightless?.textureDensity).toBe(0.9)
  })

  it('invalid stored data falls back to defaults without crashing', () => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, '{"lastStationId": 42}')
    expect(loadPreferences()?.volume).toBe(0.8)
    localStorage.setItem(PREFERENCES_STORAGE_KEY, 'not json at all')
    expect(loadPreferences()?.lastStationId).toBe('weightless')
  })

  it('resetPreferences restores defaults (which are re-persisted)', () => {
    startPersistence()
    usePlayerStore.getState().setVolume(0.1)
    usePlayerStore.getState().toggleFavorite('blue-notes')
    useSettingsStore.getState().resetPreferences()

    const player = usePlayerStore.getState()
    expect(player.volume).toBe(0.8)
    expect(player.favoriteStationIds).toEqual([])
    const settings = useSettingsStore.getState()
    expect(settings.visualizerEnabled).toBe(true)

    // The defaults were saved back over the cleared storage.
    const stored = loadPreferences()
    expect(stored?.volume).toBe(0.8)
    expect(stored?.favoriteStationIds).toEqual([])
  })

  it('collectPreferences never contains audio objects', () => {
    const prefs = collectPreferences()
    expect(JSON.stringify(prefs)).not.toContain('AudioContext')
    expect(Object.keys(prefs)).toEqual([
      'favoriteStationIds',
      'lastStationId',
      'lastMoodByStation',
      'parametersByStation',
      'volume',
      'muted',
      'reducedMotion',
      'visualizerEnabled',
      'defaultStationId',
    ])
  })
})

// Type re-export so the unused-import lint stays honest.
export type { PlayerState }
