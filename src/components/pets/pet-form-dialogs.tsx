import type { Blocked } from '@/hooks/use-pet-feedback'
import { DuplicateNameDialog } from './duplicate-name-dialog'
import type { PetDialogTexts } from './pet-form-types'
import { SaveBlockedDialog } from './save-blocked-dialog'

type Props = {
  texts: PetDialogTexts
  /** Ya armado; nulo, cerrado. Un animal lo arma con `petDuplicateTitle`; una camada, con el suyo. */
  duplicateTitle: string | null
  blocked: Blocked | null
  hasPhotos: boolean
  busy: boolean
  onPublishAnyway: () => void
  onBackToMyPets: () => void
  onCloseDuplicate: () => void
  onUnblock: () => void
  onCloseBlocked: () => void
}

// El de salir no está acá: va con el guardia, en lo que sale al abrir (`PetLeaveDialog`).
export function PetFormDialogs({ texts, duplicateTitle, blocked, hasPhotos, busy, ...on }: Props) {
  const level = blocked?.kind === 'level'
  return (
    <>
      <DuplicateNameDialog
        open={duplicateTitle !== null}
        title={duplicateTitle ?? ''}
        texts={{ ...texts, body: texts.duplicateBody, photosLost: texts.duplicatePhotosLost }}
        hasPhotos={hasPhotos}
        publishing={busy}
        onPublishAnyway={on.onPublishAnyway}
        onBack={on.onBackToMyPets}
        onClose={on.onCloseDuplicate}
      />
      <SaveBlockedDialog
        open={blocked !== null}
        texts={{
          title: level ? texts.levelTitle : texts.sessionTitle,
          body: level ? texts.levelBody : texts.sessionBody,
          action: level ? texts.verify : texts.signIn,
          stay: texts.stay,
          close: texts.close,
        }}
        onAction={on.onUnblock}
        onStay={on.onCloseBlocked}
      />
    </>
  )
}
