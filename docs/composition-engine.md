# Composition engine

Package: `packages/composition-engine`. Decides **what** should happen
musically. Output is pure data (`MusicalEvent` / `MusicalSection` from
`@infinite-radio/shared`) — beats, not seconds; no Web Audio objects.

## Determinism

Every random decision flows through seeded random sources
(`generation/rng.ts`, re-exported from `@infinite-radio/shared`):

- `createSectionRandom(seed, sectionIndex)` gives each section an
  independent, reproducible stream — section N is stable even if earlier
  sections change.
- The audio scheduler provides the random source; generators never call
  `Math.random()`.

## Modules

### Theory (`theory/`)

- `midi.ts` — MIDI ↔ frequency ↔ note names (C4 = 60).
- `intervals.ts` — semitone transposition, pitch-class distance.
- `scales.ts` — major, natural minor, dorian, mixolydian, pentatonics;
  membership tests.
- `chords.ts` — chord qualities from fifths to minor 11ths; inversions
  that preserve pitch classes.
- `keys.ts`, `tempo.ts` — key helpers; beat/bar/second conversions
  (4 beats per bar throughout).

### Harmony (`harmony/`)

- `progressions.ts` — predefined templates (ii–V–I–vi, minor descent,
  pop turnaround…) transposable to any key.
- `voicing.ts` — compact chord voicing around a register, and
  voice-leading that chooses octaves to minimize movement from the
  previous chord.

### Rhythm (`rhythm/`)

- `grids.ts` — subdivision grids and strong-beat tests.
- `swing.ts` — off-eighth displacement interpolated between straight
  and triplet time.
- `euclidean.ts` — Bjorklund's algorithm for even pulse distributions.
- `velocity.ts` — deterministic humanization and accents.

### Melody (`melody/generator.ts`)

Constrained phrase generation: chord tones on strong beats, scale tones
for passing motion, leap limits, and deliberate quotation/variation of a
previous phrase (transposed into the current scale). Never an
unrestricted random walk.

### Arrangement & variation (`arrangement/`, `variation/`)

- Section-index-driven arrangement cycle: intro → build → main →
  variation → breakdown, with per-state layer-density multipliers and
  slow energy drift.
- Small transforms for variation: velocity humanization, octave
  displacement, scale-constrained transposition, timing humanization.

## Testing

Unit tests cover MIDI/frequency conversion, scale membership, chord
construction and inversions, voice leading, tempo math, swing, Euclidean
rhythms, seed reproducibility, melody constraints, and arrangement
transitions.
