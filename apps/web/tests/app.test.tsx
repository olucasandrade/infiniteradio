import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { App } from '../src/app/App'

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

describe('App', () => {
  it('renders the single-screen radio shell', () => {
    render(<App />)
    expect(screen.getByText('infinite radio')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stations' })).toBeInTheDocument()
  })
})
