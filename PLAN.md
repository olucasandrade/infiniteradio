# Infinite Radio: Complete Product Implementation Plan

## Kimi `/goal` execution specification

**Objective:** Build the first complete, usable version of Infinite Radio in a monorepo.

**Product:** A browser-based generative radio experience. Users select atmospheric music stations and listen to continuously evolving music. Each station has its own musical identity, sound palette, composition rules, and visual atmosphere.

**Primary principle:** Build a real listening product, not a music-player mockup. Every visible control must work. Every station must generate distinguishable audio. The application must be usable without an account or backend.

---

# 1. Instructions for Kimi

Treat this document as the source of truth for the project.

Execute the implementation sequentially, following the phases in this document.

### Execution rules

1. Inspect the existing repository before making changes.
2. Preserve useful existing code and configuration.
3. Create an implementation checklist from all phases and subtasks.
4. Work on one phase at a time.
5. Do not mark a task complete until its acceptance criteria pass.
6. Run relevant tests after each implementation phase.
7. Run the complete test suite before considering the product finished.
8. Do not replace real functionality with placeholders, static mock data, or fake interactions.
9. Do not introduce a backend, authentication, external music-generation API, or paid service in the MVP.
10. Keep the architecture modular, but avoid unnecessary abstractions.
11. Prefer native browser APIs when they are sufficient.
12. Do not introduce dependencies without a concrete reason.
13. Keep the application responsive and accessible.
14. Document architectural decisions and non-obvious audio-engine behavior.
15. If an implementation decision is ambiguous, prefer the simplest solution that satisfies the product requirements.

### Current expansion directive

The three-station MVP described in Sections 2 through 20 is the existing foundation. The current implementation task is the post-MVP expansion in Section 21: seven focus stations, richer reference-driven generation, and an immersive Three.js scene. Preserve working MVP behavior and architecture while implementing Section 21 sequentially. Where earlier MVP-only limits conflict with Section 21, Section 21 takes precedence for this expansion.

### Completion requirements

The `/goal` is complete only when:

- All three stations generate audio.
- Audio plays continuously and evolves over time.
- Station switching works without abrupt audio interruption.
- All player controls work.
- Station customization changes actual audio behavior.
- The interface is complete and responsive.
- The logo and design system are implemented.
- The application works without an account.
- Preferences persist locally.
- Automated tests pass.
- A production build succeeds.
- The README explains installation, architecture, development, and deployment.

Do not consider a visually complete application with placeholder audio to be a completed product.

---

# 2. Product definition

## 2.1 Product positioning

**Infinite Radio**

Tagline:

> Stay in the moment. Let the music evolve.

Infinite Radio is a collection of generative musical environments presented as radio stations.

Users do not browse songs or build playlists. They choose an environment and let it evolve.

The experience should feel like opening a radio station that is always available, atmospheric, and musically coherent.

## 2.2 Product principles

### Stations, not playlists

Each station is a persistent musical identity with its own instruments, composition rules, moods, and sound palette.

### Music that evolves

The application generates music continuously. It should not sound like randomly generated notes or a repetitive loop.

### An experience, not a dashboard

The interface should prioritize listening, artwork, atmosphere, and a small number of meaningful controls.

### Music first

The audio engine is the core product. The interface exists to make listening enjoyable and accessible.

## 2.3 MVP stations

Implement exactly three stations.

| Station     | Musical identity                              | Main engineering challenge           |
| ----------- | --------------------------------------------- | ------------------------------------ |
| Weightless  | Ambient, drone, atmospheric textures          | Evolving synthesis and sound design  |
| Blue Notes  | Jazz-inspired, neo-soul, mellow fusion        | Harmony, voicings, melodic variation |
| After Hours | Downtempo, deep electronic, atmospheric house | Sequencing, rhythm, arrangement      |

Do not implement the remaining roadmap stations in the MVP.

## 2.4 Station specifications

### Weightless

**Description:** A quiet space for drifting, thinking, and disconnecting.

Musical characteristics:

- Ambient and atmospheric.
- No mandatory fixed BPM.
- Slowly evolving harmonic layers.
- Long sustained textures.
- Sparse melodic events.
- Soft transitions.
- Spatial effects and long reverbs.

Initial sound palette:

- Synthesized pads.
- Soft drones.
- Bell-like tones.
- Subtle noise textures.
- Slow evolving harmonics.

Mood variations:

- Floating
- Vast
- Meditative

Customization parameters:

- Texture density.
- Harmonic movement.
- Spatial depth.
- Evolution speed.

### Blue Notes

**Description:** Warm harmonies, intimate melodies, and understated improvisation.

Musical characteristics:

- Jazz-inspired harmony.
- Neo-soul influence.
- Mellow fusion.
- Controlled melodic variation.
- Electric piano and bass emphasis.
- Moderate rhythmic activity.
- Occasional swing.

Initial sound palette:

- Electric piano.
- Synthesized upright-style bass.
- Soft percussion.
- Bell-like melodic instruments.
- Atmospheric background layers.

Mood variations:

- Intimate
- Smoky
- Playful

Customization parameters:

- Harmonic complexity.
- Swing intensity.
- Melodic activity.
- Rhythmic density.

Important: This station must use coherent chord progressions, controlled voice leading, and musically constrained melodic generation. Avoid unrestricted random note generation.

### After Hours

**Description:** A place for late nights, deep focus, and uninterrupted movement.

Musical characteristics:

- Downtempo electronic.
- Deep atmospheric house.
- Minimal techno influences.
- Repeating rhythmic motifs.
- Gradually evolving synthesizers.
- Deep bass.
- Restrained percussion.

Initial sound palette:

- Kick.
- Closed hi-hat.
- Soft percussion.
- Synthesized bass.
- Atmospheric pads.
- Arpeggiated synthesizers.
- Minimal melodic sequences.

Mood variations:

- Deep
- Hypnotic
- Minimal

Customization parameters:

- Bass intensity.
- Percussion intensity.
- Atmospheric texture.
- Melodic complexity.

### 2.5 Transmissions: the rotating reference catalog

Every station carries a curated library of real, existing recordings
(title, artist, year plus character traits: key, mode, energy). Time is
divided into fixed episode windows; each window, the station's current
reference track steers the generator through an `EpisodeConstraint`
(tonic pitch class, scale, energy, brightness, movement, and a derived
seed). The rotation is deterministic and infinite in both directions:
any window index resolves to a stable episode, the sequence varies with
wall-clock time, and two listeners on the same station in the same
window hear the same music.

The UI names the current reference track ("Now transmitting") with a
countdown and an up-next preview.

Important: the catalog stores metadata and derived musical traits only.
The recordings themselves are never played, streamed, or reproduced;
the engine composes original music inspired by their character. This
keeps the feature outside the "external music catalogs" exclusion,
which targets audio catalogs.

---

# 3. Monorepo architecture

Use a `pnpm` workspace monorepo.

## 3.1 Technology stack

| Area             | Technology                   |
| ---------------- | ---------------------------- |
| Monorepo         | pnpm workspaces              |
| Frontend         | React                        |
| Language         | TypeScript                   |
| Bundler          | Vite                         |
| Styling          | Tailwind CSS + CSS variables |
| Audio            | Native Web Audio API         |
| Real-time DSP    | AudioWorklet when necessary  |
| State management | Zustand or React state       |
| Unit tests       | Vitest                       |
| Component tests  | React Testing Library        |
| Browser tests    | Playwright                   |
| Linting          | ESLint                       |
| Formatting       | Prettier                     |
| Hosting          | Cloudflare Pages             |

Avoid Tone.js in the initial implementation. The purpose of the project includes learning audio engineering and DSP fundamentals.

Use native Web Audio API for scheduling, oscillators, filters, gain stages, effects, and mixing.

## 3.2 Repository structure

Create the following structure:

```text
infinite-radio/
├── apps/
│   └── web/
│       ├── public/
│       │   ├── favicon.svg
│       │   ├── logo.svg
│       │   └── stations/
│       │       ├── weightless/
│       │       ├── blue-notes/
│       │       └── after-hours/
│       ├── src/
│       │   ├── app/
│       │   │   ├── App.tsx
│       │   │   ├── router.tsx
│       │   │   └── providers/
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   ├── navigation/
│       │   │   ├── player/
│       │   │   ├── station/
│       │   │   ├── customization/
│       │   │   ├── visualizer/
│       │   │   └── ui/
│       │   ├── features/
│       │   │   ├── discovery/
│       │   │   ├── listening/
│       │   │   ├── favorites/
│       │   │   └── settings/
│       │   ├── hooks/
│       │   ├── stores/
│       │   ├── styles/
│       │   │   ├── globals.css
│       │   │   ├── tokens.css
│       │   │   └── animations.css
│       │   ├── assets/
│       │   ├── utils/
│       │   └── main.tsx
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   ├── audio-engine/
│   │   ├── src/
│   │   │   ├── core/
│   │   │   ├── graph/
│   │   │   ├── instruments/
│   │   │   ├── effects/
│   │   │   ├── scheduling/
│   │   │   ├── transport/
│   │   │   ├── mixing/
│   │   │   ├── visualization/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── composition-engine/
│   │   ├── src/
│   │   │   ├── theory/
│   │   │   ├── harmony/
│   │   │   ├── rhythm/
│   │   │   ├── melody/
│   │   │   ├── arrangement/
│   │   │   ├── variation/
│   │   │   ├── generation/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── stations/
│   │   ├── src/
│   │   │   ├── definitions/
│   │   │   │   ├── weightless.ts
│   │   │   │   ├── blue-notes.ts
│   │   │   │   └── after-hours.ts
│   │   │   ├── moods/
│   │   │   ├── palettes/
│   │   │   ├── presets/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── design-system/
│   │   ├── src/
│   │   │   ├── tokens/
│   │   │   ├── primitives/
│   │   │   ├── components/
│   │   │   ├── icons/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   ├── constants/
│       │   ├── validation/
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── audio-engine.md
│   ├── composition-engine.md
│   ├── station-system.md
│   └── design-system.md
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.js
├── .prettierrc
├── .gitignore
└── README.md
```

Keep package boundaries meaningful. Do not create packages that only re-export one file or introduce unnecessary indirection.

## 3.3 Dependency rules

```text
apps/web
  ├── packages/design-system
  ├── packages/audio-engine
  ├── packages/composition-engine
  ├── packages/stations
  └── packages/shared

packages/stations
  ├── packages/composition-engine
  └── packages/shared

packages/composition-engine
  └── packages/shared

packages/audio-engine
  └── packages/shared

packages/design-system
  └── packages/shared
```

The composition engine must not depend on the audio engine.

The audio engine must not depend on React.

The station definitions must not contain browser-specific rendering code.

The UI must not directly generate musical notes or schedule low-level audio events.

---

# 4. Brand identity and logo

The brand must feel like a digital radio environment, not a generic SaaS product.

## 4.1 Brand personality

- Atmospheric.
- Minimal.
- Contemporary.
- Warm.
- Slightly nostalgic.
- Artistic.
- Calm without being sterile.
- Technically sophisticated without looking technical.

Avoid:

- Generic equalizer logos.
- Music note icons.
- Headphone illustrations.
- Excessive gradients.
- Neon gaming aesthetics.
- Generic AI product branding.

## 4.2 Logo concept

Create an original vector logo.

The primary symbol should represent an abstract radio signal or sound wave expanding through space.

Suggested direction:

- A central point or small circle.
- Two or three incomplete concentric arcs.
- Subtle asymmetry to make the mark recognizable.
- Simple geometry that works at favicon size.
- Wordmark using a refined serif or editorial typeface.

The mark should evoke a signal being transmitted through an infinite space.

The logo must be original and must not reproduce an existing brand mark.

## 4.3 Logo variants

Create:

1. Primary horizontal logo.
2. Symbol-only logo.
3. Light logo.
4. Dark logo.
5. Monochrome logo.
6. Favicon.

Required files:

```text
public/logo.svg
public/favicon.svg
```

The primary logo should combine the symbol with the text `infinite radio`.

Use lowercase typography.

The symbol must remain legible at 16px, 24px, and 48px.

Implement the logo as SVG, not as a raster image.

## 4.4 Typography

Use:

- Space Grotesk for editorial headings, station titles, and interface text.
- JetBrains Mono for metadata, labels, numbers, and status readouts.

Use locally hosted or appropriately loaded font assets. Avoid relying on external font services at runtime if local assets are practical.

Define a consistent typographic scale:

| Token      | Size | Usage                  |
| ---------- | ---: | ---------------------- |
| Display    | 64px | Main editorial heading |
| H1         | 48px | Page title             |
| H2         | 28px | Section title          |
| H3         | 18px | Station title          |
| Body large | 16px | Main descriptions      |
| Body       | 15px | Standard text          |
| Small      | 13px | Metadata               |
| Micro      | 11px | Fine labels            |

Use fluid scaling for smaller screens.

---

# 5. Design system

Create a reusable design system before implementing the complete application interface.

## 5.1 Color tokens

Use the following initial palette:

```css
:root {
  --color-background: #090b10;
  --color-surface: #0e1118;
  --color-surface-elevated: #151a23;
  --color-text-primary: #e6ecf4;
  --color-text-secondary: #98a2b3;
  --color-text-muted: #5d6774;
  --color-accent: #22d3ee;
  --color-accent-hover: #67e8f9;
  --color-success: #4ade80;
  --color-danger: #f87171;
  --color-border: #1d232e;
  --color-overlay: rgba(3, 5, 9, 0.6);
}
```

Station-specific accents (identify stations only; interactive elements always use the shared accent):

| Station     | Accent      |
| ----------- | ----------- |
| Weightless  | Light blue  |
| Blue Notes  | Warm amber  |
| After Hours | Soft violet |

## 5.2 Spacing

Use a consistent spacing scale based on 4px:

```text
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-5: 20px
space-6: 24px
space-8: 32px
space-10: 40px
space-12: 48px
space-16: 64px
space-20: 80px
```

## 5.3 Radius

```text
radius-sm: 6px
radius-md: 10px
radius-lg: 16px
radius-xl: 24px
radius-full: 9999px
```

Use rounded corners sparingly. Avoid making every element look like a card.

## 5.4 Shadows and depth

Use subtle shadows only where necessary.

The interface should rely primarily on:

- Background contrast.
- Border contrast.
- Layering.
- Negative space.
- Artwork.
- Typography.

Avoid excessive glassmorphism.

## 5.5 Motion

Define motion tokens:

```text
duration-fast: 150ms
duration-normal: 250ms
duration-slow: 500ms
duration-atmospheric: 1200ms
```

Motion should be slow, subtle, and intentional.

Support `prefers-reduced-motion`.

Never make animations essential for understanding the interface.

## 5.6 Component primitives

Implement the following design-system primitives:

- Button
- IconButton
- Text
- Heading
- Label
- Badge
- Tooltip
- Slider
- Toggle
- Separator
- Surface
- Card
- Modal
- Popover
- Skeleton
- VisuallyHidden
- Spinner

Every primitive should support appropriate states:

- Default.
- Hover.
- Focus.
- Active.
- Disabled.

Use semantic HTML and accessible labels.

## 5.7 Button variants

Implement:

- Primary.
- Secondary.
- Ghost.
- Destructive.
- Icon-only.

Button sizes:

- Small.
- Medium.
- Large.

The primary button should use the accent color without dominating the interface.

## 5.8 Slider

The slider is important because it will control audio-generation parameters.

Requirements:

- Keyboard accessible.
- Clearly visible current value.
- Configurable min/max/step.
- Accessible label.
- Smooth value updates.
- No excessive UI updates during audio processing.

## 5.9 Icons

Use Lucide icons.

Use a consistent stroke width and size system.

Required icons:

- Play.
- Pause.
- Volume.
- Volume muted.
- Heart.
- Settings.
- Chevron down.
- Chevron left.
- Chevron right.
- Shuffle or randomize, only if used.
- Close.
- Radio.
- Headphones.
- Sliders.
- Info.

Do not introduce icons without a functional purpose.

---

# 6. Application experience and interface

The MVP should have two primary experiences:

1. Station discovery.
2. Now playing.

Customization should be accessible from the player, not a separate complex dashboard.

## 6.1 Application layout

Desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  LOGO                                     SETTINGS           │
│                                                             │
│                                                             │
│                      NOW PLAYING                             │
│                                                             │
│                  [ STATION ARTWORK ]                         │
│                                                             │
│                     AFTER HOURS                              │
│                Deep electronic atmosphere                    │
│                                                             │
│                  [ Mood: Hypnotic ]                          │
│                                                             │
│                 ─── Visualizer ───                           │
│                                                             │
│              [ Previous ] [ Pause ] [ Next ]                 │
│                                                             │
│                     Volume control                           │
│                                                             │
│                 Customize this station                       │
│                                                             │
│                                                             │
│  STATIONS                                                    │
│  [ Weightless ] [ Blue Notes ] [ After Hours ]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

This is a conceptual layout. Refine the final visual hierarchy during implementation.

## 6.2 Header

Components:

- Logo.
- Logo wordmark.
- Settings button.

Behavior:

- Logo navigates to station discovery.
- Settings opens the settings popover or modal.
- Header remains visually unobtrusive.

## 6.3 Station discovery

Create a station selection section with three large station cards.

Each card must contain:

- Artwork.
- Station name.
- Short description.
- Musical category.
- Play action.
- Current playing indicator when applicable.

Cards:

1. Weightless.
2. Blue Notes.
3. After Hours.

Interaction:

- Clicking a card selects the station.
- Clicking its play action selects and starts playback.
- The currently selected station has a clear active state.
- Switching stations updates the artwork, title, description, mood, and audio configuration.

Do not add search, filtering, recommendation algorithms, or complex navigation.

## 6.4 Now playing section

This is the primary application screen.

Components:

- Station artwork.
- Station title.
- Station description.
- Station category.
- Current mood.
- Playback status.
- Visualizer.
- Playback controls.
- Volume control.
- Favorite button.
- Customization trigger.

The current station should have a strong visual identity.

## 6.5 Artwork

Create original artwork for all three stations.

The artwork should be visually distinct:

**Weightless**

- Atmospheric open space.
- Soft gradients.
- Abstract clouds, fog, or floating forms.
- Muted blue and grey tones.

**Blue Notes**

- Warm interior atmosphere.
- Abstract jazz-club references.
- Deep amber and brown tones.
- Soft light and shadows.

**After Hours**

- Nighttime city atmosphere.
- Abstract architectural lights.
- Dark violet and blue tones.
- Minimal electronic visual language.

Avoid literal album-cover imitation or copyrighted characters.

Artwork can be static with subtle CSS animation.

Do not generate artwork dynamically during playback.

## 6.6 Player controls

Implement:

- Play.
- Pause.
- Volume.
- Mute.
- Previous station.
- Next station.
- Favorite.
- Customize.

Behavior:

**Play**

Starts the AudioContext if necessary and begins generating the current station.

**Pause**

Pauses the audio output without destroying the current station state.

**Volume**

Controls the master gain node.

**Mute**

Temporarily sets output gain to zero while preserving the previous volume.

**Previous and next**

Switch between the three stations.

**Favorite**

Toggles the station's favorite state.

**Customize**

Opens the station customization interface.

Every control must be connected to real application state and, where applicable, to the audio engine.

## 6.7 Customization panel

Create a compact panel, preferably a side panel on desktop and a bottom sheet on mobile.

It should contain station-specific controls.

Weightless:

- Texture density.
- Harmonic movement.
- Spatial depth.
- Evolution speed.

Blue Notes:

- Harmonic complexity.
- Swing intensity.
- Melodic activity.
- Rhythmic density.

After Hours:

- Bass intensity.
- Percussion intensity.
- Atmospheric texture.
- Melodic complexity.

Each control must:

1. Display its current value.
2. Update the station configuration.
3. Affect the composition or sound rendering.
4. Update without interrupting playback.
5. Persist locally when appropriate.

Do not implement generic controls that have no real effect.

## 6.8 Mood selector

Display three moods per station.

Mood changes should modify generation parameters while preserving the station identity.

Examples:

Weightless:

- Floating.
- Vast.
- Meditative.

Blue Notes:

- Intimate.
- Smoky.
- Playful.

After Hours:

- Deep.
- Hypnotic.
- Minimal.

Mood selection should not restart the station abruptly.

## 6.9 Settings

Settings should remain minimal.

Include:

- Master volume.
- Default station.
- Reduced motion.
- Visualizer enabled/disabled.
- Reset preferences.

Do not introduce accounts, cloud synchronization, or profile management.

## 6.10 Visualizer

Implement a lightweight visualizer using the Web Audio API's AnalyserNode.

Possible visualization styles:

- Minimal waveform.
- Frequency bars.
- Soft reactive particles.

Choose one primary visualizer for the MVP.

The visualizer must:

- Reflect actual audio output.
- Stop its animation loop when not needed.
- Respect reduced-motion settings.
- Avoid unnecessary CPU consumption.
- Work without blocking audio playback.

---

# 7. Audio-engine architecture

This is the most important technical part of the product.

The audio engine must be independent from React.

## 7.1 Architecture

```text
Station Definition
       |
       v
Composition Engine
       |
       v
Musical Event Stream
       |
       v
Audio Scheduler
       |
       v
Instrument Voices
       |
       v
Effects and Mixing
       |
       v
Master Output
       |
       v
Browser Audio Output
```

The composition engine decides what should happen musically.

The audio engine decides how those musical events become sound.

The UI controls station configuration and playback state.

## 7.2 Core interfaces

Create strongly typed interfaces.

Example:

```ts
export interface MusicalEvent {
  id: string
  type: 'note' | 'drum' | 'control'
  instrument: string
  startTime: number
  duration: number
  pitch?: number
  velocity?: number
  parameters?: Record<string, number>
}

export interface MusicalSection {
  id: string
  startBar: number
  bars: number
  events: MusicalEvent[]
  energy: number
}

export interface StationMood {
  id: string
  name: string
  parameters: Record<string, number>
}

export interface StationDefinition {
  id: string
  name: string
  description: string
  category: string
  defaultMood: string
  moods: StationMood[]
  parameters: Record<string, number>
}
```

Adapt these types when necessary, but keep composition events independent from Web Audio API objects.

## 7.3 AudioEngine

Implement an `AudioEngine` class responsible for:

- Creating the AudioContext.
- Managing audio nodes.
- Managing the master output.
- Starting and stopping playback.
- Controlling master volume.
- Managing the audio scheduler.
- Managing station transitions.
- Cleaning up resources.

Suggested public API:

```ts
interface AudioEngine {
  initialize(): Promise<void>
  play(): Promise<void>
  pause(): void
  setMasterVolume(value: number): void
  setMuted(muted: boolean): void
  switchStation(stationId: string): Promise<void>
  updateParameters(parameters: Record<string, number>): void
  dispose(): void
}
```

Do not expose internal AudioNodes to React components.

## 7.4 Audio graph

Create a predictable audio graph:

```text
Instrument Sources
       |
       v
Instrument Gain
       |
       v
Instrument Processing
       |
       v
Station Bus
       |
       v
Station Effects
       |
       v
Master Bus
       |
       v
Analyser
       |
       v
Destination
```

Implement:

- Gain nodes.
- Oscillators.
- Filters.
- Panning where appropriate.
- Delay.
- Reverb.
- Compressor or limiter where appropriate.
- Analyser.

Avoid creating a new AudioContext for every station.

## 7.5 Instrument system

Create reusable instrument abstractions.

Initial instruments:

- SynthPad.
- SoftBass.
- SubBass.
- ElectricPiano.
- Bell.
- Pluck.
- Kick.
- Snare.
- HiHat.
- NoiseTexture.

Each instrument should define:

- Sound-generation behavior.
- Envelope.
- Frequency or pitch behavior.
- Gain.
- Relevant filter settings.
- Instrument-specific parameters.

Start with simple synthesis.

Do not attempt to simulate every acoustic instrument perfectly.

For the Blue Notes station, a convincing electric-piano-like sound is more valuable than an unnecessarily complex physical piano simulation.

## 7.6 Envelopes

Implement an ADSR envelope utility.

Parameters:

- Attack.
- Decay.
- Sustain.
- Release.

Use `AudioParam` scheduling methods instead of manually changing gain values from React.

Ensure that voices release cleanly and do not create clicks.

## 7.7 Effects

Implement reusable effects:

**Filter**

- Low-pass.
- High-pass.
- Band-pass.

**Delay**

- Delay time.
- Feedback.
- Wet/dry mix.

**Reverb**

- Use a generated impulse response or an appropriately licensed impulse response.
- Support wet/dry mix.
- Avoid creating expensive impulse responses repeatedly.

**Saturation**

- Optional waveshaping for warmth.

**Compressor**

- Control output peaks.

All effects must be configurable and reusable.

## 7.8 Audio scheduling

The scheduler must use lookahead scheduling.

Do not rely on `setTimeout` for precise musical timing.

Implement:

- Scheduling interval.
- Lookahead window.
- Event queue.
- Event cancellation.
- Transport position.
- Section boundaries.

Schedule events ahead of their playback time using the AudioContext clock.

The scheduler must tolerate normal JavaScript event-loop delays.

## 7.9 Continuous playback

Music must be generated in sections.

A section can contain a number of bars depending on the station.

Initial approach:

1. Generate a section.
2. Schedule its events.
3. Generate the next section before the current section finishes.
4. Introduce variations.
5. Add or remove layers.
6. Maintain harmonic and rhythmic continuity.
7. Transition naturally between sections.

The engine should always have enough scheduled material to avoid gaps.

Avoid generating the entire session upfront.

## 7.10 Station transitions

Switching stations should not abruptly stop the current audio.

Implement crossfading between station buses.

Expected behavior:

1. Prepare the next station's musical section.
2. Start the new station at a suitable musical boundary.
3. Gradually reduce the old station bus gain.
4. Gradually increase the new station bus gain.
5. Release old station voices.
6. Clean up old station resources.

The transition duration should be configurable.

The transition must avoid clicks and sudden volume spikes.

## 7.11 Audio lifecycle

Handle:

- Suspended AudioContext.
- User interaction requirements.
- Tab visibility changes.
- Browser interruptions.
- Device audio limitations.
- Cleanup on unmount.
- Errors during initialization.

The application must not promise uninterrupted background playback on mobile browsers.

Playback must begin after an explicit user action.

---

# 8. Composition engine

The composition engine is responsible for musical coherence.

It must not generate arbitrary random notes.

## 8.1 Musical theory utilities

Implement:

- MIDI note conversion.
- Frequency conversion.
- Scale definitions.
- Chord definitions.
- Chord inversions.
- Intervals.
- Key definitions.
- Tempo utilities.
- Bar and beat calculations.

Use standard MIDI note numbering.

Add unit tests for frequency conversion and interval calculations.

## 8.2 Harmony engine

Implement:

- Chord progression generation.
- Chord voicing.
- Inversions.
- Voice leading.
- Harmonic rhythm.
- Key constraints.

Start with predefined progression templates.

Introduce controlled variation only after the basic harmonic system is stable.

## 8.3 Rhythm engine

Implement:

- Beat grids.
- Subdivision.
- Swing.
- Euclidean rhythm generation where appropriate.
- Velocity variation.
- Probability-based event variation.

The rhythm engine should support both fixed BPM and flexible timing.

## 8.4 Melody engine

Implement constrained melodic generation.

Inputs:

- Current key.
- Current chord.
- Scale.
- Previous phrase.
- Melodic complexity.
- Phrase length.
- Station mood.

Rules:

- Prefer chord tones on strong beats.
- Use scale tones for passing movement.
- Limit excessive leaps.
- Use repetition and variation.
- Create recognizable phrases.
- Avoid random pitch sequences.

For Blue Notes, begin with short composed motifs and controlled transformations.

## 8.5 Arrangement engine

The arrangement engine determines when musical layers appear and disappear.

Implement arrangement states:

- Intro.
- Build.
- Main.
- Variation.
- Breakdown.
- Transition.

These should be musical states, not separate tracks.

Use energy and density parameters to control the arrangement.

## 8.6 Variation engine

Create variations through:

- Velocity changes.
- Timing changes.
- Octave changes.
- Melodic substitutions.
- Rhythm changes.
- Filter movement.
- Instrument density.
- Effects changes.

Variations must respect the station's musical identity.

Avoid changing every musical element simultaneously.

## 8.7 Deterministic generation

Use seeded random generation.

The same seed and configuration should produce reproducible composition output.

This is important for:

- Testing.
- Debugging.
- Reproducibility.
- Comparing station configurations.

The application may generate a new seed when starting a new listening session.

---

# 9. Station implementation

Each station should be a configuration of the shared composition and audio engines.

Do not create three independent audio engines.

## 9.1 Station definition

Each station should define:

- Identity.
- Default tempo or tempo range.
- Musical vocabulary.
- Instrument palette.
- Harmonic rules.
- Rhythmic rules.
- Arrangement behavior.
- Effects configuration.
- Mood presets.
- Customization parameter ranges.

## 9.2 Weightless implementation

Prioritize:

- Slowly evolving oscillators.
- Detuned pads.
- Long ADSR envelopes.
- Noise textures.
- Slow filter modulation.
- Sparse melodic events.
- Layered harmonic intervals.

Do not force conventional drums or a fixed tempo.

Its evolution should be slow enough that the user can listen for several minutes without feeling that the same short loop is repeating.

## 9.3 Blue Notes implementation

Prioritize:

- Chord progressions.
- Extended chord voicings.
- Seventh chords.
- Ninth chords.
- Eleventh and thirteenth colors where appropriate.
- Bass movement.
- Controlled swing.
- Melodic phrases.

Begin with a limited vocabulary of progressions and voicings.

Use a small number of high-quality musical patterns rather than excessive randomization.

## 9.4 After Hours implementation

Prioritize:

- Stable tempo.
- Kick patterns.
- Hi-hat subdivisions.
- Syncopated percussion.
- Repeating bass motifs.
- Arpeggiated synth patterns.
- Filter automation.
- Layer density evolution.

The station should maintain a consistent groove while evolving its arrangement.

## 9.5 Preset configuration

Create at least one default preset per station and three moods per station.

Store all presets as typed configuration.

Avoid hardcoding mood behavior inside UI components.

---

# 10. Application state and persistence

## 10.1 State domains

Separate state into:

**Player state**

- Is playing.
- Current station.
- Current mood.
- Master volume.
- Muted state.

**Station state**

- Current station parameters.
- Selected mood.
- Favorite status.

**Settings state**

- Reduced motion.
- Visualizer enabled.
- Default station.

**Audio state**

- AudioContext status.
- Initialization status.
- Playback errors.
- Transition status.

Audio state must not be confused with React rendering state.

## 10.2 Persistence

Use localStorage.

Persist:

- Favorite stations.
- Last selected station.
- Last selected mood.
- Station customization.
- Volume.
- Reduced motion.
- Visualizer preference.

Do not persist:

- AudioContext.
- AudioNodes.
- Scheduled events.
- Active oscillator instances.
- Temporary playback state.

Validate persisted data when loading it.

Handle invalid or outdated localStorage data safely.

## 10.3 State management

Use Zustand only if it materially simplifies cross-component state.

Keep audio-engine instances outside serializable UI state.

Do not store browser objects in the persistence layer.

---

# 11. Responsive design

The application must work on:

- Desktop.
- Laptop.
- Tablet.
- Mobile.

## 11.1 Desktop

- Spacious central listening area.
- Large station artwork.
- Compact controls.
- Station discovery below or alongside the main player.
- Customization in a side panel.

## 11.2 Tablet

- Smaller artwork.
- Reduced spacing.
- Station cards arranged in a compact grid.
- Customization panel adapts to available width.

## 11.3 Mobile

- Single-column layout.
- Artwork occupies a meaningful portion of the screen.
- Controls remain reachable.
- Station cards become horizontally scrollable or vertically stacked.
- Customization opens as a bottom sheet.
- Touch targets are at least 44px where practical.

Mobile background playback is not a guaranteed MVP requirement. Test mobile browser behavior and document limitations.

---

# 12. Accessibility and usability

Implement:

- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Accessible button labels.
- Accessible slider labels.
- Sufficient text contrast.
- Reduced-motion support.
- Screen-reader status announcements where appropriate.
- No color-only status indicators.

Playback controls must be understandable without relying on visual animations.

Do not autoplay audio on page load.

---

# 13. Error handling and loading states

Implement real application states.

Required states:

**Initial state**

No station selected or initialized.

**Ready state**

Station is selected and ready to play.

**Initializing state**

Audio engine is starting.

**Playing state**

Audio is active.

**Paused state**

Audio is paused.

**Transitioning state**

Station change is in progress.

**Error state**

Audio initialization or playback failed.

Provide a concise and useful message when the browser cannot initialize audio.

Never silently pretend audio is playing when the AudioContext is suspended or initialization has failed.

---

# 14. Testing strategy

## 14.1 Composition-engine tests

Test:

- MIDI-to-frequency conversion.
- Scale membership.
- Chord generation.
- Chord inversions.
- Voice leading.
- Beat calculations.
- Swing timing.
- Seed reproducibility.
- Event generation.
- Arrangement transitions.

## 14.2 Audio-engine tests

Use mocked Web Audio API objects where appropriate.

Test:

- Initialization.
- Play and pause.
- Master volume.
- Mute.
- Station switching.
- Parameter updates.
- Cleanup.
- Scheduler behavior.
- Event cancellation.

Do not rely only on mocked tests for audio quality.

## 14.3 Application tests

Test:

- Station selection.
- Playback controls.
- Volume.
- Mute.
- Mood selection.
- Customization.
- Favorites.
- Settings.
- Persistence.
- Responsive navigation.
- Error states.

## 14.4 Browser tests

Use Playwright.

Test at minimum:

- Chromium desktop.
- Chromium mobile viewport.
- WebKit where supported.

Verify:

- The app loads.
- The user can select a station.
- The user can start playback.
- The UI updates to playing state.
- The user can pause.
- The user can switch stations.
- The user can customize parameters.
- Preferences persist after reload.

Browser audio support and automation environments can vary. Separate browser API limitations from application defects in test reports.

## 14.5 Manual audio validation

The following checks require actual listening.

For each station:

- Listen for at least 10 minutes.
- Check that the music is musically coherent.
- Check that transitions do not click.
- Check that volume remains stable.
- Check that the station is distinguishable from the others.
- Check that customization produces audible changes.
- Check that the composition does not become monotonous too quickly.

Before final release, run a 30-minute continuous playback test.

---

# 15. Implementation phases

Kimi must execute these phases in order.

## Phase 0: Repository foundation

Tasks:

- Inspect the repository.
- Initialize pnpm workspace.
- Configure TypeScript.
- Configure Vite and React.
- Configure Tailwind.
- Configure ESLint and Prettier.
- Configure Vitest.
- Configure Playwright.
- Create workspace packages.
- Configure package aliases.
- Add basic scripts.
- Add initial README.

Acceptance criteria:

- All packages resolve correctly.
- The web app starts.
- TypeScript compilation succeeds.
- Linting succeeds.
- Tests can execute.
- Production build succeeds.

Do not proceed until this foundation works.

## Phase 1: Brand and design system

Tasks:

- Define CSS design tokens.
- Implement typography.
- Implement spacing and radius tokens.
- Implement motion tokens.
- Create the logo symbol.
- Create the wordmark.
- Create logo variants.
- Create favicon.
- Implement design-system primitives.
- Implement button variants.
- Implement icon buttons.
- Implement sliders.
- Implement toggles.
- Implement surfaces and cards.
- Implement modal and popover.
- Implement tooltips.
- Implement skeletons.
- Document design-system usage.

Acceptance criteria:

- Logo works at different sizes.
- Every primitive has accessible states.
- Tokens are centralized.
- Components are reusable.
- No duplicated ad hoc styling is introduced unnecessarily.

## Phase 2: Shared domain types

Tasks:

- Define station types.
- Define mood types.
- Define customization parameter types.
- Define musical event types.
- Define musical section types.
- Define instrument types.
- Define player state types.
- Define audio-engine interfaces.
- Define shared constants.
- Define validation utilities.

Acceptance criteria:

- All packages compile against shared types.
- No circular dependencies exist.
- Station definitions are independent of React.
- Composition events are independent of Web Audio API objects.

## Phase 3: Composition-engine fundamentals

Tasks:

- Implement seeded random generation.
- Implement MIDI utilities.
- Implement frequency conversion.
- Implement scales.
- Implement intervals.
- Implement chords.
- Implement chord inversions.
- Implement chord voicing.
- Implement tempo calculations.
- Implement bar and beat calculations.
- Implement rhythm grids.
- Implement velocity variation.
- Implement swing.
- Implement basic melodic generation.
- Implement event generation.

Acceptance criteria:

- Unit tests cover the theory utilities.
- Seeded generation is reproducible.
- Generated notes respect configured musical constraints.
- No station-specific code is required for generic theory utilities.

## Phase 4: Audio-engine fundamentals

Tasks:

- Implement AudioContext initialization.
- Implement audio graph.
- Implement master bus.
- Implement station bus.
- Implement instrument gain stages.
- Implement oscillator utilities.
- Implement ADSR envelopes.
- Implement filters.
- Implement panning.
- Implement delay.
- Implement reverb.
- Implement analyser.
- Implement master volume.
- Implement mute.
- Implement disposal and cleanup.

Acceptance criteria:

- A basic synthesized sound can be played.
- Multiple voices can play simultaneously.
- Audio does not produce avoidable clicks.
- Volume and mute work.
- Cleanup releases resources.
- AudioContext initialization respects browser interaction requirements.

## Phase 5: Scheduling and continuous playback

Tasks:

- Implement transport.
- Implement lookahead scheduler.
- Implement event queue.
- Implement scheduling cancellation.
- Implement musical section generation.
- Implement section boundaries.
- Implement event scheduling.
- Implement next-section preparation.
- Implement arrangement variation.
- Implement pause and resume behavior.

Acceptance criteria:

- Music plays continuously.
- Events are scheduled against the AudioContext clock.
- The scheduler maintains a sufficient lookahead window.
- Playback does not depend on manually clicking to generate each section.
- Pausing and resuming do not create unexpected overlapping voices.

## Phase 6: Instruments and sound palette

Tasks:

- Implement SynthPad.
- Implement SoftBass.
- Implement SubBass.
- Implement ElectricPiano.
- Implement Bell.
- Implement Pluck.
- Implement Kick.
- Implement Snare.
- Implement HiHat.
- Implement NoiseTexture.
- Add instrument envelopes.
- Add instrument-specific filters.
- Add appropriate effects routing.
- Validate sound levels.

Acceptance criteria:

- Instruments have distinguishable sound identities.
- Instrument parameters are configurable.
- Instruments can be combined without excessive clipping.
- Instrument instances are cleaned up correctly.

## Phase 7: Station implementation

Implement the stations in this order.

### 7A: Weightless

- Implement pad layers.
- Implement drone layers.
- Implement noise textures.
- Implement slow modulation.
- Implement harmonic evolution.
- Implement sparse melodic events.
- Implement three moods.
- Implement four customization parameters.

Acceptance criteria:

- The station generates coherent ambient music.
- It does not require a fixed rhythmic pulse.
- Its moods sound meaningfully different.

### 7B: After Hours

- Implement tempo configuration.
- Implement kick patterns.
- Implement hi-hat patterns.
- Implement percussion variation.
- Implement bass motifs.
- Implement synth patterns.
- Implement arrangement evolution.
- Implement three moods.
- Implement four customization parameters.

Acceptance criteria:

- The station maintains a coherent groove.
- It evolves without losing its rhythmic identity.
- Its moods sound meaningfully different.

### 7C: Blue Notes

- Implement chord progressions.
- Implement extended chord voicings.
- Implement bass movement.
- Implement electric-piano patterns.
- Implement swing.
- Implement constrained melodic phrases.
- Implement phrase variation.
- Implement three moods.
- Implement four customization parameters.

Acceptance criteria:

- Chords and melodies remain harmonically coherent.
- Rhythmic variation sounds intentional.
- The station has a recognizable musical identity.

## Phase 8: Station transitions and personalization

Tasks:

- Implement station bus crossfading.
- Implement musical transition preparation.
- Implement mood switching.
- Implement live parameter updates.
- Implement station-specific parameter mapping.
- Implement favorite state.
- Implement default station behavior.

Acceptance criteria:

- Station switching does not abruptly cut the current sound.
- Mood changes do not unnecessarily restart playback.
- Parameter changes affect the actual sound.
- Favorites and selected preferences persist.

## Phase 9: Application state and persistence

Tasks:

- Implement player store.
- Implement station store.
- Implement settings store.
- Implement audio lifecycle integration.
- Implement localStorage persistence.
- Implement persisted-data validation.
- Implement reset preferences.
- Implement error state handling.

Acceptance criteria:

- UI state is predictable.
- Audio objects are not serialized.
- Preferences survive reloads.
- Invalid persisted data does not crash the application.

## Phase 10: Application interface

Build the application in this order.

### 10A: Global shell

- Application background.
- Header.
- Logo.
- Settings trigger.
- Main content container.
- Responsive layout.

### 10B: Station discovery

- Discovery heading.
- Station grid.
- Station card.
- Station artwork.
- Station metadata.
- Play action.
- Active station state.

### 10C: Now playing

- Artwork.
- Station title.
- Description.
- Category.
- Mood indicator.
- Playback status.
- Visualizer.
- Player controls.
- Volume.
- Favorite action.

### 10D: Customization

- Customization trigger.
- Panel.
- Station-specific controls.
- Mood selector.
- Reset station customization.

### 10E: Settings

- Settings modal or popover.
- Master volume.
- Default station.
- Reduced motion.
- Visualizer preference.
- Reset preferences.

### 10F: Responsive behavior

- Desktop layout.
- Tablet layout.
- Mobile layout.
- Mobile station navigation.
- Mobile customization sheet.
- Touch interactions.

Acceptance criteria:

- Every visible control works.
- No placeholder interactions remain.
- Every station has the correct artwork and metadata.
- Layout works at common viewport sizes.
- The interface reflects real playback state.

## Phase 11: Visual refinement

Tasks:

- Refine visual hierarchy.
- Refine spacing.
- Refine typography.
- Refine artwork presentation.
- Refine station-specific accents.
- Add subtle atmospheric motion.
- Add player transition animations.
- Add hover and focus states.
- Add loading and error states.
- Check reduced-motion behavior.
- Check mobile layout.
- Check accessibility.

Acceptance criteria:

- The interface feels cohesive.
- The visual language is consistent.
- Motion is subtle.
- The player remains the main focus.
- No decorative effect harms usability or performance.

## Phase 12: Integration and quality assurance

Tasks:

- Run all unit tests.
- Run all component tests.
- Run all browser tests.
- Run linting.
- Run TypeScript checks.
- Run production build.
- Test all stations manually.
- Test continuous playback.
- Test station switching.
- Test customization.
- Test persistence.
- Test mobile behavior.
- Inspect browser console.
- Inspect memory and CPU behavior during playback.
- Fix all release-blocking issues.

Acceptance criteria:

- All automated tests pass.
- Production build succeeds.
- No known critical defects remain.
- All three stations produce distinguishable audio.
- Continuous playback works for 30 minutes in a supported desktop browser.

## Phase 13: Documentation and release

Tasks:

- Write installation instructions.
- Write development instructions.
- Document monorepo architecture.
- Document audio-engine architecture.
- Document composition-engine architecture.
- Document station configuration.
- Document customization parameters.
- Document known browser limitations.
- Add deployment instructions.
- Configure Cloudflare Pages deployment.
- Verify production deployment.

Acceptance criteria:

- A new developer can clone and run the project.
- The architecture is understandable.
- The application can be deployed without a backend.
- Production build and deployment succeed.

---

# 16. Performance requirements

The application must remain lightweight.

Priorities:

- Avoid unnecessary React renders.
- Keep audio scheduling independent of UI rendering.
- Avoid allocating large numbers of objects in audio-critical paths.
- Reuse audio nodes where appropriate.
- Clean up voices and scheduled events.
- Avoid creating multiple AudioContexts.
- Stop visualizer animation when inactive.
- Avoid expensive canvas or DOM animations.
- Avoid excessive reverb processing.
- Keep station assets optimized.

Do not optimize prematurely, but measure actual problems.

The audio engine should never rely on React render frequency for timing.

---

# 17. MVP feature checklist

The following is the final product checklist.

## Brand and design

- [ ] Original Infinite Radio logo.
- [ ] Symbol-only logo.
- [ ] Wordmark.
- [ ] Favicon.
- [ ] Logo variants.
- [ ] Color system.
- [ ] Typography system.
- [ ] Spacing system.
- [ ] Motion system.
- [ ] Design-system primitives.
- [ ] Responsive visual language.

## Stations

- [ ] Weightless.
- [ ] Blue Notes.
- [ ] After Hours.
- [ ] Three moods per station.
- [ ] Station artwork.
- [ ] Station-specific sound palettes.
- [ ] Station-specific composition rules.

## Audio

- [ ] AudioContext lifecycle.
- [ ] Audio graph.
- [ ] Instruments.
- [ ] Effects.
- [ ] ADSR envelopes.
- [ ] Composition engine.
- [ ] Rhythm engine.
- [ ] Harmony engine.
- [ ] Melody engine.
- [ ] Arrangement engine.
- [ ] Variation engine.
- [ ] Scheduler.
- [ ] Continuous playback.
- [ ] Crossfading.
- [ ] Master volume.
- [ ] Mute.
- [ ] Visualizer.

## User experience

- [ ] Station discovery.
- [ ] Now playing.
- [ ] Station switching.
- [ ] Play and pause.
- [ ] Volume.
- [ ] Mute.
- [ ] Mood selection.
- [ ] Customization.
- [ ] Favorites.
- [ ] Settings.
- [ ] Persistence.
- [ ] Error states.
- [ ] Responsive layout.
- [ ] Reduced motion.

## Engineering

- [ ] Monorepo.
- [ ] Shared types.
- [ ] Unit tests.
- [ ] Component tests.
- [ ] Browser tests.
- [ ] Linting.
- [ ] Type checking.
- [ ] Production build.
- [ ] Documentation.
- [ ] Deployment.

---

# 18. Explicitly out of scope

Do not implement these features during the MVP:

- User accounts.
- Authentication.
- Backend APIs.
- Database.
- Subscription plans.
- Payments.
- AI music generation.
- AI recommendations.
- Community features.
- Public user-created stations.
- Social sharing.
- Uploading music.
- Downloading generated tracks.
- Mobile native application.
- Advanced equalizer.
- Recording.
- DAW functionality.
- MIDI input.
- Complex 3D environments.
- Streaming infrastructure.
- External music catalogs.

These features can be considered after the first version is stable.

---

# 19. Final product definition

The first version is complete when a user can:

1. Open Infinite Radio.
2. Discover three distinct stations.
3. Select one.
4. Start listening.
5. Leave the application playing while working.
6. Hear music that continuously evolves.
7. Change the station without an abrupt interruption.
8. Change the station's mood.
9. Customize its sound.
10. Adjust volume and mute.
11. Favorite stations.
12. Return later and recover their preferences.

The experience should be simple enough that the user does not need to understand generative music or audio engineering to enjoy it.

The engineering underneath should be modular enough to support much more sophisticated musical systems later.

**The most important quality criterion: Infinite Radio must sound like a collection of carefully designed radio stations, not like a random music generator.**

---

# 20. Kimi final execution report

When all phases are complete, produce a final report containing:

1. Implemented features.
2. Repository structure.
3. Implemented stations and their generation methods.
4. Audio-engine architecture.
5. Design-system components.
6. Logo and brand assets.
7. Tests executed and their results.
8. Production build result.
9. Deployment instructions.
10. Known limitations.
11. Recommended next engineering improvements.

Do not claim that manual audio validation was completed unless actual listening tests were performed.

Do not claim mobile background playback is supported unless it has been verified on the relevant devices and browsers.

**Final success condition:** A complete, deployable, browser-based generative radio product with three distinct, continuously evolving stations and a cohesive visual identity.

---

# 21. Post-MVP expansion: Signal Space and focus stations

## 21.1 Objective

Expand the working MVP into a seven-station focus-listening product with an immersive, audio-reactive Three.js background. Add instrumental hip-hop, neo-soul, vaporwave, and indie stations, retain Weightless and After Hours, and refine Blue Notes toward a clearer jazz identity.

This expansion preserves the product's central model: familiar recordings act as references for original generative music. The application must not stream, sample, reproduce, or imply that it plays the referenced recordings.

Design read: an immersive listening app for people working, using the existing restrained dark-tech language and design system. The visual scene may be cinematic, but the interface remains calm and usable for long sessions.

Design dials:

- `DESIGN_VARIANCE: 6`.
- `MOTION_INTENSITY: 7`.
- `VISUAL_DENSITY: 4`.

## 21.2 Expansion principles

1. Genres are stations, not renamed moods. Each new genre needs real composition, instrumentation, arrangement, and effects behavior.
2. Reference recordings steer original generation. Do not add recorded audio, external streaming, or copied melodies.
3. The 3D scene reflects actual audio and application state. It must not be an unrelated decorative loop.
4. Preserve the shared engines. Do not create an independent audio engine for each station.
5. Keep continuous audio values, pointer motion, and frame updates outside React state.
6. Preserve existing station IDs and stored preferences, especially `blue-notes`.
7. Every new customization control must make an audible difference and update without abrupt playback interruption.
8. Reduced motion, disabled visuals, hidden tabs, and unavailable WebGL are first-class states.
9. Build one complete station vertical slice before reusing its integration pattern for the remaining stations.
10. Do not claim objective popularity rankings. Describe catalogs as curated focus references unless a maintained popularity source is introduced.

## 21.3 Station registry

The expanded registry contains these seven stations in discovery order:

| ID            | Working display name | Musical identity                                           | Status            |
| ------------- | -------------------- | ---------------------------------------------------------- | ----------------- |
| `weightless`  | Weightless           | Ambient, drone, atmospheric textures                       | Existing          |
| `hip-hop`     | Low End              | Instrumental hip-hop and laid-back beatmaking              | New               |
| `blue-notes`  | Blue Notes           | Jazz, mellow fusion, controlled improvisation              | Existing, refined |
| `neo-soul`    | Velvet               | Neo-soul harmony, syncopated bass, behind-the-beat groove  | New               |
| `vaporwave`   | Vapor Trails         | Vaporwave, stretched synthetic atmosphere, tape-like drift | New               |
| `indie`       | Open Window          | Instrumental indie, guitar-like plucks, restrained groove  | New               |
| `after-hours` | After Hours          | Downtempo and atmospheric electronic                       | Existing          |

The working display names may be refined before release, but IDs must remain stable once persisted. Do not rename the existing `blue-notes` ID when separating neo-soul into its own station.

## 21.4 New station musical specifications

### Low End: instrumental hip-hop

- Tempo: approximately 78-96 BPM.
- Core behavior: boom-bap and laid-back drum patterns, syncopated kick and snare, swung or delayed subdivisions, warm bass, electric-piano fragments, sparse melodic motifs, and filtered noise.
- Sound character: warm, dusty, rhythmically grounded, and suitable for long focus sessions.
- Use original synthesis and noise processing. Do not imitate a reference recording through samples or transcribed melodic material.
- Moods: Boom Bap, Dusty, Night Drive.
- Customization: drum density, swing intensity, bass intensity, texture age.
- Initial reference candidates: Nujabes, "Feather" and "Aruarian Dance"; J Dilla, "Workinonit"; selected Knxwledge instrumentals.

### Velvet: neo-soul

- Tempo: approximately 68-88 BPM.
- Core behavior: behind-the-beat percussion, extended chord voicings, smooth voice leading, syncopated bass movement, electric piano, and sparse melodic decoration.
- Reuse composition-engine theory and audio-engine instruments where appropriate, but do not expose Velvet as a duplicate Blue Notes configuration.
- Moods: Velvet, Intimate, Groove.
- Customization: harmonic complexity, rhythmic density, bass movement, melodic activity.
- Initial reference candidates: D'Angelo, "Really Love"; Erykah Badu, "On & On"; Sade, "Kiss of Life"; Robert Glasper Experiment, "So Beautiful".

### Vapor Trails: vaporwave

- Tempo: approximately 60-84 BPM, including half-time perceived motion.
- Core behavior: slow detuned pads, muted percussion, tape-like pitch drift, chorus or equivalent modulation, filtered textures, sparse bass, and long arrangement transitions.
- Create stretched and degraded character through original synthesis and effects. Do not time-stretch or process the referenced recordings.
- Moods: Dreamscape, Mallsoft, Signal Loss.
- Customization: texture density, tape wobble, rhythmic density, spatial depth.
- Initial reference candidates: Macintosh Plus, "リサフランク420 / 現代のコンピュー"; 2814, "恢复"; HOME, "Resonance"; selected Eco Virtual recordings.

### Open Window: instrumental indie

- Tempo: approximately 88-118 BPM.
- Core behavior: guitar-like plucks or strums, soft bass, restrained percussion, atmospheric pads, and repeating motifs with controlled variation.
- Prefer a simple native Web Audio plucked-string implementation, such as Karplus-Strong synthesis, if it produces a convincing result without a new dependency.
- Do not generate vocals or simulate vocal lyrics.
- Moods: Daydream, Sunlit, Nocturnal.
- Customization: strum density, melodic activity, percussion intensity, atmospheric texture.
- Initial reference candidates: The xx, "Intro"; Beach House, "Space Song"; Bon Iver, "Holocene"; Men I Trust, "Show Me How"; Explosions in the Sky, "Your Hand in Mine".

### Blue Notes refinement

- Preserve its working harmony, voice-leading, swing, bass, electric-piano, and constrained melody foundations.
- Clarify its catalog and description around jazz and mellow fusion now that neo-soul has a dedicated station.
- Retain existing IDs, moods, customization behavior, and stored user parameters unless a tested migration is necessary.
- Existing references such as Miles Davis, "Blue in Green"; Bill Evans, "Peace Piece"; Herbie Hancock, "Maiden Voyage"; and Ahmad Jamal, "Poinciana" remain appropriate.

## 21.5 Reference catalogs and episode constraints

Launch each new station with approximately 20-30 manually verified reference recordings. Prefer recognizable, focus-compatible works over obscure filler. Verify title, artist, year, key or mode, and assigned musical traits before considering a catalog complete.

The current `TrackSeed` traits are key, mode, energy, brightness, and movement. Extend the reference model only where the active station generators will consume the added information. Candidate additions are:

- Reference tempo.
- Swing or rhythmic displacement.
- Rhythmic density.
- Texture or register preference.

Rules:

- Use optional fields or tested defaults so existing catalog entries remain valid.
- Thread consumed traits through `EpisodeConstraint` and runtime generation without breaking deterministic episodes.
- A reference trait must affect actual generation. Do not add metadata that only appears authoritative in the UI.
- Keep reference melodies, lyrics, audio URLs, samples, and expressive note transcriptions out of the catalog.
- A recording may appear in more than one station when it legitimately informs different musical identities.
- Continue to show the explanatory text that playback is generative audio inspired by the original recording.
- Prefer "curated focus references" in public copy instead of "most heard songs".

## 21.6 Signal Space visual direction

Build one full-viewport scene called Signal Space behind the application interface:

- Incomplete concentric structures derived from the Infinite Radio signal mark.
- Flowing ribbons and sparse particles that establish depth around the listening experience.
- Slow camera drift and restrained pointer parallax when motion is allowed.
- Audio energy influencing rotation, ring expansion, ribbon displacement, and particle motion.
- Smooth visual-profile transitions when the station changes.
- Station identity tints in the scene, while all interactive UI continues to use the shared cyan accent.

Avoid scroll hijacking, custom cursors, strobing, aggressive camera movement, heavy bloom, and effects that reduce text contrast. The scene must support the listening experience rather than compete with the player.

Each station receives a visual profile containing its palette, geometry treatment, density, drift speed, and audio-response characteristics. Profiles are application visual configuration, not browser code inside station definitions.

## 21.7 Three.js architecture

Target Three.js r186 and use `WebGLRenderer` for broad browser compatibility. Add `three` and its matching TypeScript types to the web app only after confirming the installed package versions. Do not add React Three Fiber, a physics engine, GSAP, or postprocessing dependencies for this scene unless a measured requirement justifies one.

Suggested implementation boundaries:

- `apps/web/src/features/scene/SceneCanvas.tsx`: React lifecycle, dynamic import, settings integration, and fallback selection.
- `apps/web/src/features/scene/signalScene.ts`: Three.js scene, renderer, procedural animation, audio sampling, resize handling, and disposal.
- `apps/web/src/features/scene/visualProfiles.ts`: typed visual profiles keyed by `StationId`.

Implementation requirements:

- Dynamically import the Three.js scene so the initial interface does not wait for the 3D bundle.
- Cancel or ignore an asynchronous scene load if the component unmounts or visuals are disabled.
- Mount the canvas behind the app content with `pointer-events-none` and `aria-hidden`.
- Use `THREE.Timer`, call `timer.connect(document)`, and update it at the start of each frame.
- Use `renderer.setAnimationLoop()` instead of a manual `requestAnimationFrame` loop.
- Use procedural animation and `THREE.MathUtils.damp()` for frame-rate-independent transitions. Animation mixers and glTF loaders are unnecessary unless authored models are introduced later.
- Read the existing engine analyser directly in the scene loop. Do not publish continuous audio or pointer values into React or Zustand.
- Reuse frequency arrays, vectors, geometries, and materials. Avoid per-frame object allocation in hot paths.
- Smooth low, mid, and high band energies and map them to restrained visual responses.
- Handle resizing with `ResizeObserver` and cap pixel ratio to control GPU cost.
- Reduce geometry and particle density on small or lower-capability screens.
- Detect software rasterizers (SwiftShader/llvmpipe) and degrade further:
  no antialiasing, a lower pixel-ratio cap, and adaptive frame pacing that
  renders every Nth tick when a frame consistently exceeds its budget, so
  the interface stays responsive on machines without a hardware GPU.
- Handle WebGL context loss and initialization failure without breaking audio or application controls.
- Dispose the animation loop, observers, renderer, geometries, materials, and other scene resources on teardown.
- Do not run the existing 2D visualizer animation and the 3D renderer concurrently. Retain the 2D visualizer as a fallback.

## 21.8 Visual lifecycle and accessibility

Implement all of these states explicitly:

- **Reduced motion:** render a static frame with no camera drift, pointer parallax, or audio pulsing.
- **Visuals disabled:** do not initialize WebGL and release an existing scene if the setting changes.
- **Hidden tab:** stop rendering and avoid a large resume delta.
- **Paused playback:** keep the ambient scene rendering; the damped audio response settles to zero.
- **WebGL unavailable or failed:** preserve the artwork, player controls, and 2D visualizer fallback.
- **Station transition:** damp or crossfade visual parameters without reconstructing the renderer.
- **Component unmount:** release every scene resource and cancel pending asynchronous setup.

No animation may be necessary to understand station identity, playback state, or controls. Do not autoplay audio when initializing the visual scene.

## 21.9 Registry, persistence, and discovery changes

- Expand `STATION_IDS` and station accent typing in `packages/shared/src/types/station.ts`.
- Add station definitions, generators, moods, parameter specifications, artwork, and catalogs under `packages/stations/src`.
- Extend the shared validation and preference tests for all seven station IDs.
- Preserve valid preferences from the three-station version. Unknown or removed IDs must still fall back safely.
- Keep previous and next station behavior generic through `STATION_LIST`.
- Replace the fixed three-column discovery assumption with a responsive layout appropriate for seven stations. Preserve direct selection, play actions, active state, keyboard navigation, and usable touch targets.
- Add original optimized artwork for the four new stations and register their station-specific tokens.
- Reuse the existing visualizer setting for the immersive scene unless user testing demonstrates a need for a separate control.
- Update default-station settings, favorites, mood persistence, customization, and reset behavior for the expanded registry.

## 21.10 Implementation phases

Execute these phases sequentially. Run relevant tests after each phase and do not mark incomplete manual validation as complete.

### 21A: Domain and registry foundation

- Expand station IDs, accent tokens, validation, and registry test fixtures.
- Add typed visual-profile and episode-trait extensions with backward-compatible defaults.
- Add the four station definitions with complete metadata, moods, parameters, and artwork slots.
- Preserve all three existing station IDs and preferences.

Acceptance criteria:

- All seven stations resolve through registry helpers.
- Existing persisted preferences load without losing valid customization or favorites.
- Invalid IDs and malformed values still fall back safely.
- Shared, station, and application type checks pass.

### 21B: Low End vertical slice

- Implement the hip-hop generator and any reusable audio support it genuinely needs.
- Add its verified reference catalog, moods, controls, and final artwork.
- Add deterministic generation, registry, episode, and application integration tests.
- Verify station switching, live customization, and continuous scheduling.

Acceptance criteria:

- Low End has a recognizable instrumental hip-hop identity and is not an After Hours preset with different metadata.
- All four customization controls audibly affect generation or sound rendering.
- Reference traits affect the generated sections deterministically.
- No scheduling gaps, clicks, or resource leaks are introduced in automated tests.

### 21C: Remaining genre stations

Implement and validate one station at a time in this order:

1. Velvet.
2. Vapor Trails.
3. Open Window.
4. Blue Notes jazz refinement.

For each station, complete its generator, reusable sound support, catalog, moods, controls, artwork, tests, and integration before starting the next.

Acceptance criteria:

- Seven stations are distinguishable by their actual generated audio and arrangement behavior.
- Every station has three moods and four working customization controls.
- Every new station has approximately 20-30 verified references.
- Same seed, episode, and configuration reproduce the same musical section.
- Crossfades and continuous playback work between any pair of stations.

### 21D: Signal Space implementation

- Add and dynamically load Three.js r186.
- Implement the procedural scene, analyser sampling, responsive sizing, lifecycle, and cleanup.
- Add visual profiles for all seven stations.
- Integrate the scene into `AppShell` and retain the 2D fallback.
- Add tests around React integration, settings, failed initialization, and resource cleanup. Use manual browser profiling for real GPU behavior.

Acceptance criteria:

- The scene responds to real audio and changes profile without renderer reconstruction.
- Controls remain readable and responsive at supported viewport sizes.
- Reduced motion, disabled visuals, hidden tabs, paused playback, and WebGL failure follow Section 21.8.
- Repeated station switches do not cause continuing growth in scene resources.
- No continuous React render loop or duplicate visualizer loop is introduced.

### 21E: Expanded discovery and final integration

- Finalize the seven-station responsive discovery layout.
- Verify previous and next order, favorites, default station, settings, mood selection, and customization.
- Check keyboard navigation, focus visibility, screen-reader labels, text contrast, and mobile touch targets.
- Confirm that reference-track copy clearly describes generative playback.

Acceptance criteria:

- Every visible station and control works with real application state.
- Seven-station layouts work at desktop, tablet, and mobile sizes without clipped controls or horizontal page overflow.
- Existing application flows continue to pass with the expanded registry.

### 21F: Verification and documentation

- Run all workspace unit, component, and browser tests.
- Run linting, TypeScript checks, formatting checks where configured, and the production build.
- Exercise real browser playback, station switching, scene fallback, reduced motion, and disabled visuals.
- Profile a 30-minute playback session for memory growth, scene cleanup, and audio scheduling stability.
- Listen to every new station for at least 10 minutes. Record this separately from automated verification and never claim listening tests that were not performed.
- Update `README.md`, `docs/architecture.md`, `docs/audio-engine.md`, `docs/station-system.md`, and `docs/design-system.md` to match the delivered behavior.
- Remove temporary artifacts created by verification and report any validation that remains blocked.

## 21.11 Expansion completion criteria

The expansion is complete only when:

1. Seven stations generate original, distinguishable, continuously evolving audio.
2. Hip-hop, jazz, neo-soul, vaporwave, indie, ambient, and electronic identities are all represented by real station behavior.
3. New catalogs contain verified references whose consumed traits affect deterministic generation.
4. The application never streams or reproduces the reference recordings.
5. All moods, customization controls, favorites, defaults, and persisted preferences work across the expanded registry.
6. Signal Space renders an immersive scene driven by actual audio and active-station configuration.
7. Reduced motion, disabled visuals, hidden tabs, pause, unmount, and WebGL failure are handled without harming playback or usability.
8. Automated tests, linting, type checking, and the production build pass.
9. Real browser performance and resource cleanup have been checked.
10. Manual listening validation is completed or explicitly reported as still required.
11. Documentation reflects the seven-station architecture and the 3D scene.

The expansion retains the original quality bar: Infinite Radio must sound like a collection of carefully designed radio stations, not like a random music generator or the same generator with different labels.
