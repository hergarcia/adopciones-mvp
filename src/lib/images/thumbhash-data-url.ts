import { thumbHashToDataURL } from 'thumbhash'

/** El ThumbHash guardado en base64, como data URL para el fondo de una foto que todavía carga. */
export function thumbHashDataUrl(thumbhash: string): string {
  return thumbHashToDataURL(Uint8Array.from(atob(thumbhash), (char) => char.charCodeAt(0)))
}
