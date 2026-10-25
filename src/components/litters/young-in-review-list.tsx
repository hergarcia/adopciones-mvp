import { PetPhoto } from '@/components/pets/pet-photo'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { YoungInReview } from '@/lib/pets/review-types'

export type YoungInReviewTexts = {
  title: string
  /** La que no subió fotos propias: en la ficha muestra las de la camada. */
  noPhotos: string
  /** Por id de cría: su sexo, el nombre de su tira y el `alt` de cada foto. */
  young: Record<string, { sex: string; photosLabel: string; photoAlts: string[] }>
}

type Props = { young: YoungInReview[]; texts: YoungInReviewTexts }

// Las crías de una camada en «Publicaciones por revisar» (FR-043): cada una con su nombre, su sexo,
// lo que se escribió de ella y sus fotos propias en miniatura, que es lo que se revisa de cada una
// sin abrir nada. Una lista y no una pared: se lee de arriba abajo, como el resto del ítem.
export function YoungInReviewList({ young, texts }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-ink">{texts.title}</h3>
      <ul className="flex flex-col">
        {young.map((one) => {
          const own = texts.young[one.id]
          return (
            <li
              key={one.id}
              className="flex flex-col items-start gap-2 border-t-2 border-line py-4 last:pb-0"
            >
              <p className="afiche text-lg break-words text-ink">{one.name}</p>
              <p className="text-sm text-ink-muted">{own?.sex}</p>
              {one.description ? (
                <p className="text-base break-words whitespace-pre-line text-ink">
                  {one.description}
                </p>
              ) : null}
              {one.photos.length === 0 ? (
                <p className="text-sm text-ink-muted">{texts.noPhotos}</p>
              ) : (
                <ul aria-label={own?.photosLabel} className="flex flex-wrap gap-2">
                  {one.photos.map((photo, index) => (
                    <li key={photo.id} className="w-28">
                      <PetPhoto
                        source={signedPhotoSource(photo)}
                        alt={own?.photoAlts[index] ?? ''}
                        sizes="112px"
                        className={`${WALL_PHOTO_FRAME} w-full`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
