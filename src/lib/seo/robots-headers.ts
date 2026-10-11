type HeaderRule = { source: string; headers: { key: string; value: string }[] }

// Además del `robots` de cada pantalla: así tampoco queda guardable una pantalla que se olvidó el
// suyo, una imagen o una ruta de la API (research R12). Los lectores de vista previa no lo leen
// para armar la tarjeta, así que la ficha compartida sigue llegando con foto (FR-002).
export function robotsHeaders(indexing: boolean): HeaderRule[] {
  if (indexing) return []
  return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
}
