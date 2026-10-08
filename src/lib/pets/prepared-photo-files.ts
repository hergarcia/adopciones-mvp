import { MAX_PHOTO_FILE_BYTES, MAX_PREPARED_PHOTO_BYTES } from './rules'

/** El ThumbHash en base64 que manda el navegador con cada foto preparada. */
export const THUMBHASH_PATTERN = /^[A-Za-z0-9+/]{1,62}={0,2}$/u

const SIZES = ['thumb', 'card', 'full'] as const
const RIFF = [0x52, 0x49, 0x46, 0x46]
const WEBP = [0x57, 0x45, 0x42, 0x50]

export type PreparedPhotoFiles = Record<(typeof SIZES)[number], File>

// La firma del archivo y no solo el tipo que declara el navegador: lo que sube el servicio tiene
// que ser de verdad un WebP (research R1 de la #53). Byte a byte y no como texto: entre las dos
// marcas va el tamaño del archivo, y decodificado como UTF-8 puede juntar dos bytes en un carácter
// y correrlas.
async function isWebp(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  return (
    RIFF.every((byte, index) => head[index] === byte) &&
    WEBP.every((byte, index) => head[index + 8] === byte)
  )
}

/** Los tres tamaños de una foto preparada en el navegador, o null si alguno no sirve. */
export async function preparedPhotoFiles(form: FormData): Promise<PreparedPhotoFiles | null> {
  const files = SIZES.map((size) => form.get(size))
  if (!files.every((file) => file instanceof File)) return null
  const total = files.reduce((sum, file) => sum + file.size, 0)
  const valid = files.every(
    (file) => file.type === 'image/webp' && file.size > 0 && file.size <= MAX_PHOTO_FILE_BYTES,
  )
  if (!valid || total > MAX_PREPARED_PHOTO_BYTES) return null
  if (!(await Promise.all(files.map(isWebp))).every(Boolean)) return null
  return { thumb: files[0], card: files[1], full: files[2] }
}
