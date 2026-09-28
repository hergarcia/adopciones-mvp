import { nextEncodeStep, PROCESSED_PHOTO_TYPES, type ProcessedPhotoType } from './identity-photo'

const EXTENSION: Record<ProcessedPhotoType, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg' }

type Encoded = { blob: Blob; type: ProcessedPhotoType }

// El procesado en sí, con canvas en el navegador, como la foto de perfil: dibujar y volver a
// exportar **borra los metadatos**, GPS incluido (FR-008a). `imageOrientation: 'from-image'` no es
// opcional: sin eso, la foto de un teléfono queda acostada.
export async function processIdentityPhoto(file: File, name: string): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { blob, type } = await fit(bitmap, null, -1, null)
    return new File([blob], `${name}.${EXTENSION[type]}`, { type })
  } finally {
    bitmap.close()
  }
}

// Una vuelta de la escalera de `nextEncodeStep` por llamada: cada una depende del peso de la
// anterior, así que van de a una. El formato se elige en la primera y ya no cambia.
async function fit(
  bitmap: ImageBitmap,
  lastBytes: number | null,
  lastStep: number,
  last: Encoded | null,
): Promise<Encoded> {
  const decision = nextEncodeStep(bitmap.width, bitmap.height, lastBytes, lastStep)
  if (decision.kind === 'done' && last !== null) return last
  if (decision.kind !== 'encode') throw new Error('la foto no entra en el tamaño máximo')

  const output = await encode(bitmap, decision, last === null ? PROCESSED_PHOTO_TYPES : [last.type])
  return fit(bitmap, output.blob.size, decision.step, output)
}

async function encode(
  bitmap: ImageBitmap,
  { width, height, quality }: { width: number; height: number; quality: number },
  formats: readonly ProcessedPhotoType[],
): Promise<Encoded> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('sin contexto 2d')
  context.drawImage(bitmap, 0, 0, width, height)

  return exportAs(canvas, formats, quality)
}

// Un navegador que no sabe exportar un formato devuelve PNG en silencio, y un PNG no se guardaría:
// se prueba el siguiente.
async function exportAs(
  canvas: HTMLCanvasElement,
  [type, ...rest]: readonly ProcessedPhotoType[],
  quality: number,
): Promise<Encoded> {
  if (type === undefined) throw new Error('el navegador no pudo exportar la imagen')
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (blob !== null && blob.type === type) return { blob, type }
  return exportAs(canvas, rest, quality)
}
