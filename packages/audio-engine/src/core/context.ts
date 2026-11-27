/** AudioContext creation with feature detection. */

export class AudioEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AudioEngineError'
  }
}

type AudioContextConstructor = new () => AudioContext

function resolveConstructor(): AudioContextConstructor | null {
  const globalRef = globalThis as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor }
  return globalRef.AudioContext ?? globalRef.webkitAudioContext ?? null
}

export function isAudioSupported(): boolean {
  return resolveConstructor() !== null
}

export function createAudioContext(): AudioContext {
  const Constructor = resolveConstructor()
  if (!Constructor) {
    throw new AudioEngineError(
      'This browser does not support the Web Audio API. Try a recent version of Chrome, Firefox, Safari, or Edge.',
    )
  }
  try {
    return new Constructor()
  } catch (error) {
    throw new AudioEngineError(
      `Audio could not be initialized: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
