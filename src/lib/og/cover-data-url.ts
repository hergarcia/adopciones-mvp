import sharp from 'sharp'

/**
 * La portada a la medida de una imagen armada en el servidor, como data URL, o null si no se pudo
 * bajar. `next/og` no decodifica WebP, así que pasa por `sharp` a JPEG; si no llegó en la proporción
 * pedida, se recorta sin deformarla, conservando la parte de arriba, donde suele estar la cara.
 */
export async function coverDataUrl(
  url: string,
  size: { width: number; height: number },
): Promise<string | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize({ ...size, fit: 'cover', position: 'top' })
    .jpeg({ quality: 90 })
    .toBuffer()
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`
}
