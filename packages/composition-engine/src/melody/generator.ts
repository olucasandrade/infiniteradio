import { chance, pick, type RandomSource } from '../generation/rng'
import { isChordTone, type ChordQuality, buildChord } from '../theory/chords'
import { getScaleNotes, nearestScaleTone, type ScaleName } from '../theory/scales'
import { midiAtOrAbove } from '../theory/keys'

export interface PhraseNote {
  pitch: number
  /** Start position in beats (relative to the phrase). */
  time: number
  duration: number
  velocity: number
}

export interface MelodyOptions {
  rng: RandomSource
  keyRootMidi: number
  scale: ScaleName
  /** Chord in effect at the phrase start (for chord-tone anchoring). */
  chordRootMidi: number
  chordQuality: ChordQuality
  phraseLengthBeats: number
  /** Target number of notes in the phrase. */
  noteCount: number
  /** 0..1 — higher values allow more leaps, syncopation, and chromaticism. */
  complexity: number
  /** Optional previous phrase to quote/variate. */
  previousPhrase?: readonly PhraseNote[]
  registerMidi?: number
  octaveSpan?: number
}

const MAX_LEAP = 7

/**
 * Constrained melodic generation. The output obeys musical rules rather
 * than random walks: chord tones on strong beats, scale tones elsewhere,
 * limited leaps, and deliberate repetition/variation of earlier phrases.
 */
export function generateMelodyPhrase(options: MelodyOptions): PhraseNote[] {
  const {
    rng,
    keyRootMidi,
    scale,
    chordRootMidi,
    chordQuality,
    phraseLengthBeats,
    noteCount,
    complexity,
    previousPhrase,
    registerMidi = 72,
    octaveSpan = 1,
  } = options

  // Wide concrete scale centered on the register; filtered to range below.
  const scaleNotes = getScaleNotes(keyRootMidi - 24, scale, 6)
  const chordTones = buildChord(chordRootMidi, chordQuality)
  const low = registerMidi - 6 * octaveSpan
  const high = registerMidi + 6 * octaveSpan + 12
  const inRange = (midi: number) => midi >= low && midi <= high

  // Optionally quote the previous phrase (transposed into the current scale).
  if (previousPhrase && previousPhrase.length > 0 && chance(rng, 0.35)) {
    const shift = Math.floor(rng() * 5) - 2
    const quoted = previousPhrase
      .filter((note) => note.time < phraseLengthBeats)
      .map((note, index) => ({
        pitch: nearestScaleTone(
          scaleNotes,
          note.pitch + shift + (index % 2 === 0 ? 0 : 12 * Math.sign(shift || 1)),
        ),
        time: note.time,
        duration: note.duration,
        velocity: Math.min(1, note.velocity + (rng() - 0.5) * 0.1),
      }))
      .filter((note) => inRange(note.pitch))
    if (quoted.length >= Math.max(2, Math.floor(noteCount / 2))) {
      return quoted
    }
  }

  const notes: PhraseNote[] = []
  const strongBeats = [0, 2]
  let currentPitch = nearestScaleTone(scaleNotes, registerMidi)
  let cursor = 0

  for (let i = 0; i < noteCount; i++) {
    // Later notes may land on weak beats when complexity is high.
    const slot = i < strongBeats.length ? strongBeats[i]! : null
    const syncopated = slot === null && complexity > 0.4 && chance(rng, complexity * 0.5)
    const time =
      slot !== null
        ? (slot / 4) * phraseLengthBeats
        : (i / Math.max(1, noteCount - 1)) * (phraseLengthBeats - 0.5) +
          (syncopated ? 0.25 : 0)

    const wantChordTone = slot !== null || chance(rng, 0.4)
    let candidates = scaleNotes.filter(inRange)
    if (wantChordTone) {
      const chordCandidates = candidates.filter((note) => isChordTone(chordTones, note))
      if (chordCandidates.length > 0) candidates = chordCandidates
    }

    // Limit leaps: prefer stepwise motion, allow leaps at higher complexity.
    const maxDistance = complexity > 0.6 && chance(rng, 0.3) ? MAX_LEAP + 5 : MAX_LEAP
    const nearby = candidates.filter(
      (note) => Math.abs(note - currentPitch) <= maxDistance && note !== currentPitch,
    )
    const pool = nearby.length > 0 ? nearby : candidates
    currentPitch = pick(rng, pool)
    cursor = Math.max(cursor, time)

    const duration = Math.min(
      phraseLengthBeats - time,
      (chance(rng, 0.3 + complexity * 0.3) ? 1 : 0.5) * (phraseLengthBeats / noteCount) * 2,
    )
    const strong = slot !== null
    notes.push({
      pitch: currentPitch,
      time,
      duration: Math.max(0.25, duration),
      velocity: strong ? 0.75 + complexity * 0.15 : 0.5 + rng() * 0.2,
    })
  }

  return notes.sort((a, b) => a.time - b.time)
}

export { midiAtOrAbove }
