import { expect, test } from '@playwright/test'

test.describe('Signal Space', () => {
  test('loads the PixiJS scene lazily and never reconstructs it', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.goto('/')
    const scene = page.getByTestId('signal-space')
    await expect(scene).toHaveCount(1)
    // Wait for the scene module and Pixi chunks to actually load before
    // inspecting resource timing (the host div mounts before they do).
    await expect(scene.locator('canvas')).toHaveCount(1)

    // The PixiJS scene is a lazy chunk, not part of the initial load.
    // `radioScene[.-]` matches the dev module (`radioScene.ts`) and the
    // production chunk (`radioScene-HASH.js`) without matching the
    // always-loaded `RadioSceneCanvas.tsx` host component.
    const lazyChunkLoaded = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .some((entry) => /radioScene[.-]|pixi/i.test(entry.name)),
    )
    expect(lazyChunkLoaded).toBe(true)
    // Three.js is gone from the bundle.
    const threeLoaded = await page.evaluate(() =>
      performance.getEntriesByType('resource').some((entry) => /three/i.test(entry.name)),
    )
    expect(threeLoaded).toBe(false)

    // Start playback so the animation loop runs, then change stations and
    // confirm the same canvas element survives.
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('Live · Infinite transmission')).toBeVisible()

    const captured = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="signal-space"] canvas')
      ;(window as unknown as { __sceneCanvas?: Element }).__sceneCanvas = canvas ?? undefined
      return Boolean(canvas)
    })
    expect(captured).toBe(true)

    for (const name of ['Blue Notes', 'After Hours', 'Weightless']) {
      await page.getByRole('button', { name: 'Stations' }).click()
      await page
        .getByRole('dialog', { name: 'Stations' })
        .getByRole('button', { name: new RegExp(name) })
        .click()
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    }

    await expect(scene.locator('canvas')).toHaveCount(1)
    const sameNode = await page.evaluate(() => {
      const current = document.querySelector('[data-testid="signal-space"] canvas')
      return current === (window as unknown as { __sceneCanvas?: Element }).__sceneCanvas
    })
    expect(sameNode).toBe(true)
    expect(errors).toEqual([])
  })

  test('never initializes WebGL when visuals start disabled', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'infinite-radio:preferences:v1',
        JSON.stringify({
          favoriteStationIds: [],
          lastStationId: 'weightless',
          lastMoodByStation: {},
          parametersByStation: {},
          volume: 0.8,
          muted: false,
          reducedMotion: false,
          visualizerEnabled: false,
          defaultStationId: 'weightless',
        }),
      )
    })
    await page.goto('/')

    await expect(page.getByTestId('signal-space')).toHaveCount(0)
    const lazyChunkLoaded = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .some((entry) => /radioScene[.-]|pixi/i.test(entry.name)),
    )
    expect(lazyChunkLoaded).toBe(false)
  })
})
