// «Guardar cartel» (historia #275): en el teléfono la imagen va a las opciones del sistema, con el
// enlace de la ficha al lado; en la computadora, o si el teléfono no deja mandarla, se descarga.

export type PosterOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed'

export type PosterShare = { files: File[]; title: string; text: string }

type SavePoster = {
  /** La forma principal de usar el equipo es el dedo (`pointer: coarse`), como en «Compartir». */
  coarse: boolean
  /** La imagen armada, o null si el sitio no la pudo armar. */
  load: () => Promise<File | null>
  canShare: (data: PosterShare) => boolean
  share: (data: PosterShare) => Promise<void>
  download: (file: File) => void
  title: string
  /** El enlace de la ficha con la marca del cartel. */
  link: string
}

export async function savePoster(poster: SavePoster): Promise<PosterOutcome> {
  let file: File | null
  try {
    file = await poster.load()
  } catch {
    return 'failed'
  }
  if (file === null) return 'failed'

  const data = { files: [file], title: poster.title, text: poster.link }
  if (poster.coarse && poster.canShare(data)) {
    try {
      await poster.share(data)
      return 'shared'
    } catch (error) {
      // Cerrar las opciones sin elegir no es un error; otra falla (el teléfono no deja mandar la
      // imagen) la descarga.
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    }
  }
  poster.download(file)
  return 'downloaded'
}

/** Solo lo que se mandó o se descargó cuenta como un «Compartir» (decisión 2026-11-01). */
export function countsAsShare(outcome: PosterOutcome): boolean {
  return outcome === 'shared' || outcome === 'downloaded'
}
