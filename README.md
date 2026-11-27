# Infinite Radio

A browser-based generative radio experience. Choose an atmospheric
station and tune into an evolving set that follows the live transmission
clock. The app runs without an account or backend.

> Stay in the moment. Let the music evolve.

Seven stations ship in this version:

| Station          | Sound                                                           |
| ---------------- | --------------------------------------------------------------- |
| **Weightless**   | Ambient drones and slowly evolving textures                     |
| **Low End**      | Warm instrumental hip-hop with swung, dusty beats               |
| **Blue Notes**   | Jazz and mellow fusion with extended chords                     |
| **Velvet**       | Neo-soul harmony, syncopated bass, behind-the-beat groove       |
| **Vapor Trails** | Vaporwave pads with tape-like drift and half-time motion        |
| **Open Window**  | Instrumental indie with plucked strings and a restrained groove |
| **After Hours**  | Deep downtempo electronic with a steady groove                  |

Every station has three moods, four live sound parameters, original
artwork, and its own arrangement style. Web Audio plays a mix of
synthesized voices and bundled instrument samples, composed live in the
browser.

The interface is a single focused radio screen: one circular play/pause
transport with the volume arranged as an orbit around it, the active
station above, live status below, and three session actions along the
bottom — Stations, Mood, and Sound — in accessible sheets. There is no
track metadata to read: every transmission is generated live. Space
toggles play/pause and the arrow keys move the master volume in 5% steps
(focused controls keep their native keys).

Behind the interface, an optional **Signal Space** scene (PixiJS 3D)
reacts to the live audio: a wavefront tunnel, flowing ribbons, and dust
tinted by the active station, with the 3D transport floating at its
center. It is audio-reactive, respects reduced motion, falls back to a
CSS environment when WebGL is unavailable, and degrades gracefully on
machines without a hardware GPU.

## Requirements

- Node.js >= 20
- pnpm >= 9 (`corepack enable`)

## Installation

```sh
git clone <repo-url> infinite-radio
cd infinite-radio
pnpm install
```

## Development

```sh
pnpm dev        # web app at http://localhost:5173
pnpm test       # unit + component tests across all packages
pnpm lint       # ESLint across the workspace
pnpm typecheck  # tsc --noEmit in every package
pnpm build      # type-check + production build of the web app
pnpm start      # build, then serve the production build (no HMR) at http://localhost:4173
```

Browser tests (Playwright; installs its own dev server):

```sh
cd apps/web
pnpm exec playwright install   # first time only
pnpm e2e                       # chromium, chromium mobile, webkit
```

## Architecture

Monorepo layout (pnpm workspaces):

```text
apps/web                  React 18 + Vite + Tailwind + Zustand app
packages/shared           domain types, constants, seeded RNG, validation
packages/composition-engine  music theory, harmony, rhythm, melody
packages/audio-engine     AudioContext, instruments, effects, scheduler
packages/stations         the seven station definitions + presets
packages/design-system    tokens-driven UI primitives
docs/                     architecture and subsystem documentation
```

The composition engine decides _what_ plays, the audio engine decides
_how_ it sounds and _when_, and the React UI only drives their public
APIs. Station switching crossfades per-station buses; music is generated
in deterministic phrases with station-specific motifs, grooves, and
harmony. The four-minute episode clock carries the set forward, and
listeners tune in at the live position.

Full details: [docs/architecture.md](docs/architecture.md) plus
[audio-engine.md](docs/audio-engine.md),
[composition-engine.md](docs/composition-engine.md),
[station-system.md](docs/station-system.md), and
[design-system.md](docs/design-system.md).

## Customization and persistence

Each station exposes four live parameters (e.g. texture density, swing
intensity, bass intensity) plus three moods. Changes apply to the audio
stream immediately, without restarting playback. Favorites, last
station, moods, customization, volume, and settings persist in
`localStorage` and survive reloads.

## Deployment

The app is fully static — deploy `apps/web/dist` to any static host.

### Cloudflare Pages

Build settings:

- Build command: `pnpm --filter @infinite-radio/web build`
- Build output directory: `apps/web/dist`
- Node version: `20`

With [wrangler](https://developers.cloudflare.com/workers/wrangler/):

```sh
pnpm build
cd apps/web
npx wrangler pages deploy dist --project-name infinite-radio
```

No `_redirects` file is required: the app is a single page with no
routed URLs.

## Browser support and limitations

- Requires the Web Audio API (all evergreen browsers).
- Playback starts only after an explicit user gesture (browser policy).
- Mobile browsers may pause audio when the screen locks or the tab is
  backgrounded; uninterrupted background playback on mobile is **not**
  guaranteed.
- The Signal Space scene respects the reduced-motion setting.
- Signal Space requires WebGL; without it (or with the setting off) the
  CSS environment is used instead and the player stays fully usable.
