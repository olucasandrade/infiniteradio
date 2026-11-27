import { expect, test } from '@playwright/test'

/**
 * Sustained-playback QA: the engine must keep generating and rendering
 * audio over time without errors, drifting state, or unbounded memory
 * growth. (Not a substitute for human listening — see docs.)
 */
test('continuous playback stays healthy and renders audio', async ({ page }) => {
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))

  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByText('Live · Infinite transmission')).toBeVisible()

  const readLevel = () =>
    page.evaluate(() => {
      const engine = (
        window as unknown as { __IR_ENGINE__: { getAnalyser: () => AnalyserNode | null } }
      ).__IR_ENGINE__
      const analyser = engine.getAnalyser()
      if (!analyser) return 0
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      return data.reduce((sum, value) => sum + value, 0)
    })

  // Chrome-only heap metric; other browsers skip it.
  const heapMb = () =>
    page.evaluate(() => {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      return memory ? memory.usedJSHeapSize / (1024 * 1024) : null
    })

  // After ~10s of playback, the analyser must show real signal.
  await page.waitForTimeout(10_000)
  expect(await readLevel()).toBeGreaterThan(0)

  const heapBefore = await heapMb()

  // Let several sections elapse.
  await page.waitForTimeout(80_000)
  await expect(page.getByText('Live · Infinite transmission')).toBeVisible()
  expect(await readLevel()).toBeGreaterThan(0)

  const heapAfter = await heapMb()
  if (heapBefore !== null && heapAfter !== null) {
    expect(heapAfter - heapBefore).toBeLessThan(100)
  }

  // A live mood + parameter change mid-playback must not break the stream.
  await page.getByRole('button', { name: 'Mood' }).click()
  await page.getByRole('dialog', { name: 'Mood' }).getByRole('radio', { name: 'Vast' }).click()
  await page.getByRole('dialog', { name: 'Mood' }).getByRole('button', { name: 'Done' }).click()
  await page.getByRole('button', { name: 'Sound' }).click()
  const soundSheet = page.getByRole('dialog', { name: 'Sound' })
  const density = soundSheet.getByRole('slider', { name: 'Texture density' })
  await density.evaluate((element) => {
    const input = element as HTMLInputElement
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!
    descriptor.set!.call(input, '0.3')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await page.waitForTimeout(5_000)
  await expect(page.getByText('Live · Infinite transmission')).toBeVisible()
  expect(await readLevel()).toBeGreaterThan(0)

  expect(errors).toEqual([])
})
