import sharp from 'sharp'
import { SHARE_IMAGE_MAX_BYTES } from '@/lib/pets/rules'

const QUALITIES = [80, 70, 60]

// La salida de `ImageResponse` es PNG y pesa cerca de un mega: vuelve por `sharp` a JPEG, bajando la
// calidad hasta que entra en lo que WhatsApp acepta.
export async function smallJpeg(png: Buffer): Promise<Buffer> {
  let jpeg = png
  for (const quality of QUALITIES) {
    // Cada calidad depende de cuánto pesó la anterior.
    // oxlint-disable-next-line no-await-in-loop
    jpeg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer()
    if (jpeg.length <= SHARE_IMAGE_MAX_BYTES) break
  }
  return jpeg
}
