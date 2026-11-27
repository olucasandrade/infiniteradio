import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom has no canvas implementation and logs a not-implemented error on
// every getContext call. Stub the narrow drawing API the app touches.
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  clearRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  createRadialGradient: () => ({ addColorStop: () => {} }),
  fillRect: () => {},
  fill: () => {},
}) as unknown as typeof HTMLCanvasElement.prototype.getContext

// jsdom lacks ResizeObserver; the stage uses it to report the transport
// rect to the 3D scene. A passive stub is enough — the code reports the
// initial rect manually before observing.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

afterEach(() => {
  cleanup()
})
