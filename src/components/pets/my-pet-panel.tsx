import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH, editPetPath, petPath } from '@/lib/pets/paths'
import type { ListedCardView, PetSummary } from '@/lib/pets/types'
import { PetCard } from './pet-card'
import { PetStatusActions, type PetStatusTexts } from './pet-status-actions'
import { ShareButton, type ShareTexts } from './share-button'
import { TakedownNote } from './takedown-note'

type Props = {
  pet: PetSummary
  /** La card ya armada, con su sello. */
  card: ListedCardView
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
  }
}

// Un animal de «Mis animales» con sus acciones a la vista, sin `Sheet` (research R6): a donde lleva
// «Ya no está disponible» del correo. La acción que vuelve a poner el animal a la vista es la tirita
// de la pantalla; una dada de baja solo se ve y se borra (FR-006).
export function MyPetPanel({ pet, card, returnPath, gateHref, texts }: Props) {
  const takenDown = pet.state === 'taken_down'
  return (
    <div className="flex max-w-[var(--measure)] flex-col items-start gap-6">
      <LinkButton href={MY_PETS_PATH} variant="ghost" size="sm">
        {texts.back}
      </LinkButton>
      <h1 className="afiche text-2xl break-words text-ink">{pet.name}</h1>
      <div className="w-full max-w-xs">
        <PetCard view={card} index={0} sizes="320px" />
      </div>
      {texts.takedown ? <TakedownNote text={texts.takedown} /> : null}
      <PetStatusActions
        petId={pet.id}
        state={pet.state}
        layout="page"
        returnPath={returnPath}
        gateHref={gateHref}
        texts={texts.status}
        links={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <LinkButton href={petPath(pet.code)} variant="ghost">
              {texts.seePet}
            </LinkButton>
            {takenDown ? null : (
              <>
                <ShareButton code={pet.code} from="my_pets" texts={texts.share} variant="ghost" />
                <LinkButton href={editPetPath(pet.id)} variant="ghost">
                  {texts.edit}
                </LinkButton>
              </>
            )}
          </div>
        }
      />
    </div>
  )
}
