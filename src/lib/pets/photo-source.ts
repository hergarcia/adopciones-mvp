import { sameOriginStorageUrl } from '@/lib/supabase/storage-rewrite'
import { targetSize } from './photo-sizing'
import { PHOTO_SIDES } from './rules'
import type { PhotoSlot } from './photo-list'
import type { PreparedPhoto } from './photo-processing'
import type { PetPhotoData } from './types'

/** Lo que necesita un `<img>` para dibujar una foto sin salto: la fuente, su ThumbHash y su tamaño. */
export type PhotoSource = {
  src: string
  srcSet?: string
  placeholder: string | null
  width: number
  height: number
}

// Los tres tamaños guardados, con el ancho real de cada uno: una vertical de 1600 de alto no mide
// 1600 de ancho, y el navegador elige mal si se le miente.
export function signedPhotoSource(photo: PetPhotoData): PhotoSource {
  const width = (side: number) => targetSize(photo.width, photo.height, side).width
  const thumb = sameOriginStorageUrl(photo.urls.thumb)
  const card = sameOriginStorageUrl(photo.urls.card)
  const full = sameOriginStorageUrl(photo.urls.full)
  return {
    src: card,
    srcSet: [
      `${thumb} ${width(PHOTO_SIDES.thumb)}w`,
      `${card} ${width(PHOTO_SIDES.card)}w`,
      `${full} ${photo.width}w`,
    ].join(', '),
    placeholder: photo.placeholder,
    width: photo.width,
    height: photo.height,
  }
}

// Las cards de la portada miden a lo sumo 270 px, y en el teléfono y en una pantalla de densidad 2
// el navegador ya elegía este tamaño. Sin las otras dos URLs firmadas, el HTML de la portada entra
// en el primer envío de la conexión, que es lo que más pesa en su LCP (historia #320).
export function cardSizeOnly({ src, placeholder, width, height }: PhotoSource): PhotoSource {
  return { src, placeholder, width, height }
}

/** Una foto ya publicada, puesta en el formulario de editar: subida y sin nada que preparar. */
export function publishedSlot(photo: PetPhotoData): PhotoSlot<PreparedPhoto> {
  return {
    key: photo.id,
    state: 'uploaded',
    photoId: photo.id,
    preview: signedPhotoSource(photo),
    prepared: null,
  }
}
