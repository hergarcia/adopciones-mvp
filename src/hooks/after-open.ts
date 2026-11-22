// Lo que solo hace falta después de un toque baja apenas la pantalla abrió, sin esperar el toque
// (docs/07 §Presupuesto, historia #95): después de `load`, que ya trajo la foto principal, y del
// primer respiro del navegador, a más tardar 1 s después. Safari no tiene `requestIdleCallback`.
function opened(): Promise<void> {
  return new Promise((resolve) => {
    const idle = () => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => resolve(), { timeout: 1_000 })
      } else {
        setTimeout(resolve, 0)
      }
    }
    if (document.readyState === 'complete') idle()
    else window.addEventListener('load', idle, { once: true })
  })
}

// Lo primero no frena lo demás más que esto, aunque no llegue (historia #338).
const FIRST_WAIT_MS = 3_000

let first: Promise<unknown> = Promise.resolve()

export function afterOpen(): Promise<void> {
  return opened()
    .then(() => Promise.race([first, new Promise((resolve) => setTimeout(resolve, FIRST_WAIT_MS))]))
    .then(() => undefined)
}

/**
 * Lo que la pantalla necesita primero después de abrir, como los campos de un formulario: baja apenas
 * abre, y lo demás que espera a `afterOpen` arranca cuando llegó (o falló), así no se reparten la
 * señal. Con el teléfono emulado, los campos de editar a Luna se veían 2,6 s después de abrir,
 * repartidos con las reglas de zod y las capas (historia #338).
 */
export function firstAfterOpen<T>(load: () => Promise<T>): Promise<T> {
  const loading = opened().then(load)
  const previous = first
  first = Promise.all([previous, loading.catch(() => undefined)])
  return loading
}
