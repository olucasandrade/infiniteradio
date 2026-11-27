import { expect, test } from '@playwright/test'
import type { WebAudioEngine } from '@infinite-radio/audio-engine'

declare global {
  interface Window {
    __IR_ENGINE__?: WebAudioEngine
  }
}

test('tunes in late and survives missing samples and consecutive handoffs', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const sampleFailure = page.waitForEvent('requestfailed', {
    predicate: (request) => request.url().includes('/samples/'),
  })
  await page.route('**/samples/**', (route) => route.abort())
  await page.addInitScript(() => {
    const realNow = Date.now.bind(Date)
    const offset = 240_000 * 100 + 110_000 - realNow()
    Date.now = () => realNow() + offset
    localStorage.setItem(
      'infinite-radio:preferences:v1',
      JSON.stringify({
        lastStationId: 'hip-hop',
        visualizerEnabled: false,
        reducedMotion: true,
      }),
    )
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await sampleFailure
  const state = () =>
    page.evaluate(() => {
      const engine = window.__IR_ENGINE__!
      const runtime = engine.getRuntime()!
      const analyser = engine.getAnalyser()!
      const data = new Float32Array(analyser.fftSize)
      analyser.getFloatTimeDomainData(data)
      return {
        position: runtime.scheduler!.positionBeats(),
        signal: data.some((sample) => Math.abs(sample) > 0.002),
        status: engine.getStatus(),
      }
    })
  await expect.poll(async () => (await state()).position).toBeGreaterThan(100)
  await expect.poll(async () => (await state()).signal).toBe(true)

  for (const index of [101, 102]) {
    await page.evaluate((slot) => {
      const engine = window.__IR_ENGINE__!
      const runtime = engine.getRuntime()!
      const startsAtMs = Date.now() + 250
      engine.setEpisodeConstraint(
        { ...runtime.episode!, seed: slot, index: slot },
        {
          stationId: runtime.definition.id,
          startsAtMs,
          endsAtMs: startsAtMs + 240_000,
        },
      )
    }, index)
    await expect.poll(async () => (await state()).position).toBeGreaterThan(0.5)
    await expect.poll(async () => (await state()).signal).toBe(true)
    expect((await state()).status).toBe('playing')
  }

  await page.getByRole('button', { name: 'Pause' }).click()
  await expect.poll(async () => (await state()).status).toBe('paused')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect.poll(async () => (await state()).position).toBeGreaterThan(100)
  await expect.poll(async () => (await state()).signal).toBe(true)
  expect(errors).toEqual([])
})

test('decodes the sample bank and keeps playing through rapid station switches', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'infinite-radio:preferences:v1',
      JSON.stringify({
        lastStationId: 'hip-hop',
        visualizerEnabled: false,
        reducedMotion: true,
      }),
    ),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const result = await page.evaluate(async () => {
    const engine = window.__IR_ENGINE__!
    const bank = engine.getRuntime()!.samples!
    await bank.ready
    const kickA = bank.forSection()('kick')
    const kickB = bank.forSection()('kick')
    const sampled = kickA !== kickB
    await engine.switchStation('indie')
    await engine.switchStation('vaporwave')
    await engine.switchStation('hip-hop')
    return { sampled, station: engine.getCurrentStationId(), status: engine.getStatus() }
  })
  expect(result).toEqual({ sampled: true, station: 'hip-hop', status: 'playing' })
})
