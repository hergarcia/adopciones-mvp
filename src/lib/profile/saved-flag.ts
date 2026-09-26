// El aviso dice lo que decía el botón: «Guardar» → «Perfil guardado», «Guardar cambios» →
// «Cambios guardados» (docs/10 §Textos). Quién guardó por primera vez lo sabe la acción, no el
// formulario, así que viaja en la marca.
//
// Y solo se agrega cuando el destino es la pantalla que sabe mostrarla: pegársela a cualquier
// ruta dejaría una marca que nadie lee colgada de la URL.
const SHOWS_CONFIRMATION = '/mi-perfil'

export function withSavedFlag(destination: string, wasComplete: boolean): string {
  if (!destination.startsWith(SHOWS_CONFIRMATION)) return destination

  const separator = destination.includes('?') ? '&' : '?'
  return `${destination}${separator}guardado=${wasComplete ? 'cambios' : 'perfil'}`
}
