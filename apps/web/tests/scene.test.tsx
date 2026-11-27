import { act, render, screen, waitFor } from '@testing-library/react'
import { createRef, type RefObject } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RadioSceneCanvas, type RadioSceneHandle } from '../src/features/scene/RadioSceneCanvas'
import { createRadioScene } from '../src/features/scene/radioScene'

vi.mock('../src/features/scene/radioScene', () => ({
  createRadioScene: vi.fn(),
}))

const createMock = vi.mocked(createRadioScene)

function controller() {
  return {
    setStation: vi.fn(),
    setPlayback: vi.fn(),
    setVolume: vi.fn(),
    setTransportState: vi.fn(),
    setTransportRect: vi.fn(),
    setReducedMotion: vi.fn(),
    renderOnce: vi.fn(),
    dispose: vi.fn(),
  }
}

type Controller = ReturnType<typeof controller>

function props(overrides: Partial<Parameters<typeof RadioSceneCanvas>[0]> = {}) {
  return {
    stationId: 'weightless' as const,
    playback: 'idle' as const,
    volume: 0.8,
    muted: false,
    reducedMotion: false,
    enabled: true,
    onActiveChange: vi.fn(),
    ...overrides,
  }
}

async function renderCanvas(
  overrides: Partial<Parameters<typeof RadioSceneCanvas>[0]> = {},
  ref?: RefObject<RadioSceneHandle>,
) {
  const view = render(<RadioSceneCanvas {...props(overrides)} ref={ref} />)
  await act(async () => {
    await Promise.resolve()
  })
  return view
}

describe('RadioSceneCanvas', () => {
  beforeEach(() => {
    createMock.mockReset()
  })

  it('loads once, updates without reconstruction, and disposes on unmount', async () => {
    const scene = controller()
    createMock.mockResolvedValue(scene)
    const initial = props()
    const view = await renderCanvas(initial)
    await waitFor(() => expect(createMock).toHaveBeenCalledOnce())
    expect(initial.onActiveChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByTestId('signal-space')).toHaveAttribute('aria-hidden', 'true')

    view.rerender(
      <RadioSceneCanvas {...initial} stationId="hip-hop" playback="playing" volume={0.4} />,
    )
    expect(scene.setStation).toHaveBeenCalledWith('hip-hop')
    expect(scene.setPlayback).toHaveBeenCalledWith('playing')
    expect(scene.setVolume).toHaveBeenCalledWith(0.4, false)
    expect(createMock).toHaveBeenCalledOnce()

    view.unmount()
    expect(scene.dispose).toHaveBeenCalledOnce()
  })

  it('does not initialize WebGL while visuals are disabled', () => {
    render(<RadioSceneCanvas {...props({ enabled: false })} />)
    expect(createMock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('signal-space')).not.toBeInTheDocument()
  })

  it('cancels a pending async initialization on unmount', async () => {
    let resolveCreation: ((controller: Controller) => void) | undefined
    createMock.mockImplementation(() => new Promise((resolve) => (resolveCreation = resolve)))
    const view = render(<RadioSceneCanvas {...props()} />)
    // Wait until the scene module loaded and creation is in flight.
    await waitFor(() => expect(createMock).toHaveBeenCalledOnce())
    view.unmount()
    const late = controller()
    await act(async () => {
      resolveCreation!(late)
      await Promise.resolve()
    })
    // The controller created after unmount is disposed immediately and the
    // host never reports it as active.
    expect(late.dispose).toHaveBeenCalledOnce()
  })

  it('passes reduced motion and reacts to changes', async () => {
    const scene = controller()
    createMock.mockResolvedValue(scene)
    const initial = props({ reducedMotion: true })
    const view = await renderCanvas(initial)
    await waitFor(() => expect(createMock).toHaveBeenCalledOnce())

    view.rerender(<RadioSceneCanvas {...initial} reducedMotion={false} />)
    expect(scene.setReducedMotion).toHaveBeenLastCalledWith(false)
  })

  it('falls back when renderer initialization fails', async () => {
    createMock.mockRejectedValue(new Error('WebGL unavailable'))
    const initial = props()
    await renderCanvas(initial)
    await waitFor(() => expect(initial.onActiveChange).toHaveBeenCalledWith(false))
    expect(screen.queryByTestId('signal-space')).not.toBeInTheDocument()
  })

  it('releases the scene and falls back on context loss', async () => {
    const scene = controller()
    createMock.mockResolvedValue(scene)
    const initial = props()
    await renderCanvas(initial)
    await waitFor(() => expect(createMock).toHaveBeenCalledOnce())
    const options = vi.mocked(createRadioScene).mock.calls[0]![1]
    options.onContextLost()
    await waitFor(() => expect(scene.dispose).toHaveBeenCalledOnce())
    expect(screen.queryByTestId('signal-space')).not.toBeInTheDocument()
    expect(initial.onActiveChange).toHaveBeenLastCalledWith(false)
  })

  it('forwards transport rect and visual state through the handle', async () => {
    const scene = controller()
    createMock.mockResolvedValue(scene)
    const ref = createRef<RadioSceneHandle>()
    const rect = new DOMRect(100, 200, 300, 300)

    // Before the scene exists the values are held and applied on creation.
    await act(async () => {
      render(<RadioSceneCanvas {...props()} ref={ref} />)
    })
    ref.current!.setTransportRect(rect)
    ref.current!.setTransportState('hover')
    await waitFor(() => expect(createMock).toHaveBeenCalledOnce())
    expect(scene.setTransportRect).toHaveBeenCalledWith(rect)
    expect(scene.setTransportState).toHaveBeenCalledWith('hover')

    scene.setTransportRect.mockClear()
    ref.current!.setTransportRect(new DOMRect(0, 0, 240, 240))
    expect(scene.setTransportRect).toHaveBeenCalledTimes(1)
  })
})
