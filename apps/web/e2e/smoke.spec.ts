import { expect, test, type Locator } from '@playwright/test'

const STATION_NAMES = [
  'Weightless',
  'Low End',
  'Blue Notes',
  'Velvet',
  'Vapor Trails',
  'Open Window',
  'After Hours',
] as const

/** Set a range input's value the way React expects (native setter + input event). */
async function setSlider(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((element, next) => {
    const input = element as HTMLInputElement
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!
    descriptor.set!.call(input, next)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

test.describe('Infinite Radio', () => {
  test('loads the focused screen with one transport and all session actions', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.goto('/')
    await expect(page.getByText('infinite radio')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Weightless' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Play' })).toHaveCount(1)
    await expect(page.getByRole('slider', { name: 'Volume' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mute' })).toBeVisible()
    for (const action of ['Stations', 'Mood', 'Sound', 'Settings']) {
      await expect(page.getByRole('button', { name: action })).toBeVisible()
    }
    // The old editorial interface is gone.
    await expect(page.getByText('Now transmitting')).toHaveCount(0)
    await expect(page.getByText(/Up next/)).toHaveCount(0)
    await expect(page.getByAltText(/artwork/i)).toHaveCount(0)

    expect(errors).toEqual([])
  })

  test('plays, pauses, and resumes from the central transport', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.goto('/')
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('Live · Infinite transmission')).toBeVisible()

    await page.getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByText('Paused')).toBeVisible()

    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('Live · Infinite transmission')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('changes volume through the semantic range and persists it across reload', async ({
    page,
  }) => {
    await page.goto('/')
    const volume = page.getByRole('slider', { name: 'Volume' })
    await setSlider(volume, '40')

    await page.reload()
    await expect(page.getByRole('slider', { name: 'Volume' })).toHaveValue('40')
  })

  test('selects every station from the sheet while the same canvas survives', async ({ page }) => {
    // Selecting seven stations while the software-rendered WebGL scene runs
    // is the most CPU-expensive interaction in the suite; give it room.
    test.setTimeout(60_000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.goto('/')
    const scene = page.getByTestId('signal-space')
    await expect(scene).toHaveCount(1)
    await expect(scene.locator('canvas')).toHaveCount(1)

    // Start playback so the animation loop and analyser sampling run while
    // the station profiles change underneath them.
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('Live · Infinite transmission')).toBeVisible()

    const captured = await page.evaluate(() => {
      const canvas = document.querySelector('[data-testid="signal-space"] canvas')
      ;(window as unknown as { __sceneCanvas?: Element }).__sceneCanvas = canvas ?? undefined
      return Boolean(canvas)
    })
    expect(captured).toBe(true)

    for (const name of STATION_NAMES) {
      await page.getByRole('button', { name: 'Stations' }).click()
      const sheet = page.getByRole('dialog', { name: 'Stations' })
      await sheet.getByRole('button', { name: new RegExp(name) }).click()
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
    }

    // The active row follows the selection in the sheet.
    await page.getByRole('button', { name: 'Stations' }).click()
    await expect(page.getByRole('button', { name: new RegExp('After Hours') })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await page.keyboard.press('Escape')

    // Exactly one canvas, same element through every station change —
    // profiles damp instead of rebuilding the renderer.
    await expect(scene.locator('canvas')).toHaveCount(1)
    const sameNode = await page.evaluate(() => {
      const current = document.querySelector('[data-testid="signal-space"] canvas')
      return current === (window as unknown as { __sceneCanvas?: Element }).__sceneCanvas
    })
    expect(sameNode).toBe(true)
    expect(errors).toEqual([])
  })

  test('changes mood and sound parameters live', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.goto('/')
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('Live · Infinite transmission')).toBeVisible()

    await page.getByRole('button', { name: 'Mood' }).click()
    const moodSheet = page.getByRole('dialog', { name: 'Mood' })
    await moodSheet.getByRole('radio', { name: 'Vast' }).click()
    await moodSheet.getByRole('button', { name: 'Done' }).click()
    await expect(moodSheet).not.toBeVisible()

    await page.getByRole('button', { name: 'Sound' }).click()
    const soundSheet = page.getByRole('dialog', { name: 'Sound' })
    await expect(soundSheet.getByRole('slider')).toHaveCount(4)
    const density = soundSheet.getByRole('slider', { name: 'Texture density' })
    await setSlider(density, '0.2')
    await expect(density).toHaveValue('0.2')
    await page.keyboard.press('Escape')
    await expect(soundSheet).not.toBeVisible()

    await expect(page.getByText('Live · Infinite transmission')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('keeps a single static canvas under reduced motion', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const scene = page.getByTestId('signal-space')
    await expect(scene).toHaveCount(1)
    await expect(scene.locator('canvas')).toHaveCount(1)
    expect(errors).toEqual([])
  })

  test('captures desktop and mobile screenshots for visual review', async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText('Live · Infinite transmission')).toBeVisible()
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: testInfo.outputPath('radio-desktop.png'),
      fullPage: true,
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(400)
    await page.screenshot({
      path: testInfo.outputPath('radio-mobile.png'),
      fullPage: true,
    })
    expect(errors).toEqual([])
  })
})
