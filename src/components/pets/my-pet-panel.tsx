import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH, editPetPath, petPath } from '@/lib/pets/paths'
import type { ListedCardView, PetSummary } from '@/lib/pets/types'
import { PetExpiryLine, type ExpiryLine } from './pet-expiry-line'
import { PetPastedPhoto } from './pet-pasted-photo'
import { CardStamp } from './pet-status-stamp'
import { PetPhoto } from './pet-photo'
import { PetStatusActions, type PetStatusTexts } from './pet-status-actions'
import { PetWorkLayout } from './pet-work-layout'
import { ShareButton, type ShareTexts } from './share-button'
import { TakedownNote } from './takedown-note'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'

type Props = {
  pet: PetSummary
  /** La foto firmada, su `alt` y su sello, ya armados. */
  photo: Pick<ListedCardView, 'photo' | 'alt' | 'stamp'>
  returnPath: string
  gateHref: string
  /** Ya traducidos. */
  texts: {
    back: string
    seePet: string
    edit: string
    share: ShareTexts
    status: PetStatusTexts
    takedown: string | null
    expiry: ExpiryLine | null
  }
}

// Un animal de «Mis animales» con sus acciones a la vista, sin `Sheet` (research R6): a donde lleva
// «Ya no está disponible» del correo, así que la decisión va primero. La foto chica al lado del
// nombre, que se dice una sola vez, y las acciones en la primera pantalla en los dos anchos. La que
// vuelve a poner el animal a la vista, o «Renovar» cuando vence pronto, es la tirita de la pantalla;
// una dada de baja solo se ve y se borra (FR-006). «Editar» es la única forma de editar.
export function MyPetPanel({ pet, photo, returnPath, gateHref, texts }: Props) {
  const takenDown = pet.state === 'taken_down'
  return (
    <div className="flex flex-col items-start gap-6">
      <LinkButton href={MY_PETS_PATH} variant="ghost" size="sm">
        {texts.back}
      </LinkButton>
      <PetWorkLayout
        photo="small"
        className="w-full"
        head={
          <header className="flex flex-col items-start gap-2">
            <h1 className="afiche text-2xl break-words text-ink">{pet.name}</h1>
            {texts.takedown ? <TakedownNote text={texts.takedown} /> : null}
            {texts.expiry ? <PetExpiryLine line={texts.expiry} /> : null}
          </header>
        }
        picture={
          <PetPastedPhoto
            view={photo}
            stamp={<CardStamp stamp={photo.stamp} />}
            side="left"
            sizes="(min-width: 1024px) 256px, 112px"
            eager
            photo={PetPhoto}
            photoClassName={WALL_PHOTO_FRAME}
          />
        }
      >
        <div className="max-w-[var(--measure)]">
          <PetStatusActions
            petId={pet.id}
            state={pet.state}
            layout="page"
            returnPath={returnPath}
            gateHref={gateHref}
            texts={texts.status}
            expiresSoon={texts.expiry?.soon}
            links={
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <LinkButton href={petPath(pet.code)} variant="ghost">
                  {texts.seePet}
                </LinkButton>
                {takenDown ? null : (
                  <>
                    <ShareButton
                      code={pet.code}
                      from="my_pets"
                      texts={texts.share}
                      variant="ghost"
                    />
                    <LinkButton href={editPetPath(pet.id)} variant="ghost">
                      {texts.edit}
                    </LinkButton>
                  </>
                )}
              </div>
            }
          />
        </div>
      </PetWorkLayout>
    </div>
  )
}
