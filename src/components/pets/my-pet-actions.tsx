import { LinkButton } from '@/components/ui/link-button'
import { petPath } from '@/lib/pets/paths'
import type { PetState } from '@/lib/pets/types'
import { DeletePetDialog } from './delete-pet-dialog'
import { PetStatusActions, type PetStatusTexts } from './pet-status-actions'
import { ShareButton, type ShareTexts } from './share-button'
import { TakedownNote } from './takedown-note'

type Props = {
  pet: { id: string; code: string; state: PetState }
  returnPath: string
  /** El aviso de verificación pendiente, con la vuelta a esta pantalla. */
  gateHref: string
  /** Ya traducidos. `takedown`, el motivo de una dada de baja. */
  texts: { seePet: string; share: ShareTexts; status: PetStatusTexts; takedown: string | null }
}

// Debajo de cada card de «Mis animales» (FR-014 de la #53): la card sigue abriendo la edición, y acá
// van «Ver ficha», «Compartir» y «Más acciones», en `ghost`: la tirita de la pantalla sigue siendo
// «Publicar un animal». Una dada de baja solo se borra (FR-006): su motivo y «Borrar».
export function MyPetActions({ pet, returnPath, gateHref, texts }: Props) {
  if (pet.state === 'taken_down') {
    return (
      <div className="flex flex-col items-start gap-1 px-1">
        {texts.takedown ? <TakedownNote text={texts.takedown} /> : null}
        <DeletePetDialog
          petId={pet.id}
          returnPath={returnPath}
          texts={texts.status.delete}
          triggerVariant="ghost"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
      <LinkButton href={petPath(pet.code)} variant="ghost" size="sm">
        {texts.seePet}
      </LinkButton>
      <ShareButton code={pet.code} from="my_pets" texts={texts.share} variant="ghost" size="sm" />
      <PetStatusActions
        petId={pet.id}
        state={pet.state}
        layout="sheet"
        returnPath={returnPath}
        gateHref={gateHref}
        texts={texts.status}
      />
    </div>
  )
}
