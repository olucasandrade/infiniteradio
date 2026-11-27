/** Visualization helpers: pull frequency/time-domain data from the analyser. */

export function getFrequencyData(analyser: AnalyserNode): Uint8Array<ArrayBuffer> {
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)
  return data
}

export function getTimeDomainData(analyser: AnalyserNode): Uint8Array<ArrayBuffer> {
  const data = new Uint8Array(analyser.fftSize)
  analyser.getByteTimeDomainData(data)
  return data
}
