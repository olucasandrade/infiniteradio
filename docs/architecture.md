# Architecture

Infinite Radio is a `pnpm` workspace monorepo. The product is a static
web app — no backend, no accounts — that generates music in the browser
with the Web Audio API.

## Packages and dependency rules

```text
apps/web                    React 18 + Vite + Tailwind + Zustand
  ├── packages/design-system    UI primitives, tokens consumers
  ├── packages/audio-engine     Web Audio engine, instruments, scheduler
  ├── packages/composition-engine  music theory / generation
  ├── packages/stations         the seven station definitions
  └── packages/shared           domain types, constants, validation

packages/stations     → composition-engine, shared
packages/composition-engine → shared
packages/audio-engine → shared
packages/design-system    → shared
```

Hard rules:

- The composition engine never depends on the audio engine (musical
  decisions are platform independent).
- The audio engine never depends on React.
- Station definitions contain no browser-specific code.
- The UI never generates musical notes or schedules audio events — it
  only drives the engines through their public APIs.

## Data flow

```text
Station Definition (packages/stations)
        │  SectionGenerator
        ▼
Composition events (MusicalEvent[], beats not seconds)
        │  LookaheadScheduler (AudioContext clock)
        ▼
Instrument voices (oscillators, noise, envelopes)
        │  StationBus (per-station effects sends)
        ▼
Master chain: gain → limiter → analyser → destination
```

- **What** should happen musically is decided by each station's
  `SectionGenerator` using the composition engine, with a seeded random
  source — the same seed and configuration always produce the same music.
- **When** it happens is decided by the audio scheduler, which schedules
  whole sections slightly ahead of the AudioContext clock.
- **How** it sounds is decided by the instrument implementations and the
  per-station effect chain.

## Application state

Three Zustand stores live in `apps/web/src/stores`:

- `playerStore` — playback status, current station/mood, volume, mute,
  favorites, per-station customization. Actions call the engine
  singleton (`features/listening/engine.ts`).
- `settingsStore` — reduced motion, visualizer (Signal Space), default
  station, reset preferences.
- Persistence (`stores/index.ts`) serializes both into one validated
  `PlayerPreferences` object in localStorage on every change. Audio
  objects are never serialized; corrupted storage falls back to
  defaults (see `packages/shared/src/validation/preferences.ts`).

## Key decisions

- **No Tone.js** — scheduling, envelopes, FM, and effects are built on
  raw Web Audio primitives; the project exists partly to learn DSP
  fundamentals.
- **Sections, not loops** — music is generated bar-by-bar in sections
  with an arrangement cycle (intro/build/main/variation/breakdown), so
  the stream evolves instead of repeating.
- **Seeded randomness everywhere in composition** — reproducible music
  makes the generators testable and debuggable.
- **Workspace packages ship TypeScript source** — Vite transforms them
  directly; no build step per package, so types and implementation can
  never drift.

## Signal Space (PixiJS 3D scene)

`apps/web/src/features/scene/` implements the audio-reactive background
and the central 3D transport. PixiJS (`pixi.js` v8 + `@pixi/3d`) is
loaded on demand — `RadioSceneCanvas.tsx` owns the React lifecycle
(dynamic import, settings integration, imperative transport-rect/state
bridge, fallback selection) and `radioScene.ts` owns everything WebGL
(`Application`, one `View3D`, ticker loop, analyser sampling, adaptive
frame pacing, resize/visibility/context-loss handling, disposal). The
scene splits into `transportScene.ts` (orb, segmented volume orbit,
busy indicator) and `environmentScene.ts` (wavefront tunnel, signal
ribbons, dust field, low-frequency halo). `visualProfiles.ts` maps each
of the seven `StationId`s to a palette and motion/response profile, so
the scene retargets by damped interpolation instead of renderer
reconstruction; `volumeArc.ts` holds the pure pointer-angle ↔ volume
geometry shared by the scene and the HTML controls.

Hard boundaries: the scene reads the engine's `AnalyserNode` directly in
its frame loop and never publishes continuous audio or pointer values
into React/Zustand; all interaction belongs to semantic HTML layered over
the transparent, `pointer-events-none` canvas. Lifecycle states (reduced
motion, visuals disabled, hidden tab, paused playback, context loss,
unmount) are first-class and covered in `docs/design-system.md` and the
scene tests.

See also: [audio-engine.md](./audio-engine.md),
[composition-engine.md](./composition-engine.md),
[station-system.md](./station-system.md),
[design-system.md](./design-system.md).
