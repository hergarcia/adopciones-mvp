import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { PetPhotoData } from '@/lib/pets/types'
import { GalleryPosition } from './gallery-position'
import { PetPhoto } from './pet-photo'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'

// En el teléfono la galería ocupa el ancho, pero se le dice 50vw a propósito: así elige `card` (800 px
// de lado largo, 640 de ancho en una vertical) y no `full`, que con 4G lenta no entra en los 2,5 s
// de la portada (SC-001). Son 1,5 px de foto por px de pantalla, que para una foto alcanza.
const GALLERY_SIZES = '(min-width: 1024px) 560px, 50vw'

type Props = {
  code: string
  photos: PetPhotoData[]
  /** Ya traducidos: el nombre de la tira, y el `alt` y la posición de cada foto, en orden. */
  texts: { label: string; alts: string[]; positions: string[] }
  /** La portada con prioridad: la de la ficha, o la primera de una lista; las demás esperan. */
  lead?: boolean
}

// Las fotos a sangre, hasta el borde de la hoja (docs/10 §Pantallas anchas), en una tira con
// `scroll-snap` que se desplaza igual sin ejecutar nada. La portada primero y con prioridad: es lo
// que mide el LCP. Sin cinta: la galería va a sangre, y un gesto por elemento. Los puntos llevan a
// cada foto con el mouse y el teclado, donde no hay dedo para deslizar. Con una sola foto no hay a
// dónde pasar, así que tampoco puntos.
export function PetGallery({ code, photos, texts, lead = true }: Props) {
  const id = `fotos-${code}`

  return (
    <section aria-label={texts.label}>
      <ul
        id={id}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto"
      >
        {photos.map((photo, index) => (
          <li key={photo.id} className="w-full shrink-0 snap-start">
            <PetPhoto
              source={signedPhotoSource(photo)}
              alt={texts.alts[index]}
              sizes={GALLERY_SIZES}
              eager={lead && index === 0}
              priority={lead && index === 0}
              className={WALL_PHOTO_FRAME}
            />
          </li>
        ))}
      </ul>
      {photos.length > 1 ? <GalleryPosition galleryId={id} labels={texts.positions} /> : null}
    </section>
  )
}
