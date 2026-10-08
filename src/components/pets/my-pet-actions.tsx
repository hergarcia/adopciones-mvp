import { HandoverLine } from '@/components/adoptions/handover-line'
import { handoverPath } from '@/lib/adoptions/paths'
import { LinkButton } from '@/components/ui/link-button'
import { TextLink } from '@/components/ui/text-link'
import { petPath } from '@/lib/pets/paths'
import type { PetState } from '@/lib/pets/types'
import { DeletePetDialog } from './delete-pet-dialog'
import { PetExpiryLine, type ExpiryLine } from './pet-expiry-line'
import { PetStatusActions, type PetStatusTexts } from './pet-status-actions'
import { ShareButton, type ShareTexts } from './share-button'
import { TakedownNote } from './takedown-note'

type Props = {
  pet: { id: string; code: string; state: PetState }
  returnPath: string
  /** El aviso de verificación pendiente, con la vuelta a esta pantalla. */
  gateHref: string
  /** Ya traducidos. `takedown`, el motivo de una dada de baja; `expiry`, cuándo vence. */
  texts: {
    seePet: string
    share: ShareTexts
    status: PetStatusTexts
    takedown: string | null
    expiry: ExpiryLine | null
    /** A quién se entregó un adoptado (historia #67). */
    handover: React.ComponentProps<typeof HandoverLine>['texts'] | null
  }
  /** A sus solicitudes: «2 solicitudes nuevas», «Ver solicitudes», o nada sin ninguna (FR-006). */
  inbox: { href: string; label: string } | null
}

// Debajo de cada card de «Mis animales» (FR-014 de la #53): la card sigue abriendo la edición, y acá
// van «Ver ficha», «Compartir» y «Más acciones», en `ghost`: la tirita de la pantalla sigue siendo
// «Publicar un animal». Lo que vuelve a poner a la vista una pausada o una vencida, o «Renovar» cuando
// vence pronto, va primero y a la vista, en `secondary` (US2). Una dada de baja solo se borra
// (FR-006): su motivo y «Borrar».
export function MyPetActions({ pet, returnPath, gateHref, texts, inbox }: Props) {
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
    <div className="flex flex-col items-start gap-3 px-1">
      {texts.handover === null ? null : <HandoverLine texts={texts.handover} />}
      {inbox === null ? null : (
        // Sin prefetch: abrir las de un animal las da por vistas (research R6 de la #65).
        <TextLink href={inbox.href} prefetch={false} weight="medium">
          {inbox.label}
        </TextLink>
      )}
      {texts.expiry ? <PetExpiryLine line={texts.expiry} /> : null}
      <PetStatusActions
        petId={pet.id}
        state={pet.state}
        layout="card"
        returnPath={returnPath}
        handoverHref={handoverPath(pet.id, returnPath)}
        gateHref={gateHref}
        texts={texts.status}
        expiresSoon={texts.expiry?.soon}
        links={
          <>
            <LinkButton href={petPath(pet.code)} variant="ghost" size="sm">
              {texts.seePet}
            </LinkButton>
            <ShareButton
              code={pet.code}
              from="my_pets"
              texts={texts.share}
              variant="ghost"
              size="sm"
            />
          </>
        }
      />
    </div>
  )
}
