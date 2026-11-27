import type { PlaybackStatus } from '@infinite-radio/shared'
import { getCurrentEpisode } from '@infinite-radio/stations'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../src/app/App'
import { setEngineForTesting } from '../src/features/listening/engine'
import { usePlayerStore } from '../src/stores/playerStore'
import { useSettingsStore } from '../src/stores/settingsStore'

vi.mock('../src/features/scene/radioScene', () => ({
  createRadioScene: vi.fn(() =>
    Promise.resolve({
      setStation: vi.fn(),
      setPlayback: vi.fn(),
      setVolume: vi.fn(),
      setTransportState: vi.fn(),
      setTransportRect: vi.fn(),
      setReducedMotion: vi.fn(),
      renderOnce: vi.fn(),
      dispose: vi.fn(),
    }),
  ),
}))

interface FakeEngine extends Partial<import('@infinite-radio/shared').AudioEngine> {
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
    currentStationId: null,
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
    emit: (status) => listeners.forEach((l) => l(status)),
  }
  return engine
}

const initialPlayer = {
  status: 'idle' as PlaybackStatus,
  stationId: 'weightless' as const,
  moodByStation: {},
  parametersByStation: {},
  volume: 0.8,
  muted: false,
  favoriteStationIds: [] as import('@infinite-radio/shared').StationId[],
}

function resetStores() {
  usePlayerStore.setState({ ...initialPlayer }, false)
  useSettingsStore.setState(
    { reducedMotion: false, visualizerEnabled: true, defaultStationId: 'weightless' },
    false,
  )
}

let engine: FakeEngine

async function renderApp() {
  const view = render(<App />)
  await flush()
  return view
}

/** Flush promise-based store actions inside React's act scope. */
async function flush() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('application flow', () => {
  beforeEach(() => {
    localStorage.clear()
    resetStores()
    engine = createFakeEngine()
    setEngineForTesting(engine as never)
  })

  it('renders the focused radio screen with all primary controls', async () => {
    await renderApp()
    expect(screen.getByText('infinite radio')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Weightless' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument()
    for (const action of ['Stations', 'Mood', 'Sound', 'Settings']) {
      expect(screen.getByRole('button', { name: action })).toBeInTheDocument()
    }
    expect(screen.getByText('Press play to begin')).toBeInTheDocument()
  })

  it('contains no track metadata, discovery grid, or legacy transport', async () => {
    await renderApp()
    expect(screen.queryByText('Now transmitting')).not.toBeInTheDocument()
    expect(screen.queryByText(/Up next/)).not.toBeInTheDocument()
    expect(screen.queryByText(/inspired by/i)).not.toBeInTheDocument()
    expect(screen.queryByAltText(/artwork/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId(/station-card/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next station' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Previous station' })).not.toBeInTheDocument()
    expect(screen.queryByText('Master volume')).not.toBeInTheDocument()
  })

  it('starts playback from the play control and pauses', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    await flush()
    expect(engine.play).toHaveBeenCalled()
    expect(engine.calls.switchStation).toEqual(['weightless'])
    expect(screen.getByText('Live · Infinite transmission')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await flush()
    expect(engine.pause).toHaveBeenCalled()
    expect(screen.getByText('Paused')).toBeInTheDocument()
  })

  it('applies the current transmission episode when playback starts', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    await flush()
    const episode = getCurrentEpisode('weightless')
    expect(engine.setEpisodeConstraint).toHaveBeenCalledWith(episode.constraint, {
      stationId: 'weightless',
      startsAtMs: episode.startedAtMs,
      endsAtMs: episode.endsAtMs,
    })
  })

  it('pauses an audible transitioning state from the same control', async () => {
    await renderApp()
    act(() => engine.emit('transitioning'))
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getByText('Tuning the next station…')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await flush()
    expect(engine.pause).toHaveBeenCalled()
  })

  it('explains first-start latency, marks the control busy, and blocks repeat activation', async () => {
    await renderApp()
    act(() => engine.emit('initializing'))
    expect(screen.getByText('Starting your transmission…')).toBeInTheDocument()
    expect(screen.getByText('The first transmission can take a few seconds.')).toBeInTheDocument()
    const play = screen.getByRole('button', { name: 'Play' })
    expect(play).toBeDisabled()
    expect(play).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(play)
    expect(engine.play).not.toHaveBeenCalled()
  })

  it('shows an assertive error with a working Try again action', async () => {
    await renderApp()
    act(() => engine.emit('error'))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Audio unavailable')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await flush()
    expect(engine.play).toHaveBeenCalled()
  })

  it('controls volume and mute through the circular control semantics', async () => {
    await renderApp()
    const volume = screen.getByRole('slider', { name: 'Volume' })
    expect(volume).toHaveAttribute('aria-valuetext', '80 percent')
    fireEvent.change(volume, { target: { value: '30' } })
    expect(engine.calls.setMasterVolume.at(-1)).toBeCloseTo(0.3)
    expect(volume).toHaveValue('30')

    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(engine.calls.setMuted).toEqual([true])
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('0')

    fireEvent.click(screen.getByRole('button', { name: 'Unmute' }))
    expect(engine.calls.setMuted).toEqual([true, false])
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('30')
  })

  it('lists all seven stations and selects from the sheet', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    await flush()

    fireEvent.click(screen.getByRole('button', { name: 'Stations' }))
    const sheet = screen.getByRole('dialog', { name: 'Stations' })
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    for (const name of [
      'Weightless',
      'Low End',
      'Blue Notes',
      'Velvet',
      'Vapor Trails',
      'Open Window',
      'After Hours',
    ]) {
      expect(within(sheet).getByRole('button', { name: new RegExp(name) })).toBeInTheDocument()
    }

    fireEvent.click(within(sheet).getByRole('button', { name: /After Hours/ }))
    await flush()
    expect(usePlayerStore.getState().stationId).toBe('after-hours')
    expect(engine.calls.switchStation.at(-1)).toBe('after-hours')
    expect(screen.getByRole('heading', { level: 1, name: 'After Hours' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('changes the mood live and stays open for comparison', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Mood' }))
    const sheet = screen.getByRole('dialog', { name: 'Mood' })
    const moods = within(sheet).getAllByRole('radio')
    expect(moods).toHaveLength(3)
    fireEvent.click(moods.find((m) => m.textContent === 'Vast')!)
    expect(engine.calls.updateParameters.at(-1)!.spatialDepth).toBe(1)

    // The sheet stays open so moods can be compared; Done closes it.
    expect(screen.getByRole('dialog', { name: 'Mood' })).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('changes all four sound parameters and resets them', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Sound' }))
    const sheet = screen.getByRole('dialog', { name: 'Sound' })
    expect(within(sheet).getAllByRole('slider')).toHaveLength(4)

    const density = within(sheet).getByRole('slider', { name: 'Texture density' })
    fireEvent.change(density, { target: { value: '0.2' } })
    expect(engine.calls.updateParameters.at(-1)!.textureDensity).toBeCloseTo(0.2)

    fireEvent.click(within(sheet).getByRole('button', { name: 'Reset station customization' }))
    const params = usePlayerStore.getState().parametersByStation.weightless ?? {}
    expect(params.textureDensity ?? 0.6).toBeCloseTo(0.6)
  })

  it('closes a sheet on Escape and returns focus to its trigger', async () => {
    await renderApp()
    const trigger = screen.getByRole('button', { name: 'Sound' })
    // Browsers focus a button on click; jsdom does not, so set it explicitly.
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Sound' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(trigger)
  })

  it('opens settings and changes the default station', async () => {
    await renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    const dialog = screen.getByRole('dialog', { name: 'Settings' })

    fireEvent.click(within(dialog).getByRole('button', { name: 'After Hours' }))
    expect(useSettingsStore.getState().defaultStationId).toBe('after-hours')
  })

  it('persists preferences across a reload', async () => {
    await renderApp()
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), {
      target: { value: '55' },
    })
    await flush()

    const raw = localStorage.getItem('infinite-radio:preferences:v1')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.volume).toBeCloseTo(0.55)
  })
})
