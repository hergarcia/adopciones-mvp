export const DEFAULT_DESTINATION = '/mi-perfil'

// El destino llega en un enlace que le mandamos por correo, así que si se acepta cualquier cosa
// esto es un redirect abierto: alguien arma un enlace nuestro que termina en su sitio. Se acepta
// **solo** una ruta de este sitio, escrita como ruta y no como URL (FR-014).
export function safeDestination(candidate: string | null | undefined): string {
  if (!candidate) return DEFAULT_DESTINATION

  // Una sola barra al principio y nada más. `//otro.com` y `/\otro.com` son URLs con host que
  // algunos navegadores siguen igual, así que la segunda posición no puede ser una barra ni una
  // contrabarra.
  if (!candidate.startsWith('/')) return DEFAULT_DESTINATION
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return DEFAULT_DESTINATION

  // Un esquema en el medio (`/redirect?a=javascript:…`) no nos importa porque solo usamos la
  // ruta, pero un carácter de control sí: parte el encabezado de la respuesta.
  //
  // Buscar caracteres de control es justamente el punto, así que la regla va desactivada con su
  // motivo. Escritos como escapes y no como bytes crudos: con los bytes adentro, git trataba el
  // archivo como binario y el linter ni siquiera veía este regex.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/u.test(candidate)) return DEFAULT_DESTINATION

  return candidate
}

// La vuelta a /entrar después de un intento fallido con Google: con el motivo y, si lo había, con
// el destino, para que el segundo intento no lo pierda (FR-013).
export function signInRetryPath(motivo: string, next: string | null | undefined): string {
  const params = new URLSearchParams({ motivo })
  if (next) params.set('next', safeDestination(next))
  return `/entrar?${params}`
}
