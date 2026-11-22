import type { Page } from '@playwright/test'

/**
 * En qué cuadro se vio por primera vez cada texto, en ms desde que empezó a abrir la pantalla: lo que
 * tiene que estar a la vista dentro del tope de lo principal, y no llegar después.
 */
export async function firstSeen(page: Page, path: string, texts: string[]): Promise<number[]> {
  await page.addInitScript((wanted) => {
    const seen: number[] = wanted.map(() => Number.POSITIVE_INFINITY)
    Reflect.set(window, '__firstSeen', seen)
    const visible = (text: string) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const parent = node.parentElement
        if (node.textContent?.includes(text) === true && parent?.checkVisibility() === true) {
          return true
        }
      }
      return false
    }
    const frame = (now: number) => {
      if (document.body !== null) {
        wanted.forEach((text, index) => {
          if (seen[index] === Number.POSITIVE_INFINITY && visible(text)) seen[index] = now
        })
      }
      if (seen.includes(Number.POSITIVE_INFINITY) && now < 10_000) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, texts)
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  return page.evaluate(() => {
    const seen: unknown = Reflect.get(window, '__firstSeen')
    return Array.isArray(seen) ? seen.map(Number) : []
  })
}
