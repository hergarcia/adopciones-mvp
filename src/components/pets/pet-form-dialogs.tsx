import { LeavingDialog } from '@/components/forms/leaving-dialog'
import { DuplicateNameDialog } from './duplicate-name-dialog'
import type { PetDialogTexts } from './pet-form-types'
import { SaveBlockedDialog } from './save-blocked-dialog'

export type Blocked = { kind: 'session' } | { kind: 'level'; gatePath: string }
export type Duplicate = { name: string; sex: string; species: string }

type Props = {
  texts: PetDialogTexts
  leaving: boolean
  duplicate: Duplicate | null
  blocked: Blocked | null
  hasPhotos: boolean
  busy: boolean
  onStay: () => void
  onLeave: () => void
  onPublishAnyway: () => void
  onBackToMyPets: () => void
  onCloseDuplicate: () => void
  onUnblock: () => void
  onCloseBlocked: () => void
}

// Los tres avisos del formulario: salir con lo cargado, el nombre repetido y el guardado que no se
// puede hacer sin entrar o sin verificar.
export function PetFormDialogs({
  texts,
  leaving,
  duplicate,
  blocked,
  hasPhotos,
  busy,
  ...on
}: Props) {
  const level = blocked?.kind === 'level'
  return (
    <>
      <LeavingDialog
        open={leaving}
        texts={{
          title: texts.leavingTitle,
          body: texts.leavingBody,
          stay: texts.leavingStay,
          leave: texts.leavingLeave,
          close: texts.close,
        }}
        onStay={on.onStay}
        onLeave={on.onLeave}
      />
      <DuplicateNameDialog
        open={duplicate !== null}
        title={(texts.duplicate[`${duplicate?.species}_${duplicate?.sex}`] ?? '').replace(
          '{name}',
          duplicate?.name.trim() ?? '',
        )}
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
