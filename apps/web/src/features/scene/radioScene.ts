import { Application, Texture, type Ticker } from 'pixi.js'
import { Container3D, DirectionalLight, PointLight, View3D } from '@pixi/3d'
import type { PlaybackStatus, StationId, StationVisualProfile } from '@infinite-radio/shared'

import { isAudible } from '../listening/status'
import { createEnvironmentScene, type EnvironmentParams } from './environmentScene'
import { createTransportScene, type TransportVisualState } from './transportScene'
import { VISUAL_PROFILES } from './visualProfiles'

export type { TransportVisualState }

export interface RadioSceneOptions {
  stationId: StationId
  playback: PlaybackStatus
  volume: number
  muted: boolean
  reducedMotion: boolean
  getAnalyser: () => AnalyserNode | null
  onContextLost: () => void
}

export interface RadioSceneController {
  setStation(stationId: StationId): void
  setPlayback(status: PlaybackStatus): void
  setVolume(volume: number, muted: boolean): void
  setTransportState(state: TransportVisualState): void
  setTransportRect(rect: DOMRectReadOnly): void
  setReducedMotion(reducedMotion: boolean): void
  renderOnce(): void
  dispose(): void
}

const CAMERA_Z = 10
const FOV = 42
const ORIGIN = { x: 0, y: 0, z: 0 }
const ZERO_BANDS = { low: 0, mid: 0, high: 0 }

type Rgb = [number, number, number]

function hexToRgb(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

function rgbToInt([r, g, b]: Rgb): number {
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255)
}

const damp = (current: number, target: number, lambda: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

function paramsFromProfile(profile: StationVisualProfile, compact: boolean): EnvironmentParams {
  return {
    ringCount: Math.min(
      10,
      Math.max(compact ? 5 : 7, profile.ringCount + (compact ? 1 : 3)),
    ),
    ribbonCount: profile.ribbonCount,
    ringGap: profile.ringGap,
    particleDensity: profile.particleDensity,
    driftSpeed: profile.driftSpeed,
    rotationSpeed: profile.rotationSpeed,
    lowResponse: profile.lowResponse,
    midResponse: profile.midResponse,
    highResponse: profile.highResponse,
  }
}

function createGlowTexture(): Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    )
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }
  return Texture.from(canvas)
}

/**
 * Full-screen PixiJS 3D signal environment plus the central transport.
 * One Application, one View3D, one ticker; station/volume/playback changes
 * mutate the live scene and never recreate the renderer. All React-facing
 * updates flow through the controller; the render loop is owned here.
 */
export async function createRadioScene(
  container: HTMLElement,
  options: RadioSceneOptions,
): Promise<RadioSceneController> {
  // Headless and low-end machines may lack a real GPU and fall back to a
  // software rasterizer (SwiftShader/llvmpipe), where fullscreen MSAA
  // rendering is pathologically slow. Detect that case up front and degrade.
  const probeContext = document.createElement('canvas').getContext('webgl2')
  const probeInfo = probeContext?.getExtension('WEBGL_debug_renderer_info')
  const glRendererName = probeInfo
    ? String(probeContext!.getParameter(probeInfo.UNMASKED_RENDERER_WEBGL))
    : ''
  const softwareRasterizer = /swiftshader|llvmpipe|softpipe|software/i.test(glRendererName)
  const compact =
    softwareRasterizer || container.clientWidth < 700 || (navigator.hardwareConcurrency ?? 8) <= 4

  const app = new Application()
  await app.init({
    resizeTo: container,
    antialias: !compact && !softwareRasterizer,
    backgroundAlpha: 0,
    preference: 'webgl',
    autoDensity: true,
    resolution: Math.min(
      window.devicePixelRatio || 1,
      softwareRasterizer ? 0.6 : compact ? 1.15 : 1.5,
    ),
  })

  const view = new View3D({
    autoResize: true,
    toneMapping: 'aces',
    environment: { skyColor: 0x39465e, groundColor: 0x0a0d14, intensity: 0.5 },
    background: null,
  })
  app.stage.addChild(view)
  view.camera.fov = FOV
  view.camera.position.set(0, 0, CAMERA_Z)
  view.camera.lookAt(ORIGIN)

  const key = new DirectionalLight({ color: 0xe8f0ff, intensity: 2.6 })
  key.position.set(3, 4, 6)
  key.lookAt(ORIGIN)
  const signalFill = new PointLight({ color: 0x7dd3fc, intensity: 2.2, range: 3.2 })
  signalFill.position.set(0, 0, 1.2)
  view.root.addChild(key, signalFill)

  const environmentRoot = new Container3D()
  const transportRoot = new Container3D()
  view.root.addChild(environmentRoot, transportRoot)

  const glowTexture = createGlowTexture()
  const environment = createEnvironmentScene(environmentRoot, glowTexture, compact ? 80 : 150)
  const transport = createTransportScene(transportRoot, glowTexture)

  // -- Mutable state -------------------------------------------------------------
  let targetProfile = VISUAL_PROFILES[options.stationId]
  let targetParams = paramsFromProfile(targetProfile, compact)
  const currentParams: EnvironmentParams = { ...targetParams }
  let targetColors = targetProfile.palette.map(hexToRgb) as [Rgb, Rgb, Rgb]
  const currentColors: [Rgb, Rgb, Rgb] = [
    [...targetColors[0]],
    [...targetColors[1]],
    [...targetColors[2]],
  ] as [Rgb, Rgb, Rgb]

  let playback = options.playback
  let volume = options.volume
  let muted = options.muted
  let reducedMotion = options.reducedMotion
  let transportRect: DOMRectReadOnly | null = null
  let stageScale = 1
  let elapsed = 0
  let low = 0
  let mid = 0
  let high = 0
  let pointerX = 0
  let pointerY = 0
  let smoothPointerX = 0
  let smoothPointerY = 0
  let disposed = false
  let renderCostEma = 16
  let frameTick = 0
  let frequencyData = new Uint8Array(0)
  let analyserSize = -1

  environment.setTargetParams(targetParams)
  environment.setSignalColors(targetProfile.palette)
  transport.setSignalColor(targetProfile.palette[0], targetProfile.palette[2])
  transport.setVolume(volume, muted)
  signalFill.color = targetProfile.palette[0]

  // -- Transport alignment ---------------------------------------------------------
  const alignTransport = () => {
    const screenW = app.screen.width
    const screenH = app.screen.height
    if (!transportRect || screenW === 0 || screenH === 0) return
    const worldPerPixel = (2 * CAMERA_Z * Math.tan((FOV / 2) * (Math.PI / 180))) / screenH
    const centerX = transportRect.left + transportRect.width / 2
    const centerY = transportRect.top + transportRect.height / 2
    const x = (centerX - screenW / 2) * worldPerPixel
    const y = (screenH / 2 - centerY) * worldPerPixel
    stageScale = transportRect.width * worldPerPixel
    transportRoot.position.set(x, y, 0)
    transportRoot.scale.set(stageScale, stageScale, stageScale)
    environmentRoot.position.set(x, y, 0)
  }

  const onRendererResize = () => {
    alignTransport()
    if (!app.ticker.started) renderOnce()
  }
  app.renderer.on('resize', onRendererResize)

  // -- Analyser bands ----------------------------------------------------------------
  const sampleBands = () => {
    const analyser = options.getAnalyser()
    if (!analyser) return ZERO_BANDS
    if (analyser.frequencyBinCount !== analyserSize) {
      analyserSize = analyser.frequencyBinCount
      frequencyData = new Uint8Array(analyserSize)
    }
    analyser.getByteFrequencyData(frequencyData)
    let lowTotal = 0
    let midTotal = 0
    let highTotal = 0
    let lowCount = 0
    let midCount = 0
    let highCount = 0
    for (let index = 0; index < frequencyData.length; index++) {
      const ratio = index / frequencyData.length
      const value = frequencyData[index]! / 255
      if (ratio < 0.12) {
        lowTotal += value
        lowCount++
      } else if (ratio < 0.45) {
        midTotal += value
        midCount++
      } else if (ratio < 0.8) {
        highTotal += value
        highCount++
      }
    }
    return {
      low: lowCount ? lowTotal / lowCount : 0,
      mid: midCount ? midTotal / midCount : 0,
      high: highCount ? highTotal / highCount : 0,
    }
  }

  // -- Frame --------------------------------------------------------------------------
  const applyFrame = (dt: number) => {
    elapsed += dt
    const audible = isAudible(playback)
    const bands = audible ? sampleBands() : ZERO_BANDS
    low = damp(low, bands.low, 4, dt)
    mid = damp(mid, bands.mid, 4, dt)
    high = damp(high, bands.high, 4, dt)
    smoothPointerX = damp(smoothPointerX, pointerX, 2.5, dt)
    smoothPointerY = damp(smoothPointerY, pointerY, 2.5, dt)

    const lambda = 2.2
    currentParams.ringGap = damp(currentParams.ringGap, targetParams.ringGap, lambda, dt)
    currentParams.particleDensity = damp(
      currentParams.particleDensity,
      targetParams.particleDensity,
      lambda,
      dt,
    )
    currentParams.driftSpeed = damp(currentParams.driftSpeed, targetParams.driftSpeed, lambda, dt)
    currentParams.rotationSpeed = damp(
      currentParams.rotationSpeed,
      targetParams.rotationSpeed,
      lambda,
      dt,
    )
    currentParams.lowResponse = damp(
      currentParams.lowResponse,
      targetParams.lowResponse,
      lambda,
      dt,
    )
    currentParams.midResponse = damp(
      currentParams.midResponse,
      targetParams.midResponse,
      lambda,
      dt,
    )
    currentParams.highResponse = damp(
      currentParams.highResponse,
      targetParams.highResponse,
      lambda,
      dt,
    )
    for (let index = 0; index < 3; index++) {
      for (let channel = 0; channel < 3; channel++) {
        currentColors[index]![channel] = damp(
          currentColors[index]![channel]!,
          targetColors[index]![channel]!,
          3,
          dt,
        )
      }
    }

    const colors: [number, number, number] = [
      rgbToInt(currentColors[0]),
      rgbToInt(currentColors[1]),
      rgbToInt(currentColors[2]),
    ]
    signalFill.color = colors[0]
    environment.setSignalColors(colors)
    environment.update({ elapsed, low, mid, high, params: currentParams, stageScale })
    transport.setSignalColor(colors[0], colors[2])
    transport.setVolume(volume, muted)
    transport.update(dt, elapsed, low, audible, reducedMotion)

    view.camera.position.x =
      Math.sin(elapsed * currentParams.driftSpeed * 0.22) * 0.16 + smoothPointerX * 0.22
    view.camera.position.y =
      Math.cos(elapsed * currentParams.driftSpeed * 0.18) * 0.1 - smoothPointerY * 0.16
    view.camera.lookAt(ORIGIN)
  }

  const renderFrame = () => {
    frameTick++
    // Adaptive pacing: if rendering consistently blows the frame budget,
    // render every Nth tick so input handling and audio stay responsive.
    const skip = renderCostEma > 66 ? 3 : renderCostEma > 33 ? 2 : 1
    if (frameTick % skip !== 0) return
    const start = performance.now()
    app.render()
    renderCostEma += (performance.now() - start - renderCostEma) * 0.1
  }

  const tick = (ticker: Ticker) => {
    if (disposed) return
    applyFrame(Math.min(0.05, ticker.deltaMS / 1000))
    renderFrame()
  }
  app.ticker.add(tick)
  // The ticker plugin registers app.render; rendering is driven manually so
  // adaptive frame skipping can drop frames.
  app.ticker.remove(app.render, app)

  const renderOnce = () => {
    if (disposed) return
    applyFrame(1 / 60)
    app.render()
  }

  // -- DOM events -----------------------------------------------------------------------
  const onPointerMove = (event: PointerEvent) => {
    if (reducedMotion) return
    pointerX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2
    pointerY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2
  }
  const onVisibilityChange = () => {
    if (document.hidden) {
      app.stop()
    } else if (reducedMotion) {
      renderOnce()
    } else {
      app.start()
    }
  }
  const onContextLost = (event: Event) => {
    event.preventDefault()
    options.onContextLost()
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  app.canvas.addEventListener('webglcontextlost', onContextLost)

  app.canvas.setAttribute('aria-hidden', 'true')
  app.canvas.style.pointerEvents = 'none'
  container.appendChild(app.canvas)

  // -- Boot ------------------------------------------------------------------------------
  alignTransport()
  if (reducedMotion) {
    app.stop()
    renderOnce()
  } else {
    app.start()
  }

  return {
    setStation(stationId) {
      if (disposed) return
      targetProfile = VISUAL_PROFILES[stationId]
      targetParams = paramsFromProfile(targetProfile, compact)
      targetColors = targetProfile.palette.map(hexToRgb) as [Rgb, Rgb, Rgb]
      environment.setTargetParams(targetParams)
      if (reducedMotion) renderOnce()
      else app.start()
    },
    setPlayback(status) {
      if (disposed) return
      playback = status
      if (reducedMotion) {
        renderOnce()
      } else {
        app.start()
      }
    },
    setVolume(nextVolume, nextMuted) {
      if (disposed) return
      volume = nextVolume
      muted = nextMuted
      if (!app.ticker.started) renderOnce()
    },
    setTransportState(state) {
      if (disposed) return
      transport.setVisualState(state)
      if (!app.ticker.started) renderOnce()
    },
    setTransportRect(rect) {
      if (disposed) return
      transportRect = rect
      alignTransport()
      if (!app.ticker.started) renderOnce()
    },
    setReducedMotion(nextReducedMotion) {
      if (disposed) return
      reducedMotion = nextReducedMotion
      if (reducedMotion) {
        pointerX = 0
        pointerY = 0
        app.stop()
        renderOnce()
      } else {
        app.start()
      }
    },
    renderOnce,
    dispose() {
      if (disposed) return
      disposed = true
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      app.canvas.removeEventListener('webglcontextlost', onContextLost)
      app.renderer.off('resize', onRendererResize)
      try {
        app.stop()
        transport.destroy()
        environment.destroy()
        view.root.removeChild(environmentRoot)
        view.root.removeChild(transportRoot)
        glowTexture.destroy(true)
        app.destroy({ removeView: true, releaseGlobalResources: true })
      } catch {
        // A lost WebGL context can make orderly teardown throw; the canvas
        // is removed either way and the CSS fallback takes over.
        app.canvas.remove()
      }
    },
  }
}
