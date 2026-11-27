import type { StationId, StationVisualProfile } from '@infinite-radio/shared'

export const VISUAL_PROFILES: Record<StationId, StationVisualProfile> = {
  weightless: {
    palette: ['#7dd3fc', '#426b83', '#b8d9e8'], ringCount: 5, ringGap: 0.52,
    ribbonCount: 2, particleDensity: 0.55, driftSpeed: 0.12, rotationSpeed: 0.025,
    lowResponse: 0.32, midResponse: 0.22, highResponse: 0.16,
  },
  'hip-hop': {
    palette: ['#d69a68', '#78523c', '#e2c0a1'], ringCount: 4, ringGap: 0.62,
    ribbonCount: 2, particleDensity: 0.72, driftSpeed: 0.18, rotationSpeed: 0.045,
    lowResponse: 0.58, midResponse: 0.26, highResponse: 0.2,
  },
  'blue-notes': {
    palette: ['#e8b46a', '#766044', '#d6c6a6'], ringCount: 5, ringGap: 0.48,
    ribbonCount: 3, particleDensity: 0.58, driftSpeed: 0.15, rotationSpeed: 0.035,
    lowResponse: 0.4, midResponse: 0.34, highResponse: 0.25,
  },
  'neo-soul': {
    palette: ['#d8a0a6', '#76525f', '#dbc1c7'], ringCount: 4, ringGap: 0.58,
    ribbonCount: 3, particleDensity: 0.48, driftSpeed: 0.11, rotationSpeed: 0.028,
    lowResponse: 0.44, midResponse: 0.38, highResponse: 0.18,
  },
  vaporwave: {
    palette: ['#9bb7d4', '#536779', '#c1ced8'], ringCount: 6, ringGap: 0.44,
    ribbonCount: 4, particleDensity: 0.68, driftSpeed: 0.08, rotationSpeed: 0.02,
    lowResponse: 0.3, midResponse: 0.28, highResponse: 0.22,
  },
  indie: {
    palette: ['#a8c9a1', '#536e56', '#ced9bd'], ringCount: 4, ringGap: 0.66,
    ribbonCount: 3, particleDensity: 0.62, driftSpeed: 0.2, rotationSpeed: 0.04,
    lowResponse: 0.36, midResponse: 0.42, highResponse: 0.3,
  },
  'after-hours': {
    palette: ['#a78bfa', '#554879', '#b8add4'], ringCount: 5, ringGap: 0.5,
    ribbonCount: 4, particleDensity: 0.8, driftSpeed: 0.22, rotationSpeed: 0.055,
    lowResponse: 0.62, midResponse: 0.32, highResponse: 0.28,
  },
}
