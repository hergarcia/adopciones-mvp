import { nextEncodeStep } from './identity-photo'

// El procesado en sí, con canvas en el navegador, como la foto de perfil: dibujar y volver a
// exportar **borra los metadatos**, GPS incluido (FR-008a). `imageOrientation: 'from-image'` no es
// opcional: sin eso, la foto de un teléfono queda acostada.
export async function processIdentityPhoto(file: File, name: string): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const output = await fit(bitmap, null, -1, null)
    return new File([output], `${name}.webp`, { type: 'image/webp' })
  } finally {
    bitmap.close()
  }
}

// Una vuelta de la escalera de `nextEncodeStep` por llamada: cada una depende del peso de la
// anterior, así que van de a una.
async function fit(
  bitmap: ImageBitmap,
  lastBytes: number | null,
  lastStep: number,
  last: Blob | null,
): Promise<Blob> {
  const decision = nextEncodeStep(bitmap.width, bitmap.height, lastBytes, lastStep)
  if (decision.kind === 'done' && last !== null) return last
  if (decision.kind !== 'encode') throw new Error('la foto no entra en el tamaño máximo')

  const output = await encode(bitmap, decision.width, decision.height, decision.quality)
  return fit(bitmap, output.size, decision.step, output)
}

async function encode(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('sin contexto 2d')
  context.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', quality)
  })
  // Un navegador sin WebP devuelve PNG en silencio: el servidor lo rechazaría por la firma.
  if (blob === null || blob.type !== 'image/webp') {
    throw new Error('el navegador no pudo exportar la imagen')
  }
  return blob
}
