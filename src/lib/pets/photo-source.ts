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
  return {
    src: photo.urls.card,
    srcSet: [
      `${photo.urls.thumb} ${width(PHOTO_SIDES.thumb)}w`,
      `${photo.urls.card} ${width(PHOTO_SIDES.card)}w`,
      `${photo.urls.full} ${photo.width}w`,
    ].join(', '),
    placeholder: photo.placeholder,
    width: photo.width,
    height: photo.height,
  }
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
