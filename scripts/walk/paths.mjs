// De ruta a nombre de archivo, de una sola forma declarada: sin la barra inicial, las barras
// internas como guiones, y la raíz como `home`. Quien revisa el diseño consume estos nombres.
export function fileNameFor(route, { desktop = false, hover = false } = {}) {
  const base = route.replace(/^\/+/, '').replaceAll('/', '-') || 'home'
  const suffixes = [desktop ? 'desktop' : null, hover ? 'hover' : null].filter(Boolean)
  return [base, ...suffixes, 'png'].join('.')
}
