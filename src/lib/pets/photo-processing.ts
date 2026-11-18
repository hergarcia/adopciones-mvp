import { rgbaToThumbHash } from 'thumbhash'
import { encodingPlan, targetSize } from './photo-sizing'
import { PHOTO_SIDES, THUMBHASH_SIDE } from './rules'

export type PhotoSizeName = keyof typeof PHOTO_SIDES
export type PreparedPhoto = {
  files: Record<PhotoSizeName, File>
  /** Del tamaño `full`, para reservar el lugar sin salto. */
  width: number
  height: number
  thumbhash: string
}

const SIZE_NAMES = ['thumb', 'card', 'full'] as const satisfies readonly PhotoSizeName[]

/** Un canvas de la página o uno de un worker: lo que hace falta para dibujar y leer los píxeles. */
export type PhotoCanvas = {
  width: number
  height: number
  getContext(contextId: '2d'): Pick<CanvasRenderingContext2D, 'getImageData' | 'drawImage'> | null
}

/** Dónde se dibuja y cómo se exporta a WebP: en la página, o en un worker (historia #313). */
export type PhotoTools<C extends PhotoCanvas> = {
  canvas: (width: number, height: number) => C
  webp: (canvas: C, quality: number) => Promise<Blob>
}

function draw<C extends PhotoCanvas>(
  tools: PhotoTools<C>,
  bitmap: ImageBitmap,
  longSide: number,
): C {
  const { width, height } = targetSize(bitmap.width, bitmap.height, longSide)
  const canvas = tools.canvas(width, height)
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('sin contexto 2d')
  context.drawImage(bitmap, 0, 0, width, height)
  return canvas
}

function thumbhashOf<C extends PhotoCanvas>(tools: PhotoTools<C>, bitmap: ImageBitmap): string {
  const canvas = draw(tools, bitmap, THUMBHASH_SIDE)
  const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height)
  if (pixels === undefined) throw new Error('sin contexto 2d')
  const hash = rgbaToThumbHash(canvas.width, canvas.height, pixels.data)
  return btoa(String.fromCharCode(...hash))
}

// El pegamento con el canvas, sin decisiones propias: esas están en photo-sizing.ts. Dibujar en un
// canvas y volver a exportar borra los metadatos —GPS y cámara incluidos— y `from-image` respeta la
// orientación del teléfono (FR-008). El archivo se llama como su tamaño: el nombre original no sale
// del navegador. Corre igual en la página y en un worker; cambian el canvas y cómo exporta.
export async function preparePhoto<C extends PhotoCanvas>(
  file: Blob,
  tools: PhotoTools<C>,
): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const canvases = SIZE_NAMES.map((name) => draw(tools, bitmap, PHOTO_SIDES[name]))
    const encoded = new Map<number, Blob[]>()
    const quality = await encodingPlan(async (candidate) => {
      const blobs = await Promise.all(canvases.map((canvas) => tools.webp(canvas, candidate)))
      encoded.set(candidate, blobs)
      return blobs.map((blob) => blob.size)
    })
    const blobs = quality === null ? undefined : encoded.get(quality)
    if (blobs === undefined)
      throw new Error('la foto no entra en el tope aun con la calidad más baja')

    const sized = (index: number) =>
      new File([blobs[index]], `${SIZE_NAMES[index]}.webp`, { type: 'image/webp' })
    const full = canvases[2]
    return {
      files: { thumb: sized(0), card: sized(1), full: sized(2) },
      width: full.width,
      height: full.height,
      thumbhash: thumbhashOf(tools, bitmap),
    }
  } finally {
    bitmap.close()
  }
}
