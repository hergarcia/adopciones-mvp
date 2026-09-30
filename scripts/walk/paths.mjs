// De ruta a nombre de archivo, de una sola forma declarada: sin la barra inicial, las barras
// internas como guiones, y la raíz como `home`. Quien revisa el diseño consume estos nombres.
//
// La query se conserva porque distingue pantallas —la misma ruta con `?motivo=` es otro estado—
// pero `?`, `&` y `=` no son caracteres válidos en un nombre de archivo en Windows, así que la
// parte de la query viaja con guiones, y también `/`, que abriría una carpeta.
export function fileNameFor(route, { desktop = false, hover = false, open } = {}) {
  const [path, query] = route.split('?')
  const base = path.replace(/^\/+/, '').replaceAll('/', '-') || 'home'
  const tail = query ? `-${query.replaceAll(/[?&=/]/g, '-')}` : ''
  const suffixes = [
    desktop ? 'desktop' : null,
    open ? `open-${slugOf(open)}` : null,
    hover ? 'hover' : null,
  ].filter(Boolean)
  return [`${base}${tail}`, ...suffixes, 'png'].join('.')
}

// «Ver 45 personas más» → `ver-45-personas-mas`: sin tildes ni signos, que Windows no siempre acepta.
function slugOf(text) {
  return text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
}
