# Audio engine

Package: `packages/audio-engine`. Implements the `AudioEngine` interface
from `@infinite-radio/shared`. React never sees an `AudioNode`; the app
talks only to the engine's public methods.

## Graph

```text
instrument voices ──> StationBus.input ──┬─ dry ────────────────┐
                                         ├─ reverb send ────────┤
                                         └─ delay send ─────────┘
                                                    │
                                                    ▼
                                              bus.output
                                                    │
        station buses ──> master gain ──> limiter ──> analyser ──> destination
```

- One `AudioContext` for the app's lifetime.
- Each station runtime has its own `StationBus`. Percussion, bass,
  harmony, lead, and texture have independent gain and effect sends.
- The episode clock prepares the next runtime ahead of its window.
  Incoming music starts at the handoff, while the previous bus fades
  with its scheduled notes and effect tails still audible.
- The scheduler joins the current phrase when a listener tunes in or
  resumes. It uses the plan tempo for event timing and tempo-based effects.
- The browser caches decoded instrument samples per audio context. A
  phrase uses the synthesized voice if its sample bank is unavailable.
  The next phrase can use the decoded bank when it is ready.

## Scheduling (`src/scheduling/scheduler.ts`)

Lookahead scheduling ("a tale of two clocks"): a 100ms `setInterval`
checks the AudioContext clock and schedules enough whole sections to
stay ~1s ahead. Timing precision comes from `AudioParam`/start()
scheduling against the context clock — never from JavaScript timeouts.

- Events too close to `currentTime` when scheduled are dropped rather
  than piled up late.
- Pause releases scheduled voices. Resume seeks to the current wall-clock
  phrase and restores held notes where they are still audible.
- `updateParameters()` affects only sections not yet scheduled.

## Envelopes

`effects/envelope.ts` implements ADSR with `AudioParam` ramps: attack
and decay use `exponentialRampToValueAtTime`, sustain holds through the
note body, release ramps to near-zero exactly at the oscillator's
scheduled stop. A minimum release guards against clicks.

## Effects

- **Reverb** — convolver with a generated exponential-decay noise
  impulse response, created once per bus (never per voice), with
  wet/dry mixing.
- **Delay** — feedback delay (`feedback ≤ 0.9`) with wet/dry mixing;
  delay time is configured in beats and converted per station tempo.
- **Saturation** — tanh waveshaper curve for warmth (used sparingly).
- **Filter** — shared low/high/bandpass helper used by instruments.

## Instruments (`src/instruments/`)

| Instrument    | Technique                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SynthPad      | 2 detuned saws + sub sine through velocity-sensitive lowpass, long ADSR; optional `wobble` parameter widens detune and adds a slow pitch-drift LFO (vaporwave) |
| Drone         | Beating sine pair (±5 cents) + sub octave, very long envelope                                                                                                  |
| SoftBass      | Triangle through warm lowpass — upright-style                                                                                                                  |
| SubBass       | Pure sine, deep sustain                                                                                                                                        |
| ElectricPiano | 2-operator FM (ratio 3.5, fast mod decay) + tine partial                                                                                                       |
| Bell          | Inharmonic FM (ratio 2.76), long ring                                                                                                                          |
| Pluck         | Sawtooth through a filter that snaps shut                                                                                                                      |
| GuitarString  | Karplus-Strong: noise burst fed through a feedback delay line at the string period, damped into a plucked-string decay                                         |
| Kick          | Sine with 150→45Hz pitch drop                                                                                                                                  |
| Snare         | Noise burst (bandpass) + 180Hz body                                                                                                                            |
| HiHat         | Highpassed noise, velocity-shaped decay                                                                                                                        |
| NoiseTexture  | Looped noise through a slowly opening lowpass                                                                                                                  |

Voices own their nodes and expose `VoiceHandle.stop()` for cancellation;
the scheduler uses it on pause and teardown. Instruments are registered in
`instruments/registry.ts`; episode-scheduled triggers carry optional
per-event parameters (e.g. pad `wobble`, guitar-string `damping`).

## Lifecycle

- `initialize()` creates the context (called only from user gestures).
- `play()` resumes a suspended context and starts the scheduler;
  `pause()` suspends both.
- `dispose()` stops schedulers, disposes buses, closes the context.
- Initialization failures set status `error` and dispatch
  `infinite-radio:audio-error` with a human-readable message.
