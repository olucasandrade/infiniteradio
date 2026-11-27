import type { PlaybackStatus } from '@infinite-radio/shared'
import { act, fireEvent, render, screen } from '@testing-library/react'
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

function createFakeEngine() {
  const listeners = new Set<(status: PlaybackStatus) => void>()
  const calls = { setMasterVolume: [] as number[], setMuted: [] as boolean[] }
  const engine = {
    calls,
    initialize: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockImplementation(() => {
      listeners.forEach((l) => l('playing'))
      return Promise.resolve()
    }),
    pause: vi.fn().mockImplementation(() => {
      listeners.forEach((l) => l('paused'))
    }),
    setMasterVolume: vi.fn((v: number) => calls.setMasterVolume.push(v)),
    setMuted: vi.fn((m: boolean) => calls.setMuted.push(m)),
    switchStation: vi.fn().mockResolvedValue(undefined),
    updateParameters: vi.fn(),
    setEpisodeConstraint: vi.fn(),
    dispose: vi.fn(),
    getStatus: vi.fn(() => 'idle' as PlaybackStatus),
    onStatusChange: (listener: (status: PlaybackStatus) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getAnalyser: vi.fn(() => null),
    getCurrentStationId: vi.fn(() => 'weightless'),
  }
  return engine
}

let engine: ReturnType<typeof createFakeEngine>

async function flush() {
  await act(async () => {
    await Promise.resolve()
  })
}

async function renderApp() {
  render(<App />)
  await flush()
}

describe('playback shortcuts', () => {
  beforeEach(() => {
    localStorage.clear()
    usePlayerStore.setState(
      {
        status: 'idle',
        stationId: 'weightless',
        moodByStation: {},
        parametersByStation: {},
        volume: 0.8,
        muted: false,
        favoriteStationIds: [],
      },
      false,
    )
    useSettingsStore.setState(
      { reducedMotion: false, visualizerEnabled: true, defaultStationId: 'weightless' },
      false,
    )
    engine = createFakeEngine()
    setEngineForTesting(engine as never)
  })

  it('toggles play and pause with Space', async () => {
    await renderApp()
    fireEvent.keyDown(window, { code: 'Space' })
    await flush()
    expect(engine.play).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Live · Infinite transmission')).toBeInTheDocument()

    fireEvent.keyDown(window, { code: 'Space' })
    await flush()
    expect(engine.pause).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Paused')).toBeInTheDocument()
  })

  it('ignores held Space instead of re-toggling', async () => {
    await renderApp()
    fireEvent.keyDown(window, { code: 'Space', repeat: true })
    await flush()
    expect(engine.play).not.toHaveBeenCalled()
  })

  it('adjusts the master volume with arrow keys in 5% steps', async () => {
    await renderApp()
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(engine.calls.setMasterVolume.at(-1)).toBeCloseTo(0.85)
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('85')

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(engine.calls.setMasterVolume.at(-1)).toBeCloseTo(0.8)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(engine.calls.setMasterVolume.at(-1)).toBeCloseTo(0.75)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(engine.calls.setMasterVolume.at(-1)).toBeCloseTo(0.8)
  })

  it('clamps arrow volume at the ends', async () => {
    await renderApp()
    usePlayerStore.setState({ volume: 0.98 })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(engine.calls.setMasterVolume.at(-1)).toBe(1)
    usePlayerStore.setState({ volume: 0.02 })
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(engine.calls.setMasterVolume.at(-1)).toBe(0)
  })

  it('unmutes when an arrow raises the volume while muted', async () => {
    await renderApp()
    usePlayerStore.setState({ muted: true })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(engine.calls.setMuted).toEqual([false])
    expect(engine.calls.setMasterVolume.at(-1)).toBeCloseTo(0.85)
  })

  it('leaves arrows to the focused volume slider', async () => {
    await renderApp()
    const slider = screen.getByRole('slider', { name: 'Volume' })
    slider.focus()
    fireEvent.keyDown(slider, { key: 'ArrowUp' })
    // jsdom does not step range inputs natively, so any call here would
    // mean the global handler double-fired on top of the native control.
    expect(engine.calls.setMasterVolume).toEqual([])
  })

  it('leaves Space to a focused button', async () => {
    await renderApp()
    const play = screen.getByRole('button', { name: 'Play' })
    play.focus()
    fireEvent.keyDown(play, { code: 'Space' })
    expect(engine.play).not.toHaveBeenCalled()
  })
})
