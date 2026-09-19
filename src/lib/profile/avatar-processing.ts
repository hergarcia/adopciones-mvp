import { AVATAR_SIZE, squareCrop } from './avatar'

// El procesado en sí: canvas, en el navegador. Dibujar en un canvas y volver a exportar **borra
// los metadatos**, GPS incluido, que es lo que manda docs/08 §Encontrable; no es un efecto
// colateral afortunado, es el motivo de hacerlo acá y no en el servidor.
export async function processAvatar(file: File): Promise<File> {
  // `imageOrientation: 'from-image'` no es opcional: sin eso, canvas ignora la orientación EXIF y
  // la foto de un teléfono queda acostada.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const { x, y, side } = squareCrop(bitmap.width, bitmap.height)

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE

  const context = canvas.getContext('2d')
  if (context === null) throw new Error('sin contexto 2d')
  context.drawImage(bitmap, x, y, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.85)
  })
  if (blob === null) throw new Error('el navegador no pudo exportar la imagen')

  return new File([blob], 'avatar.webp', { type: 'image/webp' })
}
