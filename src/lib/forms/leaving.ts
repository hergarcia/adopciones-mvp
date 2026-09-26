// Qué clics hay que frenar cuando un formulario tiene cambios sin guardar (FR-023).
//
// `beforeunload` solo cubre irse del sitio: cerrar la pestaña, recargar, escribir otra dirección.
// Un enlace nuestro no descarga nada, navega del lado del cliente, y ahí el navegador no pregunta
// nada: lo escrito se pierde sin un aviso. Esto decide, mirando solo datos, si ese clic iba a
// tirar el formulario abajo.

export type LinkClick = {
  /** El `href` del enlace más cercano al clic, tal como está escrito, o null si no había enlace. */
  href: string | null
  target: string | null
  download: boolean
  /** 0 es el botón principal; el del medio abre otra pestaña y deja esta como está. */
  button: number
  /** Con Ctrl, Cmd, Shift o Alt el navegador abre al lado en vez de salir de acá. */
  modified: boolean
  defaultPrevented: boolean
  /** El enlace está marcado como una salida que no pierde nada: lo escrito ya quedó a salvo. */
  keepsWork: boolean
}

export function destinationLeavingPage(click: LinkClick, currentUrl: string): string | null {
  if (click.href === null) return null
  if (click.defaultPrevented) return null
  if (click.keepsWork) return null
  if (click.button !== 0) return null
  if (click.modified) return null
  if (click.download) return null
  if (click.target !== null && click.target !== '' && click.target !== '_self') return null

  const here = new URL(currentUrl)
  let destination: URL
  try {
    destination = new URL(click.href, currentUrl)
  } catch {
    return null
  }

  // Otro sitio sí es una salida, pero de las que `beforeunload` ya atiende. Preguntar acá también
  // sería preguntar dos veces por el mismo clic.
  if (destination.origin !== here.origin) return null

  // Un ancla dentro de la misma pantalla no se lleva nada puesto.
  if (destination.pathname === here.pathname && destination.search === here.search) return null

  return `${destination.pathname}${destination.search}${destination.hash}`
}
