/**
 * Minimal mocked Web Audio implementation covering the node types the
 * engine uses. Timing methods record their calls so tests can assert
 * scheduling behavior without a real audio device.
 */

export class MockAudioParam {
  value: number
  readonly calls: Array<{ method: string; args: number[] }> = []

  constructor(value = 0) {
    this.value = value
  }

  setValueAtTime(value: number, time: number): this {
    this.value = value
    this.calls.push({ method: 'setValueAtTime', args: [value, time] })
    return this
  }

  linearRampToValueAtTime(value: number, time: number): this {
    this.value = value
    this.calls.push({ method: 'linearRampToValueAtTime', args: [value, time] })
    return this
  }

  exponentialRampToValueAtTime(value: number, time: number): this {
    this.value = value
    this.calls.push({ method: 'exponentialRampToValueAtTime', args: [value, time] })
    return this
  }

  setTargetAtTime(value: number, time: number, timeConstant: number): this {
    this.value = value
    this.calls.push({ method: 'setTargetAtTime', args: [value, time, timeConstant] })
    return this
  }

  cancelScheduledValues(time: number): this {
    this.calls.push({ method: 'cancelScheduledValues', args: [time] })
    return this
  }
}

export class MockAudioNode {
  readonly connections: unknown[] = []
  readonly incoming: unknown[] = []
  disconnectCount = 0

  connect(node: unknown): unknown {
    this.connections.push(node)
    if (node instanceof MockAudioNode) node.incoming.push(this)
    return node
  }

  disconnect(): void {
    this.disconnectCount++
    this.connections.length = 0
  }
}

export class MockGainNode extends MockAudioNode {
  readonly gain = new MockAudioParam(1)
}

export class MockOscillatorNode extends MockAudioNode {
  type: OscillatorType = 'sine'
  frequency = new MockAudioParam(440)
  detune = new MockAudioParam(0)
  started = false
  stopped = false
  stopTime = 0

  start(_time?: number): void {
    this.started = true
  }

  stop(time?: number): void {
    this.stopped = true
    this.stopTime = time ?? 0
  }
}

export class MockBiquadFilterNode extends MockAudioNode {
  type: BiquadFilterType = 'lowpass'
  frequency = new MockAudioParam(350)
  Q = new MockAudioParam(1)
}

export class MockDynamicsCompressorNode extends MockAudioNode {
  threshold = new MockAudioParam(-24)
  knee = new MockAudioParam(30)
  ratio = new MockAudioParam(12)
  attack = new MockAudioParam(0.003)
  release = new MockAudioParam(0.25)
}

export class MockAnalyserNode extends MockAudioNode {
  fftSize = 2048
  frequencyBinCount = 1024
  smoothingTimeConstant = 0
  private frequencyData = new Uint8Array(this.frequencyBinCount)
  private timeData = new Uint8Array(this.fftSize)

  getByteFrequencyData(target: Uint8Array): void {
    target.set(this.frequencyData.subarray(0, target.length))
  }

  getByteTimeDomainData(target: Uint8Array): void {
    target.set(this.timeData.subarray(0, target.length))
  }
}

export class MockConvolverNode extends MockAudioNode {
  buffer: AudioBuffer | null = null
}

export class MockDelayNode extends MockAudioNode {
  delayTime = new MockAudioParam(0)
}

export class MockWaveShaperNode extends MockAudioNode {
  curve: Float32Array | null = null
  oversample: OverSampleType = 'none'
}

export class MockAudioBuffer {
  readonly length: number
  readonly sampleRate: number
  private channels: Float32Array[]

  constructor(channels: number, length: number, sampleRate: number) {
    this.length = length
    this.sampleRate = sampleRate
    this.channels = Array.from({ length: channels }, () => new Float32Array(length))
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel]!
  }
}

export class MockAudioContext {
  readonly createdOscillators: MockOscillatorNode[] = []
  readonly createdGains: MockGainNode[] = []
  readonly createdFilters: MockBiquadFilterNode[] = []
  readonly createdConvolvers: MockConvolverNode[] = []
  readonly createdBufferSources: Array<{ loop: boolean; buffer: unknown; start(): void; stop(t?: number): void; connect(n: unknown): unknown; disconnect(): void }> = []
  currentTime = 0
  readonly sampleRate = 44100
  readonly destination = new MockAudioNode()
  state: AudioContextState = 'suspended'
  resumeCount = 0
  suspendCount = 0
  closed = false

  resume(): Promise<void> {
    this.resumeCount++
    this.state = 'running'
    return Promise.resolve()
  }

  suspend(): Promise<void> {
    this.suspendCount++
    this.state = 'suspended'
    return Promise.resolve()
  }

  close(): Promise<void> {
    this.closed = true
    this.state = 'closed'
    return Promise.resolve()
  }

  createGain(): MockGainNode {
    const node = new MockGainNode()
    this.createdGains.push(node)
    return node
  }

  createOscillator(): MockOscillatorNode {
    const node = new MockOscillatorNode()
    this.createdOscillators.push(node)
    return node
  }

  createBiquadFilter(): MockBiquadFilterNode {
    const node = new MockBiquadFilterNode()
    this.createdFilters.push(node)
    return node
  }

  createDynamicsCompressor(): MockDynamicsCompressorNode {
    return new MockDynamicsCompressorNode()
  }

  createAnalyser(): MockAnalyserNode {
    return new MockAnalyserNode()
  }

  createConvolver(): MockConvolverNode {
    const node = new MockConvolverNode()
    this.createdConvolvers.push(node)
    return node
  }

  createDelay(_maxSeconds?: number): MockDelayNode {
    return new MockDelayNode()
  }

  createWaveShaper(): MockWaveShaperNode {
    return new MockWaveShaperNode()
  }

  createBuffer(channels: number, length: number, sampleRate: number): MockAudioBuffer {
    return new MockAudioBuffer(channels, length, sampleRate)
  }

  createStereoPanner(): MockAudioNode {
    return new MockAudioNode()
  }

  createBufferSource(): MockOscillatorNode {
    const node = new MockOscillatorNode()
    this.createdBufferSources.push(node as never)
    return node
  }
}

export function installMockAudioContext(): MockAudioContext {
  const mock = new MockAudioContext()
  ;(globalThis as { AudioContext?: unknown }).AudioContext = MockAudioContext
  return mock
}

export function createMockContextInstance(): MockAudioContext {
  return new MockAudioContext()
}
