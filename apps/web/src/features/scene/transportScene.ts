import {
  BatchedMesh3D,
  CapsuleGeometry,
  Container3D,
  FlatMaterial,
  Material3D,
  Matrix4,
  Mesh3D,
  PlaneGeometry,
  RenderPassBit,
  SphereGeometry,
  TorusGeometry,
  type BaseMaterial3D,
} from '@pixi/3d'
import type { ColorSource, Texture } from 'pixi.js'

import { quantizeVolume, VOLUME_TICK_COUNT, volumeToPoint } from './volumeArc'

export type TransportVisualState = 'idle' | 'hover' | 'pressed' | 'busy'

/** Radii as fractions of the transport stage (stage = 1 world unit). */
const ORB_RADIUS = 0.2 // 40% orb diameter
const INNER_ORBIT_RADIUS = 0.29
const ORBIT_RADIUS = 0.44

export interface TransportScene {
  setSignalColor(color: ColorSource, headColor: ColorSource): void
  setVolume(volume: number, muted: boolean): void
  setVisualState(state: TransportVisualState): void
  update(dt: number, elapsed: number, low: number, playing: boolean, reducedMotion: boolean): void
  destroy(): void
}

/**
 * The central 3D transport: softly glowing rear aura, 300° segmented volume
 * orbit, thin inner separator, flattened play/pause orb with a raised rim,
 * and a fine busy indicator. The stage is one world unit wide; the scene
 * owner positions and scales the root to match the HTML layout.
 */
export function createTransportScene(root: Container3D, glowTexture: Texture): TransportScene {
  const scratch = new Matrix4()

  // -- Rear aura ------------------------------------------------------------
  const auraMaterial = new FlatMaterial({
    baseColorTexture: glowTexture,
    alphaMode: 'blend',
    alpha: 0.5,
  })
  const aura = new Mesh3D({
    geometry: new PlaneGeometry({ width: 2.3, height: 2.3 }),
    material: auraMaterial,
    position: { x: 0, y: 0, z: -0.22 },
    castShadow: false,
  })
  root.addChild(aura)

  // -- Volume orbit: 60 rounded ticks in one batch --------------------------
  const tickGeometry = new CapsuleGeometry({ radius: 0.007, height: 0.052, radialSegments: 8 })
  const inactiveMaterial = new Material3D({
    baseColor: 0x1c2431,
    roughness: 0.9,
    metallic: 0,
    alphaMode: 'blend',
    alpha: 0.45,
    emissive: { color: 0x000000, strength: 0 },
  })
  const activeMaterial = new Material3D({
    baseColor: 0x7dd3fc,
    roughness: 0.6,
    metallic: 0,
    alphaMode: 'blend',
    alpha: 0.95,
    emissive: { color: 0x7dd3fc, strength: 0.55 },
  })
  const headMaterial = new Material3D({
    baseColor: 0xb8d9e8,
    roughness: 0.6,
    metallic: 0,
    alphaMode: 'blend',
    alpha: 1,
    emissive: { color: 0xb8d9e8, strength: 1.2 },
  })
  const orbit = new BatchedMesh3D({ size: VOLUME_TICK_COUNT })
  const slotMaterials: BaseMaterial3D[] = new Array(VOLUME_TICK_COUNT).fill(inactiveMaterial)
  const center = { x: 0, y: 0 }
  for (let index = 0; index < VOLUME_TICK_COUNT; index++) {
    const point = volumeToPoint((index + 0.5) / VOLUME_TICK_COUNT, ORBIT_RADIUS, center)
    // Screen-polar angles have y pointing down; the world has y up, so the
    // position flips y and the tick rotation uses the flipped angle.
    const phi = -Math.atan2(point.y, point.x)
    orbit.setMatrixAt(
      index,
      scratch.makeRotationZ(phi - Math.PI / 2).setPosition({ x: point.x, y: -point.y, z: 0 }),
    )
    orbit.setGeometryAt(index, tickGeometry)
    orbit.setMaterialAt(index, inactiveMaterial)
    orbit.setPassesAt(index, RenderPassBit.TRANSPARENT)
  }
  root.addChild(orbit)

  let litSegments = -1
  let mutedDisplay = false

  // -- Inner separator -------------------------------------------------------
  const innerOrbit = new Mesh3D({
    geometry: new TorusGeometry({ radius: INNER_ORBIT_RADIUS, tube: 0.0032, tubularSegments: 96 }),
    material: new Material3D({ baseColor: 0x232c3a, roughness: 0.5, metallic: 0.55 }),
    rotation: { x: Math.PI / 2, y: 0, z: 0 },
    castShadow: false,
  })
  root.addChild(innerOrbit)

  // -- Busy indicator: a fine bead circling the inner orbit ------------------
  const busyBeadMaterial = new Material3D({
    baseColor: 0x7dd3fc,
    emissive: { color: 0x7dd3fc, strength: 1.6 },
    roughness: 0.5,
  })
  const busyBead = new Mesh3D({
    geometry: new SphereGeometry({ radius: 0.012, widthSegments: 12, heightSegments: 8 }),
    material: busyBeadMaterial,
    castShadow: false,
  })
  busyBead.visible = false
  root.addChild(busyBead)

  // -- Play/pause orb ---------------------------------------------------------
  const orbGroup = new Container3D()
  orbGroup.position.z = 0.02
  root.addChild(orbGroup)

  const orbMaterial = new Material3D({
    baseColor: 0x161c26,
    roughness: 0.42,
    metallic: 0.22,
    emissive: { color: 0x7dd3fc, strength: 0.16 },
  })
  const orb = new Mesh3D({
    geometry: new SphereGeometry({ radius: ORB_RADIUS, widthSegments: 48, heightSegments: 32 }),
    material: orbMaterial,
  })
  orb.scale.set(1, 1, 0.55)
  orbGroup.addChild(orb)

  const rim = new Mesh3D({
    geometry: new TorusGeometry({ radius: ORB_RADIUS, tube: 0.011, tubularSegments: 72 }),
    material: new Material3D({ baseColor: 0x39424f, roughness: 0.3, metallic: 0.85 }),
    castShadow: false,
  })
  rim.scale.set(1, 1, 0.55)
  rim.rotation.x = Math.PI / 2
  orbGroup.addChild(rim)

  // -- Interaction state -------------------------------------------------------
  let visualState: TransportVisualState = 'idle'
  let depth = 0.02 // damped z offset
  let pressScale = 1 // damped press squash
  let beadAngle = 0

  const setSignalColor = (color: ColorSource, headColor: ColorSource) => {
    activeMaterial.baseColor = color
    activeMaterial.emissive!.color = color
    headMaterial.baseColor = headColor
    headMaterial.emissive!.color = headColor
    orbMaterial.emissive!.color = color
    auraMaterial.baseColor = color
    busyBeadMaterial.emissive!.color = color
    busyBeadMaterial.baseColor = color
  }

  const setVolume = (volume: number, muted: boolean) => {
    const segments = quantizeVolume(muted ? 0 : volume)
    if (segments === litSegments && muted === mutedDisplay) return
    litSegments = segments
    mutedDisplay = muted
    for (let index = 0; index < VOLUME_TICK_COUNT; index++) {
      const material =
        index < segments
          ? index === segments - 1
            ? headMaterial
            : activeMaterial
          : inactiveMaterial
      if (slotMaterials[index] !== material) {
        slotMaterials[index] = material
        orbit.setMaterialAt(index, material)
      }
    }
  }

  const setVisualState = (state: TransportVisualState) => {
    visualState = state
  }

  const update = (
    dt: number,
    elapsed: number,
    low: number,
    playing: boolean,
    reducedMotion: boolean,
  ) => {
    const busy = visualState === 'busy'
    busyBead.visible = busy
    if (busy) {
      beadAngle += dt * 2.6
      busyBead.position.set(
        Math.cos(-beadAngle) * INNER_ORBIT_RADIUS,
        Math.sin(-beadAngle) * INNER_ORBIT_RADIUS,
        0.01,
      )
    }

    if (reducedMotion) {
      depth = 0.02
      pressScale = 1
      orbGroup.position.z = depth
      orbGroup.scale.set(1, 1, 1)
      orbMaterial.emissive!.strength = 0.16
      auraMaterial.alpha = 0.5
      return
    }

    // Hover eases the orb toward the camera; pressed compresses it.
    const depthTarget =
      visualState === 'pressed' ? -0.012 : visualState === 'hover' || busy ? 0.05 : 0.02
    const pressTarget = visualState === 'pressed' ? 0.97 : 1
    depth += (depthTarget - depth) * Math.min(1, dt * 14)
    pressScale += (pressTarget - pressScale) * Math.min(1, dt * 18)
    orbGroup.position.z = depth
    orbGroup.scale.set(pressScale, pressScale, pressScale * (visualState === 'pressed' ? 0.92 : 1))

    // Breathing aura while audible; always a whisper of station color.
    const breathe = playing ? 0.05 + Math.sin(elapsed * 1.6) * 0.035 + low * 0.22 : 0
    const hoverLift = visualState === 'hover' ? 0.12 : 0
    orbMaterial.emissive!.strength = 0.14 + breathe + hoverLift
    auraMaterial.alpha = 0.42 + (playing ? low * 0.22 : 0) + (busy ? 0.12 : 0)
    const auraPulse = 1 + (playing ? low * 0.07 : 0) + (busy ? Math.sin(elapsed * 3) * 0.015 : 0)
    aura.scale.set(auraPulse, auraPulse, 1)
  }

  const destroy = () => {
    tickGeometry.destroy()
    inactiveMaterial.destroy()
    activeMaterial.destroy()
    headMaterial.destroy()
    auraMaterial.destroy()
    innerOrbit.material.destroy()
    innerOrbit.geometry.destroy()
    orb.geometry.destroy()
    orbMaterial.destroy()
    rim.geometry.destroy()
    rim.material.destroy()
    busyBead.geometry.destroy()
    busyBeadMaterial.destroy()
    orbit.destroy()
    aura.geometry.destroy()
  }

  return { setSignalColor, setVolume, setVisualState, update, destroy }
}
