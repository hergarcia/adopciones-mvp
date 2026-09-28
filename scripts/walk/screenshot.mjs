// En el teléfono se agranda la ventana hasta el alto de la página en vez de pedir `fullPage`:
// Chromium pierde la emulación táctil al capturar más allá de la ventana, `pointer: coarse` deja de
// valer y la captura de 390 mostraría lo que ve un mouse.
export async function screenshotWhole(page, viewport, path) {
  if (viewport.desktop) {
    await page.screenshot({ path, fullPage: true })
    return
  }
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ ...viewport.size, height: Math.max(height, viewport.size.height) })
  await page.screenshot({ path })
  await page.setViewportSize(viewport.size)
}
