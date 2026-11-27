import { chromium } from '@playwright/test'

const run = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const logs = []
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`))

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: 'shot-1-initial.png' })

  // Start playback
  const playButton = page.getByRole('button', { name: /play|pause/i }).first()
  await playButton.click().catch(() => {})
  await page.waitForTimeout(3000)
  await page.screenshot({ path: 'shot-2-playing-a.png' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'shot-3-playing-b.png' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'shot-4-playing-c.png' })

  // Report scene/canvas diagnostics
  const diag = await page.evaluate(() => {
    const host = document.querySelector('[data-testid="signal-space"]')
    const canvas = host?.querySelector('canvas')
    const stage = document.querySelector('.transport-stage')
    return {
      hostPresent: !!host,
      canvasSize: canvas ? { w: canvas.width, h: canvas.height, cssW: canvas.clientWidth, cssH: canvas.clientHeight } : null,
      stageRect: stage ? JSON.parse(JSON.stringify(stage.getBoundingClientRect())) : null,
      webgl: (() => {
        const c = document.createElement('canvas')
        const gl = c.getContext('webgl2')
        const info = gl?.getExtension('WEBGL_debug_renderer_info')
        return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'n/a'
      })(),
    }
  })
  console.log('DIAG', JSON.stringify(diag, null, 2))
  console.log('LOGS:\n' + logs.join('\n'))
  await browser.close()
}
run()
