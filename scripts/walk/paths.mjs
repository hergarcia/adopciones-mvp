// De ruta a nombre de archivo, de una sola forma declarada: sin la barra inicial, las barras
// internas como guiones, y la raíz como `home`. Quien revisa el diseño consume estos nombres.
//
// La query se conserva porque distingue pantallas —la misma ruta con `?motivo=` es otro estado—
// pero `?`, `&` y `=` no son caracteres válidos en un nombre de archivo en Windows, así que la
// parte de la query viaja con guiones.
export function fileNameFor(route, { desktop = false, hover = false } = {}) {
  const [path, query] = route.split('?')
  const base = path.replace(/^\/+/, '').replaceAll('/', '-') || 'home'
  const tail = query ? `-${query.replaceAll(/[?&=]/g, '-')}` : ''
  const suffixes = [desktop ? 'desktop' : null, hover ? 'hover' : null].filter(Boolean)
  return [`${base}${tail}`, ...suffixes, 'png'].join('.')
}
