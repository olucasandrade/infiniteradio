# Design system

The design system has two layers:

1. **Tokens** — CSS custom properties in `apps/web/src/styles/tokens.css`,
   mapped into Tailwind in `apps/web/tailwind.config.js`.
2. **Primitives** — React components in `packages/design-system/src/primitives`.

## Principles

- Dark-tech and straight to the point. Cool near-black neutrals, readable
  text, restrained mono metadata.
- Depth comes from background contrast, borders, layering, negative space,
  and typography — not shadows or glassmorphism.
- Color roles: the cyan accent drives chrome-level interactive elements
  (focus rings, settings). Inside the player, the active station's signal
  color (`--signal-color`, from its visual-profile palette) drives the
  transport orb aura, the volume orbit, and the 3D accents, interpolating
  over ~1s on station change. Text and bottom controls stay neutral enough
  to preserve contrast at every palette.
- Motion is fast and functional (`--duration-fast` 120ms …
  `--duration-atmospheric` 1200ms for ambience only) and fully disabled
  under `prefers-reduced-motion`
  (see `apps/web/src/styles/animations.css`).

## Signal Space

The background is a PixiJS 3D scene (`@pixi/3d`), one full-screen canvas
behind everything (`pointer-events-none`, `aria-hidden`): broken
concentric wavefronts receding into depth, fine signal ribbons, a slow
dust field, and a station-colored halo behind the central transport. It
keeps the interface's calm contrast and stays restrained: no bloom by
default, no strobing, no camera aggression.

Visual states are part of the design contract:

- **Reduced motion** renders one static frame — no drift, parallax,
  breathing, or audio pulsing; state and color changes stay immediate.
- **Visuals disabled** releases WebGL entirely; the CSS environment
  (near-black base plus a station-tinted radial lift) remains.
- **Paused** keeps the ambient scene in motion; the audio-reactive
  response settles to zero.
- **WebGL failure or context loss** falls back to the CSS environment
  with the player fully usable.
- On machines without a hardware GPU (software rasterizers), the scene
  lowers its render resolution and render rate so the interface stays
  responsive.

## Player shell

The home screen is a single focused radio viewport, not an editorial page:

- **Layout** — full-height shell: 56/64px header, centered stage,
  intrinsic-height session dock above `env(safe-area-inset-bottom)`.
- **Transport** — one dominant circular play/pause orb (3D, flattened
  sphere with a raised rim) with the station H1 above and a live status
  line below. The HTML button owns semantics and input; the pixels come
  from the scene, with a CSS orb fallback while WebGL is unavailable.
- **Volume orbit** — a 300° arc of 60 rounded ticks wrapped around the
  orb, with a 60° gap at 6 o'clock holding the mute button. Pointer drags
  the arc; a visually transparent native range input provides keyboard
  access (`Volume`, `aria-valuetext="65 percent"`).
- **Rounded language** — the player shell supersedes the sharp-corner
  system locally: pill session buttons, `rounded-2xl` station rows,
  `rounded-3xl` sheets. Tokens outside the player stay as-is.
- **Session dock** — three pill actions (`Stations`, `Mood`, `Sound`)
  opening one shared rounded sheet (bottom sheet on mobile, floating
  panel on desktop) with focus trap, Escape, scrim click, and focus
  return.

## Tokens

### Color

| Token                      | Value            | Usage                       |
| -------------------------- | ---------------- | --------------------------- |
| `--color-background`       | `#090B10`        | App background              |
| `--color-surface`          | `#0E1118`        | Cards, panels               |
| `--color-surface-elevated` | `#151A23`        | Popovers, modals            |
| `--color-text-primary`     | `#E6ECF4`        | Primary text                |
| `--color-text-secondary`   | `#98A2B3`        | Secondary text              |
| `--color-text-muted`       | `#5D6774`        | Metadata                    |
| `--color-accent`           | `#22D3EE`        | Primary actions, highlights |
| `--color-accent-hover`     | `#67E8F9`        | Accent hover                |
| `--color-success`          | `#4ADE80`        | Positive states             |
| `--color-danger`           | `#F87171`        | Destructive actions         |
| `--color-border`           | `#1D232E`        | Borders, separators         |
| `--color-overlay`          | `rgba(3,5,9,.6)` | Modal scrims                |

Station identity tints (station-specific surfaces only):

| Token                         | Value     | Station      |
| ----------------------------- | --------- | ------------ |
| `--color-station-weightless`  | `#7DD3FC` | Weightless   |
| `--color-station-hip-hop`     | `#D69A68` | Low End      |
| `--color-station-blue-notes`  | `#E8B46A` | Blue Notes   |
| `--color-station-neo-soul`    | `#D8A0A6` | Velvet       |
| `--color-station-vaporwave`   | `#9BB7D4` | Vapor Trails |
| `--color-station-indie`       | `#A8C9A1` | Open Window  |
| `--color-station-after-hours` | `#A78BFA` | After Hours  |

The same tints drive the ambient wash behind the app and each station's
Signal Space visual profile; they never replace the interactive cyan
accent.

### Typography

Space Grotesk Variable (display and interface text) and JetBrains Mono
Variable (metadata, labels, numbers). Loaded locally via
`@fontsource-variable/*` — no external font services at runtime.

| Token          | Size         | Usage                       |
| -------------- | ------------ | --------------------------- |
| `text-display` | 64px (fluid) | Main editorial heading      |
| `text-h1`      | 48px (fluid) | Page title                  |
| `text-h2`      | 28px (fluid) | Section title, sheet titles |
| `text-h3`      | 18px         | Station title               |
| `text-body-lg` | 16px         | Main descriptions           |
| `text-body`    | 15px         | Standard text               |
| `text-small`   | 13px         | Metadata                    |
| `text-micro`   | 11px         | Fine labels                 |

The radio player's station name is the page's single H1 but intentionally
not an oversized editorial heading: Space Grotesk 20–28px (fluid clamp),
medium weight, slight positive tracking.

### Radius, spacing, motion

- Radius: sharp scale — `rounded-sm` 2px, `rounded-md` 4px,
  `rounded-lg` 8px, `rounded-xl` 12px. Pills (`rounded-full`) are
  reserved for segmented choices (mood selector) and the toggle switch;
  everything else stays sharp. The player shell is the deliberate
  exception: pills, `rounded-2xl`, and `rounded-3xl` there are
  intentional (see "Player shell").
- Spacing: Tailwind's 4px-based scale.
- Motion: `duration-fast|normal|slow|atmospheric`, `ease-standard`,
  `ease-emphasized`.

## Primitives

All primitives live in `@infinite-radio/design-system` and support default,
hover, focus-visible, active, and disabled states with semantic HTML and
accessible labels.

- `Button` — variants `primary | secondary | ghost | destructive`, sizes
  `sm | md | lg`. Labels never wrap; `fullWidth` stretches the button to fill
  its container (the default for modal actions).
- `IconButton` — icon-only control with required `label` (accessible name).
- `Text`, `Heading`, `Label` — typographic building blocks.
- `Badge` — tones `neutral | accent`.
- `Tooltip` — hover/focus reveal.
- `Slider` — keyboard-accessible range control with visible value; built for
  audio-generation parameters (label, min/max/step, `formatValue`).
- `Toggle` — `role="switch"` control.
- `Separator`, `Surface`, `Card` — layout primitives.
- `Modal` — portal dialog with a built-in close button, Escape to close,
  focus return.
- `Popover` — anchored panel, closes on Escape/outside click.
- `Skeleton`, `Spinner` — loading states.
- `VisuallyHidden` — screen-reader-only content.

## Icons

Lucide icons, re-exported from `@infinite-radio/design-system/icons` so the
product uses one consistent set: Play, Pause, Volume2, VolumeX, Heart,
Settings, Chevrons, Shuffle, Sliders, SlidersHorizontal, Sparkles, X, Radio,
Headphones, Info. Do not add icons without a functional purpose.

## Logo

Original SVG mark: a central point with three incomplete concentric arcs and
asymmetric gaps — a signal expanding through space. Files in `apps/web/public`:

- `logo.svg` — primary horizontal lockup (symbol + "infinite radio" wordmark).
- `logo-symbol.svg` — symbol only.
- `logo-light.svg` — for dark backgrounds.
- `logo-dark.svg` — for light backgrounds.
- `logo-mono.svg` — single-color (`currentColor`).
- `favicon.svg` — simplified symbol, legible at 16px.

Usage in the app: the player header uses a small, quiet text wordmark
(`infinite radio`, Space Grotesk, lowercase, letter-spaced). The SVG
lockups remain available for marketing surfaces:

```tsx
<img src="/logo.svg" alt="infinite radio" className="h-8" />
```
