import {
  BatchedMesh3D,
  Container3D,
  FlatMaterial,
  Geometry3D,
  IcosahedronGeometry,
  Matrix4,
  Mesh3D,
  PlaneGeometry,
  RenderPassBit,
  TorusGeometry,
} from '@pixi/3d'
import type { ColorSource, Texture } from 'pixi.js'

export interface EnvironmentParams {
  ringCount: number
  ribbonCount: number
  ringGap: number
  particleDensity: number
  driftSpeed: number
  rotationSpeed: number
  lowResponse: number
  midResponse: number
  highResponse: number
}

export interface EnvironmentFrame {
  elapsed: number
  low: number
  mid: number
  high: number
  params: EnvironmentParams
  /** World-units per stage; the halo scales with the transport. */
  stageScale: number
}

export interface EnvironmentScene {
  setSignalColors(colors: readonly [ColorSource, ColorSource, ColorSource]): void
  setTargetParams(params: EnvironmentParams): void
  update(frame: EnvironmentFrame): void
  destroy(): void
}

const MAX_RINGS = 10
const MAX_RIBBONS = 4
const RIBBON_SEGMENTS = 56

interface RingEntry {
  mesh: Mesh3D
  material: FlatMaterial
  baseRadius: number
  index: number
}

interface RibbonEntry {
  mesh: Mesh3D
  geometry: Geometry3D
  material: FlatMaterial
  positions: Float32Array
  index: number
}

/**
 * The "Signal Observatory" backdrop: broken concentric wavefronts receding
 * into depth, fine signal ribbons crossing the far field, a slow drifting
 * dust field, and a station-colored low-frequency halo behind the
 * transport. All buffers are preallocated; per-frame work writes in place.
 */
export function createEnvironmentScene(
  root: Container3D,
  glowTexture: Texture,
  particleCount: number,
): EnvironmentScene {
  const scratch = new Matrix4()

  // -- Far wavefronts ---------------------------------------------------------
  const wavefronts: RingEntry[] = []
  for (let index = 0; index < MAX_RINGS; index++) {
    const arc = Math.PI * (1.3 + (index % 3) * 0.14)
    const geometry = new TorusGeometry({
      radius: 1,
      tube: 0.0065,
      tubularSegments: 96,
      arc,
    })
    const material = new FlatMaterial({ alphaMode: 'blend', alpha: 0.22 - index * 0.014 })
    const mesh = new Mesh3D({ geometry, material, castShadow: false })
    mesh.rotation.x = Math.PI / 2
    mesh.position.z = -1.0 - index * 0.6
    mesh.rotation.z = index * 0.61
    root.addChild(mesh)
    wavefronts.push({ mesh, material, baseRadius: 2.1 + index * 0.5, index })
  }

  // -- Signal ribbons ----------------------------------------------------------
  const ribbons: RibbonEntry[] = []
  for (let index = 0; index < MAX_RIBBONS; index++) {
    const positions = new Float32Array((RIBBON_SEGMENTS - 1) * 2 * 3)
    const geometry = new Geometry3D({ positions, topology: 'line-list', dynamic: true })
    const material = new FlatMaterial({ alphaMode: 'blend', alpha: 0.16 })
    const mesh = new Mesh3D({ geometry, material, castShadow: false })
    root.addChild(mesh)
    ribbons.push({ mesh, geometry, material, positions, index })
  }

  // -- Dust field ---------------------------------------------------------------
  const dustGeometry = new IcosahedronGeometry({ radius: 0.02, detail: 0 })
  const dustMaterial = new FlatMaterial({ alphaMode: 'blend', alpha: 0.32 })
  const dust = new BatchedMesh3D({ size: particleCount })
  const origins = new Float32Array(particleCount * 3)
  let randomState = 0x2f6e2b1
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    return randomState / 0x1_0000_0000
  }
  for (let index = 0; index < particleCount; index++) {
    origins[index * 3] = (random() - 0.5) * 13
    origins[index * 3 + 1] = (random() - 0.5) * 9
    origins[index * 3 + 2] = -1 - random() * 7
    dust.setMatrixAt(
      index,
      scratch.makeTranslation(
        origins[index * 3]!,
        origins[index * 3 + 1]!,
        origins[index * 3 + 2]!,
      ),
    )
    dust.setGeometryAt(index, dustGeometry)
    dust.setMaterialAt(index, dustMaterial)
    dust.setPassesAt(index, RenderPassBit.TRANSPARENT)
  }
  root.addChild(dust)

  // -- Low-frequency halo -------------------------------------------------------
  const haloMaterial = new FlatMaterial({
    baseColorTexture: glowTexture,
    alphaMode: 'blend',
    alpha: 0.1,
  })
  const halo = new Mesh3D({
    geometry: new PlaneGeometry({ width: 1, height: 1 }),
    material: haloMaterial,
    position: { x: 0, y: 0, z: -0.5 },
    castShadow: false,
  })
  root.addChild(halo)

  // -- State ---------------------------------------------------------------------
  let visibleDustCount = -1

  const setSignalColors = (colors: readonly [ColorSource, ColorSource, ColorSource]) => {
    for (const ring of wavefronts) {
      ring.material.baseColor = colors[ring.index % colors.length]!
    }
    for (const ribbon of ribbons) {
      ribbon.material.baseColor = colors[(ribbon.index + 1) % colors.length]!
    }
    dustMaterial.baseColor = colors[2]!
    haloMaterial.baseColor = colors[0]!
  }

  const setTargetParams = (params: EnvironmentParams) => {
    for (const ring of wavefronts) ring.mesh.visible = ring.index < params.ringCount
    for (const ribbon of ribbons) ribbon.mesh.visible = ribbon.index < params.ribbonCount
  }

  const update = ({ elapsed, low, mid, high, params, stageScale }: EnvironmentFrame) => {
    root.rotation.z = elapsed * params.rotationSpeed + low * params.lowResponse * 0.08
    for (const ring of wavefronts) {
      if (!ring.mesh.visible) continue
      const expansion =
        1 + (params.ringGap - 0.5) * 0.16 + low * params.lowResponse * (0.03 + ring.index * 0.007)
      ring.mesh.scale.set(
        ring.baseRadius * expansion,
        ring.baseRadius * expansion,
        ring.baseRadius * expansion,
      )
      ring.mesh.rotation.z =
        ring.index * 0.3 + elapsed * params.rotationSpeed * (ring.index % 2 ? -0.45 : 0.3)
    }

    for (const ribbon of ribbons) {
      if (!ribbon.mesh.visible) continue
      for (let point = 0; point < RIBBON_SEGMENTS - 1; point++) {
        for (let endpoint = 0; endpoint < 2; endpoint++) {
          const sample = point + endpoint
          const ratio = sample / (RIBBON_SEGMENTS - 1)
          const x = (ratio - 0.5) * 12
          const phase = ratio * Math.PI * 3 + elapsed * (0.14 + ribbon.index * 0.025)
          const writeIndex = (point * 2 + endpoint) * 3
          ribbon.positions[writeIndex] = x
          ribbon.positions[writeIndex + 1] =
            Math.sin(phase + ribbon.index) * (0.45 + ribbon.index * 0.15) +
            (ribbon.index - 1.5) * 0.75 +
            mid * params.midResponse * Math.sin(phase * 1.7) * 0.35
          ribbon.positions[writeIndex + 2] = -2.2 - ribbon.index * 0.6 + Math.cos(phase) * 0.3
        }
      }
      ribbon.geometry.attributes.aPosition!.buffer.update()
    }

    const dustVisible = Math.floor(particleCount * params.particleDensity)
    if (dustVisible !== visibleDustCount) {
      visibleDustCount = dustVisible
      for (let index = 0; index < particleCount; index++) {
        dust.setVisibleAt(index, index < dustVisible)
      }
    }
    const { data, stride, offset } = dust.matrices
    for (let index = 0; index < particleCount; index++) {
      const lane = offset + index * stride
      data[lane + 13] =
        origins[index * 3 + 1]! +
        Math.sin(elapsed * 0.08 + index) * 0.08 +
        high * params.highResponse * 0.18
    }
    dust.matrices.update()

    haloMaterial.alpha = 0.09 + low * 0.1
    const haloScale = stageScale * 3.4 * (1 + low * 0.08)
    halo.scale.set(haloScale, haloScale, 1)
  }

  const destroy = () => {
    for (const ring of wavefronts) {
      ring.mesh.geometry!.destroy()
      ring.material.destroy()
    }
    for (const ribbon of ribbons) {
      ribbon.geometry.destroy()
      ribbon.material.destroy()
    }
    dustGeometry.destroy()
    dustMaterial.destroy()
    dust.destroy()
    halo.geometry.destroy()
    haloMaterial.destroy()
  }

  return { setSignalColors, setTargetParams, update, destroy }
}
