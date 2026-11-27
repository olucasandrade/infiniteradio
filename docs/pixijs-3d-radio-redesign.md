# Infinite Radio — PixiJS 3D single-screen redesign

## Implementation brief

Rebuild the web player as a focused, single-screen infinite radio. The screen has one dominant circular play/pause control, volume arranged around that control, three compact session actions along the bottom, and an immersive PixiJS 3D signal environment behind everything.

This document is an implementation plan for another coding agent. It describes the intended result, component boundaries, interaction details, state mapping, migration sequence, and acceptance criteria. Do not rewrite the audio or composition engines.

Before writing any `@pixi/3d` code, load and follow the `pixijs-3d` skill. For Pixi application, stage, ticker, text, and events, also follow the `pixijs` skill when available. The existing scene is Three.js; this redesign replaces it rather than adding a second rendering stack.

---

## 1. Product intent

### The experience

The user opens Infinite Radio and immediately understands three things:

1. This is an infinite, live-generated radio.
2. The large central circle starts or pauses it.
3. The ring around the circle controls volume.

The current station is visible, but there is no editorial content to read and no page to browse. Starting audio may take time, so the player says so clearly while the real engine is initializing. Everything else—station, mood, and sound tuning—is available from the bottom actions without leaving the screen.

### Visual direction: “Signal Observatory”

A dark, cinematic broadcast chamber with a luminous three-dimensional transport floating at its center. Behind it, broken circular wavefronts and fine ribbons recede into depth, forming an infinite signal tunnel rather than a generic star field. The scene should feel deep, quiet, precise, and alive.

Use rounded forms deliberately in this redesign. The existing sharp-corner design language is superseded for the player shell and controls. Keep the existing Space Grotesk and JetBrains Mono fonts, near-black foundation, readable text colors, and station palette data.

### Required copy

Keep visible copy minimal:

- Brand: `infinite radio`
- Above the transport: active station name
- Optional small metadata line: active mood name
- Idle status: `Press play to begin`
- Initializing status: `Starting your transmission…`
- Initializing supporting text: `The first transmission can take a few seconds.`
- Playing status: `Live · Infinite transmission`
- Paused status: `Paused`
- Transitioning status: `Tuning the next station…`
- Error status: `Audio unavailable`
- Error action: `Try again`

Do not display track titles, artists, years, “inspired by” copy, episode progress, “up next,” countdowns, station taglines, or artwork. Do not add a fake buffer percentage.

---

## 2. Scope

### In scope

- Replace the current two-column now-playing layout and station-discovery grid with one responsive viewport experience.
- Replace `three` with `pixi.js` and `@pixi/3d` in the web app.
- Build the background and central transport visuals with PixiJS 3D.
- Add an accessible circular volume interaction around the play/pause button.
- Add bottom actions for `Stations`, `Mood`, and `Sound`.
- Reuse the existing station, mood, parameter, settings, volume, and playback stores.
- Retain Settings in a minimal header.
- Preserve lazy scene loading, reduced motion, visuals-disabled behavior, context-loss recovery, and software-renderer degradation.
- Update unit and end-to-end tests to the new interface.

### Out of scope

- Changing music generation, station definitions, mood definitions, scheduling, crossfades, or persistence schema.
- Adding accounts, backend calls, playlists, song metadata, favorites UI, scrubbing, or track skipping.
- Adding previous/next buttons beside the main transport. Station changes happen in the Stations sheet.
- Adding OrbitCamera or making the user manually navigate the 3D environment.
- Building a dashboard, widget, or separate landing page.

### Existing behavior to preserve

- No audio starts before a user gesture.
- The selected station, mood, sound parameters, volume, mute, and visual preferences persist as they do now.
- Mood and sound changes update the live engine immediately.
- Switching stations while listening continues listening.
- Disabling visuals releases GPU resources without interrupting audio.

---

## 3. Final screen anatomy

### Desktop

```text
┌──────────────────────────────────────────────────────────────────┐
│ infinite radio                                              ⚙    │
│                                                                  │
│                         WEIGHTLESS                               │
│                      Drift · current mood                        │
│                                                                  │
│                    ╭────────────────╮                            │
│                 ╭──│  volume orbit  │──╮                         │
│                │   │   ╭────────╮   │   │                        │
│                │   │   │  PLAY  │   │   │                        │
│                │   │   ╰────────╯   │   │                        │
│                 ╰──│       🔊       │──╯                         │
│                    ╰────────────────╯                            │
│                                                                  │
│               Live · Infinite transmission                       │
│                                                                  │
│             [ Stations ]   [ Mood ]   [ Sound ]                  │
└──────────────────────────────────────────────────────────────────┘
```

This diagram explains hierarchy, not exact pixel placement. The volume ring, transport, background, and bottom dock should feel like one composition rather than separate cards.

### Mobile

- Keep the brand and Settings at the top.
- Center the transport in the available vertical space, accounting for safe areas.
- Use a smaller ring and transport, not a clipped desktop composition.
- Keep all three bottom actions visible in one row above `env(safe-area-inset-bottom)`.
- Sheets open from the bottom and stay within `100dvh`.
- Do not require scrolling to reach Play, volume, or the three session actions.

### Vertical layout

Use a full-height shell with three grid rows:

1. `header`: 64 px desktop, 56 px mobile.
2. `main`: remaining space, centered, minimum height zero.
3. `footer/session dock`: intrinsic height plus safe-area padding.

Within `main`, use a single centered stack: station label, transport stage, playback status. Avoid a max-width content column that makes the background look boxed in.

---

## 4. Visual specification

### Palette and surfaces

Build on the current tokens, with these additions or local equivalents:

| Role | Suggested value | Use |
|---|---|---|
| Deep background | `#05070C` | Outer viewport |
| Center background | `#0B101A` | Subtle radial lift behind transport |
| Primary text | `#EEF4FF` | Station and key status |
| Secondary text | `#9AA8BA` | Mood and supporting text |
| Quiet text | `#66758A` | Nonessential metadata |
| Active signal | Station palette primary | Volume fill, transport aura, 3D accents |
| Inactive track | `rgba(160,180,210,.14)` | Unfilled volume arc |
| Control surface | `rgba(12,17,27,.78)` | Bottom buttons and sheets |
| Control border | `rgba(190,215,255,.13)` | Fine rounded outlines |

Station color may drive the visual identity now; unlike the old design system, it may also tint the active transport and volume ring. Interpolate colors over roughly 800–1200 ms on station change. Text and bottom controls remain neutral enough to preserve contrast.

The CSS background should remain attractive even when WebGL is unavailable:

- Near-black base.
- Large station-tinted radial gradient centered on the transport.
- Very subtle top-edge cool light.
- Optional fine static noise texture generated locally or in CSS, with extremely low opacity.

Do not depend on blur-heavy glassmorphism for legibility. Use a dark radial scrim behind the central UI and behind the bottom dock if the scene becomes bright.

### Typography

- Station name: Space Grotesk, 20–28 px responsive, medium weight, slight positive tracking; use normal title case rather than an oversized editorial H1.
- Mood: JetBrains Mono, 10–12 px, uppercase, letter spacing around `0.12em`.
- Status: Space Grotesk, 13–15 px.
- Bottom actions: Space Grotesk, 13–14 px, medium weight.
- Keep the wordmark small and quiet.

The station name remains the page’s single H1. Sheets use H2 headings.

### Bottom session dock

Three rounded buttons:

1. `Stations` with Radio icon.
2. `Mood` with Sparkles or Waves icon.
3. `Sound` with SlidersHorizontal icon.

Specification:

- Height: 44 px minimum; 48 px is preferred on touch screens.
- Horizontal padding: 16–20 px.
- Fully rounded pill shape.
- Icon plus visible text label; do not make these icon-only.
- Gap: 8–12 px.
- Neutral translucent fill, 1 px border, subtle inner highlight.
- Hover: border brightens and button lifts at most 1 px.
- Active/pressed: return to baseline with a slight scale to `0.98`.
- Focus-visible: 2 px high-contrast outline with 2 px offset.
- The active sheet’s trigger uses `aria-expanded="true"` and `aria-controls`.

On narrow mobile, allow labels to shrink slightly and reduce horizontal padding; never hide all labels. The dock must not look like three large cards.

### Sheets

Use one consistent rounded sheet surface rather than three unrelated dialogs.

- Mobile: bottom sheet, rounded top corners 24 px, maximum height `min(78dvh, 680px)`, internally scrollable.
- Desktop: centered compact panel or right-side floating panel, width 380–440 px, radius 24 px.
- Dark scrim over the scene; playback continues.
- Header contains title, contextual station name when relevant, and Close.
- Support Escape, scrim click, focus trap, initial focus, and focus return to the trigger.
- Prevent background interaction while open.

Sheet content:

- **Stations:** compact list of all seven stations. Each row has station name, category, active indicator, and a small palette swatch. Selecting a row calls the existing `selectStation` behavior and closes the sheet. No artwork, long descriptions, separate Play button per row, or favorites.
- **Mood:** reuse `MoodSelector` for the active station. Keep the selected mood obvious. The sheet may close on selection or stay open; prefer staying open so the user can compare moods, with a clear Done/Close action.
- **Sound:** reuse the active station’s `parameterSpecs` and existing `Slider` primitive. Include `Reset station customization`. Changes remain live and do not restart playback.

---

## 5. Central transport specification

### Composition

Use a square stage with a responsive size:

```css
--transport-size: clamp(280px, 42vmin, 420px);
```

Reserve enough vertical room for status text and small screens. On very short landscape screens, reduce to approximately 240–280 px.

The control consists of:

1. A softly glowing rear halo.
2. A 300° segmented volume orbit.
3. A thin inner orbit/separator.
4. A rounded three-dimensional play/pause orb.
5. A crisp play/pause icon and accessible HTML hit target.
6. A mute button in the bottom gap of the volume orbit.

### Play/pause orb

Render the visible button in PixiJS 3D. A flattened sphere or beveled disc is appropriate; do not use a flat rectangular Pixi button. The face points toward the camera and remains circular on screen.

Suggested proportions relative to the transport stage:

- Orb diameter: 38–42% of stage size.
- Inner separator radius: 28–30% of stage size.
- Volume orbit radius: 42–45% of stage size.
- Mute hit target: 44 px minimum regardless of visual icon size.

Material and depth:

- Dark graphite face with a slight cool tint, physically based material, moderate roughness, low metallic response.
- Raised rounded rim catching a soft key light.
- A restrained station-colored emissive group or rim light, not a solid neon disc.
- Soft contact/ambient shadow or halo to separate it from the background.
- Idle: calm and slightly recessed.
- Hover: rim brightens and orb moves toward the camera by a tiny amount.
- Pressed: orb compresses along its depth axis and scales to roughly `0.97` for 80–120 ms.
- Playing: stable, soft breathing aura only; the icon changes immediately to Pause.
- Initializing: disable repeat activation, show a small spinner beside the status text, and optionally rotate a fine outer indicator. Do not substitute the spinner for the required explanatory text.
- Reduced motion: no breathing, hover travel, continuous rotation, or spring motion; state and color changes remain immediate.

Use a real HTML `<button>` positioned exactly over the 3D orb for semantics and input. It can be visually transparent while the Pixi orb supplies the pixels. Keep the Lucide Play/Pause icon in HTML above the orb for sharp rendering, or use a Pixi text/texture only if it remains equally crisp. The HTML button owns click, keyboard, focus, disabled, and accessible naming.

Required states:

- `aria-label="Play"` when idle, ready, or paused.
- `aria-label="Pause"` when playing or audibly transitioning.
- `aria-label="Try again"` when in error.
- `aria-busy="true"` and disabled while `initializing`.
- A visible focus ring around the circular HTML target when keyboard focused.

Do not put a second Play/Pause button in a sheet or elsewhere.

### Volume orbit

The volume control wraps around the play/pause button rather than appearing as a separate horizontal slider.

Geometry:

- Sweep: 300°.
- Leave a 60° gap centered at the bottom (6 o’clock).
- Start at the lower-left end of the gap, progress counterclockwise around the sides and top, and finish at the lower-right end. The implementation may use a different internal angular sign, but visually increasing volume must travel continuously from one end of the arc to the other without crossing the gap.
- Use 56–64 short rounded tick segments or a smooth tube with a segmented highlight. Segments should read as one intentional ring, not a dotted loading spinner.
- Active segments use the current station signal color and gentle emissive intensity.
- Inactive segments remain visible at low opacity.
- At zero, retain the inactive track and show the muted state.
- Add a slightly brighter head segment at the current value, but no large thumb obscuring the ring.

`BatchedMesh3D` is a good fit for the tick segments. Alternatively, shared geometry/material meshes may be used if batching is verified. Do not create and destroy ring geometry on every volume update.

Input behavior:

- Pointer down on the visible arc sets volume and begins dragging.
- Use pointer capture so dragging remains continuous outside the arc.
- Map the pointer angle to the 300° arc, clamp at both endpoints, and ignore clicks in the bottom gap except on Mute.
- Quantize only for display/segment illumination; stored volume remains the existing normalized number.
- `setVolume(value)` is called during drag, matching the existing live-volume behavior.
- If the user drags above zero while muted, unmute exactly as the current `VolumeControl` does.
- Clicking Mute calls `toggleMute`; while muted, the ring displays zero active segments but retains the last nonzero `volume` for unmute.
- While dragging or keyboard focused, show a small `Volume 65%` readout near the ring or status area. It may fade after interaction.
- Do not add wheel-to-volume; it interferes with normal page and trackpad behavior.

Accessibility:

Provide a semantic `<input type="range" min="0" max="100" step="1">` named `Volume`, backed by the same store state. It can be visually transparent over the control, but it must support keyboard interaction and expose `aria-valuetext="65 percent"`. The custom arc handles pointer geometry; the range handles Arrow keys, Home, End, Page Up, and Page Down natively. Avoid two competing tab stops or two elements both named Volume.

When the range has focus, display a clear circular focus treatment. Keep Mute as a separate 44 px button named `Mute` or `Unmute`.

### Aligning DOM and Pixi visuals

Use one full-screen Pixi canvas for both background and transport. The HTML transport wrapper establishes layout and hit targets; the scene controller receives its bounding rectangle.

On resize:

- Measure the transport wrapper with `ResizeObserver`.
- Convert its screen-space center and pixel radius to world units at the transport’s Z plane.
- Position and scale the 3D transport to match the HTML targets.
- Recompute after viewport resize, orientation change, and header/dock size changes.
- Keep the canvas `pointer-events: none`; all interaction belongs to semantic HTML above it.

If precise projection alignment becomes fragile, an acceptable fallback is a separate small Pixi `View3D` for the transport sharing the same application/renderer architecture, but do not create multiple independent animation loops. Prefer the single-scene implementation.

---

## 6. PixiJS 3D environment

### Scene structure

Create a `View3D` on the Pixi stage. All 3D objects belong under `view.root`; 2D HTML stays outside Pixi.

Suggested groups:

```text
view.root
├── environmentRoot
│   ├── farWavefronts
│   ├── signalRibbons
│   ├── dustField
│   └── lowFrequencyHalo
├── transportRoot
│   ├── rearAura
│   ├── volumeOrbit
│   ├── innerOrbit
│   └── playOrb
├── camera (owned by view)
└── lights
```

Do not clear or hide `view.root`, because it also holds the camera. Clear only child content groups when necessary.

### Background layers

Build depth with a small number of reusable geometries:

1. **Far wavefronts:** 7–10 broken concentric rings at increasing negative Z positions and radii. Alternate arc lengths and rotational offsets. Use low opacity and thin geometry. Their spacing and slow counter-rotation imply an endless transmission tunnel.
2. **Signal ribbons:** 2–4 restrained three-dimensional curves crossing the far field. Deform a preallocated position buffer each active frame using slow sine waves plus mid-band energy. Avoid thick bright lines across text.
3. **Dust field:** 100–180 tiny points or instanced low-poly particles, fewer on compact devices. Use deterministic seeded randomness. Slow depth drift, no fast forward flight.
4. **Central halo:** a soft station-colored atmospheric shape behind the transport. It responds gently to low frequencies but never flashes.
5. **Transport accents:** volume ticks and orb rim share the same palette so foreground and background feel connected.

The existing `VISUAL_PROFILES` remains the source for station palettes, ring counts, particle density, drift, rotation, and low/mid/high response. Rename fields only if useful; do not create a second conflicting station palette file.

### Camera and lighting

- Use a perspective camera for background depth, with a modest FOV around 40–45°.
- Keep the camera nearly fixed. Pointer parallax should be extremely subtle, damped, and disabled for reduced motion.
- No user orbit, zoom, or first-person control.
- Add a soft directional key light for the orb and restrained hemisphere environment fill.
- Use `toneMapping: 'aces'` if emissive materials, strong lights, or bloom are used.
- Keep direct-light intensity physically sensible; avoid washing out the orb face or background.

### Post-processing

Bloom is optional, not required for the first complete pass. If used:

- Only emissive highlights should cross the bloom threshold.
- No full-screen glow that reduces text contrast.
- Disable bloom in compact/software-renderer mode.
- Keep MSAA from `Application.init({ antialias: true })` on capable devices; do not add redundant FXAA with MSAA.

The design must still look impressive with bloom disabled.

### Audio reactivity

Reuse the current analyser sampling approach:

- Low band: subtle halo and ring expansion.
- Mid band: ribbon displacement.
- High band: tiny dust/edge brightness variation.
- Smooth all bands; cap deltas and response amplitudes.
- Keep the ambient scene animating continuously while paused; audio sampling pauses and the smoothed bands settle to zero.
- No strobing, beat flashes, aggressive camera shake, or large scale jumps.

---

## 7. Playback and startup state contract

Use the real `PlaybackStatus` from the store. Do not infer startup completion from a timer.

| Status | Main icon/action | Visible status | Scene behavior |
|---|---|---|---|
| `idle` | Play | Press play to begin | Slow ambient scene, always in motion |
| `ready` | Play | Ready to play | Ambient scene |
| `initializing` | Disabled, busy | Starting your transmission… + first-start explanation | Gentle deterministic startup indicator |
| `playing` | Pause | Live · Infinite transmission | Audio-reactive animation |
| `paused` | Play | Paused | Ambient drift continues; audio response settles to zero |
| `transitioning` | Pause | Tuning the next station… | Continue smooth reactive scene |
| `error` | Try again | Audio unavailable + actionable alert | Calm ambient scene |

Implementation notes:

- Start initialization inside the original click gesture through the existing `play()` path.
- Prevent double-clicks from starting multiple initialization attempts.
- The status region uses `aria-live="polite"` and `aria-atomic="true"`.
- Do not announce volume changes through that same live region.
- Errors use `role="alert"` and preserve a working retry action.
- If `togglePlay()` currently only pauses on `playing`, update it to use the shared `isAudible()` helper so an audible `transitioning` state also pauses correctly. Do not otherwise redesign store actions.

---

## 8. Proposed component architecture

Keep React responsible for product UI and accessibility. Keep Pixi responsible for visuals only.

```text
App
└── AppShell
    ├── RadioSceneCanvas
    │   └── lazy createRadioScene(controller API)
    ├── Header
    │   └── SettingsMenu
    ├── RadioStage
    │   ├── StationIdentity
    │   ├── Transport
    │   │   ├── TransportTargets (Play + circular Volume + Mute)
    │   │   └── PlaybackStatus
    │   └── TransportLayoutBridge (rect -> scene)
    ├── SessionDock
    └── SessionSheet
        ├── StationList
        ├── MoodSelector
        └── SoundParameters
```

Suggested files:

| File | Responsibility |
|---|---|
| `apps/web/src/components/layout/AppShell.tsx` | Full-viewport composition, sheet state, scene props |
| `apps/web/src/components/player/RadioStage.tsx` | Station label, transport layout, status |
| `apps/web/src/components/player/Transport.tsx` | Play/pause semantics and visual-state props |
| `apps/web/src/components/player/CircularVolume.tsx` | Pointer-angle math, range input, Mute |
| `apps/web/src/components/player/PlaybackStatus.tsx` | Real status text, spinner, errors |
| `apps/web/src/components/session/SessionDock.tsx` | Three bottom actions |
| `apps/web/src/components/session/SessionSheet.tsx` | Accessible sheet and active section |
| `apps/web/src/components/session/StationList.tsx` | Compact seven-station selector |
| `apps/web/src/components/session/SoundParameters.tsx` | Existing parameter sliders and reset |
| `apps/web/src/features/scene/RadioSceneCanvas.tsx` | Lazy loading, lifecycle, controller updates |
| `apps/web/src/features/scene/radioScene.ts` | Pixi Application, View3D, render loop, disposal |
| `apps/web/src/features/scene/transportScene.ts` | Orb and volume-orbit meshes/alignment |
| `apps/web/src/features/scene/environmentScene.ts` | Tunnel, ribbons, dust, audio response |
| `apps/web/src/features/scene/visualProfiles.ts` | Existing profiles, adapted only as needed |

Names may be adjusted to fit repository conventions, but maintain these boundaries. Do not put mesh construction, pointer math, playback status, and sheets into one large component.

### Scene controller API

Adapt the current controller rather than recreating the scene on every React render:

```ts
interface RadioSceneController {
  setStation(stationId: StationId): void
  setPlayback(status: PlaybackStatus): void
  setVolume(volume: number, muted: boolean): void
  setTransportState(state: 'idle' | 'hover' | 'pressed' | 'busy'): void
  setTransportRect(rect: DOMRectReadOnly): void
  setReducedMotion(reducedMotion: boolean): void
  renderOnce(): void
  dispose(): void
}
```

React props should flow through refs/latest-state patterns so initialization and updates do not race. Dynamic import cancellation and StrictMode cleanup must remain correct.

---

## 9. Migration plan

### Phase 1 — Replace the product shell

1. Add the new full-height shell, station identity, status region, and bottom dock.
2. Introduce the accessible session sheet with Stations, Mood, and Sound modes.
3. Reuse `MoodSelector`, parameter specs, `selectStation`, and `resetStation` logic.
4. Remove `NowPlaying`’s artwork, episode clock, transmission card, tagline, badges, and separate volume row from the rendered tree.
5. Remove `StationDiscovery` from the home page. It may be deleted after its useful list behavior is moved.
6. Remove previous/next and favorite controls from the main transport. Keep store actions if other code uses them; deleting store functionality is unnecessary.
7. Keep Settings available in the header, but remove its duplicate Master volume slider if the circular control is now the single primary volume surface. Keep reduced motion, visuals, default station, and reset preferences.

### Phase 2 — Install and isolate PixiJS 3D

1. In `apps/web`, add compatible current versions of `pixi.js` and `@pixi/3d`.
2. Remove `three` and `@types/three` only after the old scene is no longer imported.
3. Implement `RadioSceneCanvas` by adapting the current lazy-loading, enabled/disabled, context-loss, and cleanup behavior.
4. Initialize Pixi asynchronously, append its canvas to the full-screen host, create one `View3D`, and handle resize.
5. Preserve the existing `data-testid="signal-space"` if minimizing test churn; otherwise rename it consistently in all tests.
6. Ensure the scene chunk is lazy and includes `pixi`/`3d` naming that tests can detect.

### Phase 3 — Build the static visual composition

1. Implement the CSS fallback background and central scrim.
2. Implement the environment tunnel with static geometry.
3. Implement the 3D orb and volume orbit.
4. Add semantic HTML hit targets and verify projection alignment at common viewport sizes.
5. Connect station profile colors and real volume values.
6. Confirm the UI is fully usable before adding motion or effects.

### Phase 4 — Connect interaction and playback states

1. Wire Play/Pause/Try again to `togglePlay` and real status.
2. Add the initializing explanation and double-start prevention.
3. Implement circular pointer math and keyboard range behavior.
4. Connect mute and active ring segments.
5. Add hover, pressed, focus, and disabled visual states.
6. Verify station/mood/sound controls update without reconstructing the Pixi application.

### Phase 5 — Motion, performance, and polish

1. Port analyser band sampling and damped responses.
2. Add subtle pointer parallax and transport aura.
3. Add continuous ambient rendering while paused, document visibility handling, and static reduced-motion rendering.
4. Port software-rasterizer detection and compact quality tiers.
5. Add bloom only if the performance budget and contrast remain good.
6. Dispose every geometry, material, texture, observer, listener, ticker callback, and renderer resource.

### Phase 6 — Update documentation and tests

1. Update `docs/design-system.md`: rounded transport language, station-driven active signal color, PixiJS 3D environment, circular volume, sheets, and new fallback behavior.
2. Update architecture references that currently describe Three.js or the station-discovery home page.
3. Update unit and E2E tests listed below.
4. Run the complete repository checks, not only web tests.

---

## 10. Lifecycle and performance requirements

Carry forward the good behavior in `signalScene.ts`:

- Dynamic-import the scene only when visuals are enabled.
- Never create a second canvas after station, mood, volume, or playback changes.
- Stop the active loop when the document is hidden.
- On pause, keep rendering: the ambient drift continues and the audio-reactive bands settle to zero. Stop the loop only when the document is hidden.
- Reduced motion renders static frames on station/volume/status changes, with no continuous ticker.
- Disabling visuals destroys the scene and removes the canvas while playback continues.
- WebGL context loss falls back to the CSS environment while all controls remain usable.
- Cap pixel ratio: approximately 1.5 on capable desktop, 1.0–1.15 compact, and lower for software rendering.
- Use fewer rings/particles and no bloom on compact devices.
- Adapt render cadence if measured render cost becomes high.
- Preallocate particle/ribbon buffers; do not allocate arrays or colors in every frame.
- Batch repeated volume ticks and dust where practical.
- Avoid React state updates on every animation frame.

Target: responsive controls and clean audio scheduling take priority over visual frame rate.

---

## 11. Accessibility and responsive acceptance criteria

### Accessibility

- One H1 with the active station name.
- One primary Play/Pause button with correct changing accessible name.
- Volume exposed as a native keyboard-operable range named `Volume`.
- Separate Mute/Unmute button.
- Every bottom action has visible text and an accessible expanded state.
- Sheets trap focus, close on Escape, and return focus to their trigger.
- Status changes are politely announced; errors are assertive.
- Focus indicators are visible against the 3D background.
- Text contrast remains readable at every station palette and during bloom/audio peaks.
- Touch targets are at least 44 × 44 px.
- Reduced motion is honored from the OS initial preference.

### Viewports to verify

At minimum:

- 320 × 568
- 390 × 844
- 844 × 390 landscape
- 768 × 1024
- 1280 × 720
- 1440 × 900
- 1920 × 1080

No overlap among station label, orb, volume arc, status, and bottom dock. No horizontal scrolling. No clipped focus outlines. The primary controls work at 200% browser zoom.

---

## 12. Test plan

### Unit/component tests

Update `apps/web/tests/app-flow.test.tsx` and related tests:

- Initial render shows brand, active station H1, Play, Volume, Mute, Stations, Mood, Sound, and Settings.
- Initial render contains no track title, artist, “Now transmitting,” “Up next,” inspiration copy, episode progress, artwork, or Stations discovery grid.
- Play initializes and plays the selected station; Pause pauses it.
- Initializing shows the explicit first-transmission delay explanation, sets `aria-busy`, and prevents duplicate play calls.
- Error shows an alert and Try again action.
- Circular volume calls `setMasterVolume` with normalized values.
- Range keyboard interaction updates volume; mute toggles engine mute and accessible label.
- Stations sheet lists all seven stations; selecting After Hours updates the H1 and engine station.
- Mood sheet changes mood parameters.
- Sound sheet changes all four station parameters and resets them.
- Escape closes a sheet and returns focus.
- Settings still updates reduced motion, visuals, and default station.

Add focused tests for angle-to-volume conversion:

- Both arc endpoints map to 0 and 100.
- Top of arc maps to 50 for the chosen symmetric 300° sweep.
- Values clamp outside the arc.
- Pointer input in the 60° gap does not jump volume.
- Muted display is zero while unmuting restores the stored level.

Update scene tests:

- Lazy load only when enabled.
- Pending async initialization is cancelled safely on unmount.
- Station, playback, volume, and reduced-motion updates call controller methods without reconstruction.
- Context loss disposes the scene and leaves CSS fallback/UI available.
- Reduced-motion changes trigger static rendering.
- Disabling visuals releases the canvas.

### Playwright tests

Revise `smoke.spec.ts` and `scene.spec.ts`:

1. Load the focused screen and confirm exactly one primary Play button and all three session actions.
2. Start playback, observe initializing/playing states, pause, and resume.
3. Change volume through the semantic range and verify persistence after reload.
4. Open Stations, select each station, and confirm the H1 and active row update.
5. Confirm the same canvas element survives all station changes.
6. Change mood and sound parameters live.
7. Toggle reduced motion and verify one static canvas remains.
8. Disable visuals and verify the canvas and lazy scene are gone while playback continues.
9. Capture desktop and mobile screenshots for visual review.
10. Fail on browser page errors.

Do not preserve old tests solely by adding invisible legacy UI. Update tests to the intended new product behavior.

### Commands

Run from the repository root:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm --filter @infinite-radio/web e2e
```

Also run a production build and inspect the generated chunks to confirm Three.js is absent and PixiJS 3D remains lazy.

---

## 13. Definition of done

The redesign is complete only when all of the following are true:

- The home screen is a single focused radio experience, not an editorial now-playing page.
- The central control is a visibly rounded 3D orb with only Play/Pause as its primary action.
- Volume is visually arranged around that orb and works with pointer and keyboard input.
- Mute is integrated into the ring composition.
- Stations, Mood, and Sound are available from three bottom buttons and accessible sheets.
- The PixiJS 3D background has convincing depth, station identity, and restrained audio reactivity.
- No song inspiration, track metadata, up-next content, or episode progress appears.
- First-start waiting is clearly communicated using real playback state.
- Station changes do not recreate the renderer or canvas.
- Reduced motion, visuals disabled, pause settling, tab visibility, context loss, and low-end fallback all work.
- The interface remains usable if Pixi fails to initialize.
- All tests, type checks, lint, build, and relevant E2E tests pass.
- Documentation no longer describes the removed Three.js/discovery-grid interface as current.

---

## 14. Implementation cautions

- Do not run both Three.js and PixiJS 3D in the finished app.
- Do not make the canvas the only accessibility tree; semantic HTML controls are required.
- Do not attach pointer events to the full-screen canvas and accidentally block sheets or bottom controls.
- Do not recreate Pixi materials/geometries on every volume tick or React render.
- Do not clear `view.root`; the camera belongs there.
- Do not add automatic audio playback on page load.
- Do not hide startup latency behind an indefinite generic spinner alone.
- Do not let bloom or station colors compromise text contrast.
- Do not preserve the old artwork/discovery interface below the fold; remove it from the experience entirely.
