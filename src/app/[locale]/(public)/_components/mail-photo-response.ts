import sharp from 'sharp'

// El doble de los 96 px del renglón del correo, para que se vea nítida en un teléfono.
const MAIL_PHOTO_SIDE = 192

/**
 * La portada sola, cuadrada y en JPEG, para el renglón del correo de avisos (#267), o un 404 si no
 * se pudo bajar. JPEG porque hay programas de correo que no muestran WebP; recortada desde arriba,
 * como la imagen de compartir, porque ahí suele estar la cara.
 */
export async function mailPhotoResponse(coverUrl: string): Promise<Response> {
  const cover = await fetch(coverUrl)
  if (!cover.ok) return new Response(null, { status: 404 })
  const jpeg = await sharp(Buffer.from(await cover.arrayBuffer()))
    .resize({ width: MAIL_PHOTO_SIDE, height: MAIL_PHOTO_SIDE, fit: 'cover', position: 'top' })
    .jpeg({ quality: 80 })
    .toBuffer()
  // Sin caché: cuando el animal sale del listado, la foto deja de verse (docs/03 §3, #267).
  return new Response(new Uint8Array(jpeg), {
    headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' },
  })
}
