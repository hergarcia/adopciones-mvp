// Lo que solo hace falta después de un toque baja apenas la pantalla abrió, sin esperar el toque
// (docs/07 §Presupuesto, historia #95): después de `load`, que ya trajo la foto principal, y del
// primer respiro del navegador, a más tardar 1 s después. Safari no tiene `requestIdleCallback`.
export function afterOpen(): Promise<void> {
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
