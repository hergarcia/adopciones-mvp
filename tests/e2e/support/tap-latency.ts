import { expect, test, type Page } from '@playwright/test'

// Lo primero que se ve después de un toque (historia #313): un elemento a la vista, con un texto, un
// valor o marcado. Se describe con datos y no con una función: la página no evalúa código.
export type Answer = { selector: string; text?: string; value?: string; checked?: true }

export const TAP_BUDGET_MS = 200

// Arma la medición del próximo toque: el reloj arranca con el `pointerdown`, el `keydown` o el
// `change` de una foto elegida (la marca del navegador, no la de Playwright) y para en el primer
// cuadro en que se ve la respuesta.
// También lee el Event Timing del navegador (lo que mide el INP), que cuenta hasta el pintado
// aunque la respuesta ya estuviera a la vista: el toque tarda lo que diga la mayor de las dos. Lo
// medido queda en `window` como números sueltos; cada medición lleva su número y la anterior ya no
// escribe.
async function arm(page: Page, answer: Answer[]): Promise<void> {
  await page.evaluate((conditions) => {
    const holds = () =>
      conditions.every((condition) =>
        Array.from(document.querySelectorAll(condition.selector)).some(
          (element) =>
            (condition.text === undefined || element.textContent.includes(condition.text)) &&
            (condition.value === undefined ||
              (element instanceof HTMLInputElement && element.value === condition.value)) &&
            (condition.checked === undefined ||
              (element instanceof HTMLInputElement && element.checked)) &&
            element.checkVisibility({ visibilityProperty: true }),
        ),
      )
    const id = Number(Reflect.get(window, '__tapId') ?? 0) + 1
    const current = () => Reflect.get(window, '__tapId') === id
    Reflect.set(window, '__tapId', id)
    Reflect.set(window, '__tapAnswered', null)
    Reflect.set(window, '__tapLongest', 0)
    let start: number | null = null
    // `durationThreshold` todavía no está en los tipos del DOM de TypeScript; 16 es el mínimo.
    const eventTiming: PerformanceObserverInit & { durationThreshold: number } = {
      type: 'event',
      durationThreshold: 16,
    }

    new PerformanceObserver((list, observer) => {
      if (!current()) {
        observer.disconnect()
        return
      }
      for (const entry of list.getEntries()) {
        const interaction = Number(Reflect.get(entry, 'interactionId') ?? 0)
        if (start === null || interaction === 0 || entry.startTime < start - 1) continue
        const longest = Number(Reflect.get(window, '__tapLongest'))
        Reflect.set(window, '__tapLongest', Math.max(longest, entry.duration))
      }
    }).observe(eventTiming)

    const starts = ['pointerdown', 'keydown', 'change'] as const
    const begin = (event: Event) => {
      start = event.timeStamp
      for (const type of starts) document.removeEventListener(type, begin, { capture: true })
    }
    for (const type of starts) document.addEventListener(type, begin, { capture: true })
    const frame = () => {
      if (!current()) return
      if (start !== null && holds()) {
        Reflect.set(window, '__tapAnswered', performance.now() - start)
        return
      }
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, answer)
}

async function readTap(page: Page): Promise<number> {
  await page.waitForFunction(() => Reflect.get(window, '__tapAnswered') !== null, undefined, {
    timeout: 10_000,
  })
  // Event Timing anota el toque después del pintado: un cuadro y algo más.
  await page.waitForTimeout(200)
  return page.evaluate(() =>
    Math.max(
      Number(Reflect.get(window, '__tapAnswered')),
      Number(Reflect.get(window, '__tapLongest')),
    ),
  )
}

/** Cuánto tardó en verse la respuesta a un toque, en ms, y lo anota en el reporte. */
export async function timeTap(
  page: Page,
  name: string,
  tap: () => Promise<void>,
  answer: Answer[],
): Promise<number> {
  await arm(page, answer)
  await tap()
  const ms = await readTap(page)
  test
    .info()
    .annotations.push({ type: 'rendimiento', description: `${name}: ${Math.round(ms)} ms` })
  return ms
}

/** Falla si el toque pasó los 200 ms, diciendo cuál y por cuánto. */
export function expectAnswered(name: string, ms: number): void {
  expect(
    ms,
    `${name}: ${Math.round(ms)} ms, ${Math.round(ms - TAP_BUDGET_MS)} ms por encima de ${TAP_BUDGET_MS}`,
  ).toBeLessThanOrEqual(TAP_BUDGET_MS)
}

/**
 * Empieza a anotar las tareas largas del hilo de la página y devuelve cómo leer la más larga desde
 * ahí, en ms, anotada con `name`. Un toque que cae en una tarea espera a que termine: la más larga es
 * lo que podría haber tardado el peor de los toques de ese rato, también los que la prueba no llegó
 * a hacer.
 */
export async function watchLongestTask(page: Page): Promise<(name: string) => Promise<number>> {
  await page.evaluate(() => {
    Reflect.set(window, '__longestTask', 0)
    if (Reflect.get(window, '__watchingTasks') === true) return
    Reflect.set(window, '__watchingTasks', true)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const longest = Number(Reflect.get(window, '__longestTask'))
        Reflect.set(window, '__longestTask', Math.max(longest, entry.duration))
      }
    }).observe({ type: 'longtask' })
  })
  return async (name) => {
    const ms = await page.evaluate(() => Number(Reflect.get(window, '__longestTask')))
    test
      .info()
      .annotations.push({ type: 'rendimiento', description: `${name}: ${Math.round(ms)} ms` })
    return ms
  }
}
