import { VouchAction } from './vouch-action'
import type { VouchSheetTexts } from './vouch-sheet'

export type FollowUpVouchTexts = {
  invite: string
  action: string
  vouching: string
  giveSheet: VouchSheetTexts
}

type Props = {
  view: 'invite' | 'vouching'
  texts: FollowUpVouchTexts
  publicId: string
  /** La pantalla del seguimiento, que se vuelve a dibujar con el aval dado. */
  returnPath: string
}

// Debajo del seguimiento respondido, la invitación a avalar a quien adoptó (historia #261), con la
// misma confirmación que el perfil. La acción es `secondary`: la pantalla es de las fotos. Ya dado,
// queda la línea sola; retirarlo sigue siendo desde el perfil.
export function FollowUpVouch({ view, texts, publicId, returnPath }: Props) {
  return (
    <div className="flex flex-col items-start gap-3 border-t-2 border-line pt-4">
      {view === 'vouching' ? (
        <p className="text-base text-ink">{texts.vouching}</p>
      ) : (
        <>
          <p className="max-w-[var(--measure)] text-base text-ink">{texts.invite}</p>
          <VouchAction
            verb="give"
            publicId={publicId}
            returnPath={returnPath}
            origin="follow_up"
            trigger={{ label: texts.action, variant: 'secondary' }}
            texts={texts.giveSheet}
          />
        </>
      )}
    </div>
  )
}
