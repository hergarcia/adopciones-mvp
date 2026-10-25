import { PetPhoto } from '@/components/pets/pet-photo'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { PublicYoung } from '@/lib/litters/types'

const SIZES = '(min-width: 1024px) 270px, (min-width: 768px) 30vw, 45vw'

type Props = {
  young: PublicYoung
  /** Ya traducidos: el sexo y el `alt` de la foto. */
  texts: { sex: string; photoAlt: string }
  /** «Quiero adoptar» o «Ver mi solicitud»; nada para quien la publicó. */
  action: React.ReactNode
}

// Una cría en la ficha de su camada (plan §Ficha de la camada): su portada —la propia, o la de la
// camada si no tiene—, el nombre, el sexo, lo que se escribió de ella y su botón. La foto no abre
// nada: una cría no tiene ficha propia (FR-034). Sin cinta: la foto pegada es la de la camada.
export function YoungCard({ young, texts, action }: Props) {
  const [cover] = young.photos
  return (
    <article className="flex h-full flex-col items-start gap-2">
      {cover === undefined ? null : (
        <PetPhoto
          source={signedPhotoSource(cover)}
          alt={texts.photoAlt}
          sizes={SIZES}
          className={`${WALL_PHOTO_FRAME} w-full`}
        />
      )}
      <h3 className="afiche text-lg break-words text-ink">{young.name}</h3>
      <p className="text-sm text-ink-muted">{texts.sex}</p>
      {young.description ? (
        <p className="text-sm break-words whitespace-pre-line text-ink">{young.description}</p>
      ) : null}
      {/* Al pie de la card: en una fila, los botones quedan alineados escriba lo que escriba cada una. */}
      <div className="mt-auto">{action}</div>
    </article>
  )
}
