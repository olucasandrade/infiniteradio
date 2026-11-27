# Station system

Package: `packages/stations`. A station is a `StationDefinition`:
identity, artwork path, accent token, moods, customization parameter
specs, tempo range, effect configuration, and a `SectionGenerator`.
Stations are configurations of the shared engines — there is one audio
engine and one composition toolkit, not seven.

## How a station is built

Each generator receives a `GenerationContext` (seeded random, section
index, bars, merged parameters, optional episode constraint) and returns
a `MusicalSection` whose events are scheduled by the audio engine. All
seven stations use the arrangement cycle
(intro/build/main/variation/breakdown) to thin or enrich their layers over
time.

## Transmissions and the reference catalog

`src/catalog/` holds each station's library of curated focus references
(metadata plus key, mode, energy, brightness, and movement traits, with
optional swing, rhythmic-density, and texture traits) and the clock-driven
rotation that turns wall-clock time into an infinite sequence of
episodes (`getEpisodeAt`). Windows are grouped into cycles of one full
catalog and each cycle plays every recording exactly once in a seeded
shuffle order, so a recording never repeats until the whole library has
played; the cycle seam swaps its first two picks when they would repeat
the previous cycle's closer, so nothing ever plays twice in a row. Each
episode resolves to an
`EpisodeConstraint` that the audio engine applies to the active runtime:
the episode seed becomes the session seed and the traits steer the
generators — tonic and mode come from the referenced recording, and
energy, brightness, and movement nudge density, register, and pattern
choices. Consumed optional traits (swing, rhythmic density, texture)
blend into the same decisions deterministically. The current and next
transmissions are exposed to the UI. The app drives the rotation through
the episode clock (`apps/web/src/features/listening/episodes.ts`), which
applies the current episode on play and re-syncs at every window
boundary.

When no constraint is active (no rotation applied), generators fall back
to their house keys: D-dorian drift for Weightless, B♭ for Blue Notes,
A minor for After Hours, D dorian for Low End, F dorian for Velvet,
D♭ minor for Vapor Trails, and E major for Open Window.

## Weightless — ambient

- Dorian key centers that drift across sections (D, F, A, C, G).
- Layers: drones (always, the harmonic floor), slowly shifting pad
  stacks (density-controlled), sparse bell events, filtered noise air.
- No percussion, no fixed pulse; the slow tempo grid only spaces events.
- Parameters: texture density, harmonic movement, spatial depth,
  evolution speed. Big reverb (6s), dotted-eighth delay.
- Moods: Floating (balanced), Vast (spacier), Meditative (sparser,
  more mobile harmony).

## Low End — instrumental hip-hop

- 78–96 BPM boom-bap: syncopated kicks, delayed/swung backbeats,
  warm soft-bass, electric-piano fragments, filtered noise texture.
- Swing intensity blends with the episode's swing trait; texture age
  blends with the episode texture trait.
- Parameters: drum density, swing intensity, bass intensity, texture age.
  Moods: Boom Bap, Dusty, Night Drive.

## Blue Notes — jazz / mellow fusion

- Predefined progression templates transposed to B♭; harmonic
  complexity picks the template. Extended chords (7ths, 9ths, 11ths).
- Voicings voice-led chord-to-chord; electric piano comping on offbeats
  (probability scales with rhythmic density).
- Soft-bass movement: root on one, fifth/approach on three, extra
  quarters at high density. Swing applied to event times.
- Melody from the constrained phrase generator, quoting the previous
  section's phrase as variation.
- Parameters: harmonic complexity, swing intensity, melodic activity,
  rhythmic density. Moods: Intimate, Smoky, Playful.

## Velvet — neo-soul

- 68–88 BPM behind-the-beat groove: displaced percussion, extended
  voice-led chord voicings (9ths/11ths/13ths), syncopated soft-bass
  movement, electric piano, sparse bell decoration.
- Parameters: harmonic complexity, rhythmic density, bass movement,
  melodic activity. Moods: Velvet, Intimate, Groove.

## Vapor Trails — vaporwave

- 60–84 BPM with half-time perceived motion. Long detuned pads driven
  by the pad instrument's wobble parameter (pitch drift + slow LFO),
  muted half-time backbeats, sparse bass, filtered textures.
- Parameters: texture density, tape wobble, rhythmic density, spatial
  depth. Moods: Dreamscape, Mallsoft, Signal Loss.

## Open Window — instrumental indie

- 88–118 BPM. Karplus-Strong plucked guitar strings (the native
  `guitar-string` instrument), soft bass, restrained percussion,
  atmospheric pads, repeating motifs with controlled variation.
- Parameters: strum density, melodic activity, percussion intensity,
  atmospheric texture. Moods: Daydream, Sunlit, Nocturnal.

## After Hours — downtempo electronic

- Stable 100–112 BPM groove; i–VI–III–VII minor progression, one chord
  per two bars.
- Layers: four-on-the-floor kick (dropped in breakdowns), Euclidean
  offbeat hats, backbeat snare, long sub-bass roots, a repeating plucked
  bass motif, atmospheric pads, and a 16th-note arpeggio gated by
  melodic complexity.
- Parameters: bass intensity, percussion intensity, atmospheric
  texture, melodic complexity. Moods: Deep, Hypnotic, Minimal.

## Presets

`presets/index.ts` exports the registry (`STATION_LIST`) in discovery
order (Weightless, Low End, Blue Notes, Velvet, Vapor Trails, Open
Window, After Hours), mood lookup with fallback, and
`mergeMoodParameters` — station defaults ← mood overrides ← user
customization. The same merge drives both live engine updates and what
gets persisted. Previous/next station navigation is generic over
`STATION_LIST`.
