import { PetExpiryLine, type ExpiryLine } from '@/components/pets/pet-expiry-line'
import { ShareButton, type ShareTexts } from '@/components/pets/share-button'
import { TakedownNote } from '@/components/pets/takedown-note'
import { LinkButton } from '@/components/ui/link-button'
import { litterPath } from '@/lib/litters/paths'
import type { MyLitter } from '@/lib/litters/types'
import { DeleteLitterDialog } from './delete-litter-dialog'
import { LitterStatusActions, type LitterStatusTexts } from './litter-status-actions'

type Props = {
  litter: Pick<MyLitter, 'id' | 'code' | 'state'>
  returnPath: string
  gateHref: string
  /** Ya traducidos. `takedown`, el motivo de una camada dada de baja; `expiry`, cuándo vence. */
  texts: {
    seeLitter: string
    share: ShareTexts
    takedown: string | null
    expiry: ExpiryLine | null
    status: LitterStatusTexts
  }
}

// Debajo de una camada en «Mis animales» (FR-042 de la #205, FR-014 de la #206), con las formas de
// `MyPetActions`: cuándo vence, la acción que la vuelve a poner a la vista (o «Renovar» si vence
// pronto) en `secondary`, y «Ver ficha», «Compartir» y «Acciones» en `ghost`. Dada de baja no se
// comparte: queda su motivo, su ficha y borrarla (FR-044).
export function MyLitterActions({ litter, returnPath, gateHref, texts }: Props) {
  const { code } = litter
  const seeLitter = (
    <LinkButton href={litterPath(code)} variant="ghost" size="sm">
      {texts.seeLitter}
    </LinkButton>
  )
  if (texts.takedown !== null) {
    return (
      <div className="flex flex-col items-start gap-1 px-1">
        <TakedownNote text={texts.takedown} />
        {seeLitter}
        <DeleteLitterDialog
          litterId={litter.id}
          returnPath={returnPath}
          texts={texts.status.delete}
          triggerVariant="ghost"
        />
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start gap-3 px-1">
      {texts.expiry ? <PetExpiryLine line={texts.expiry} /> : null}
      <LitterStatusActions
        litterId={litter.id}
        state={litter.state}
        layout="card"
        returnPath={returnPath}
        gateHref={gateHref}
        texts={texts.status}
        expiresSoon={texts.expiry?.soon}
        links={
          <>
            {seeLitter}
            <ShareButton
              code={code}
              path={litterPath(code)}
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
