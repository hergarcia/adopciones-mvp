import { ShareButton, type ShareTexts } from '@/components/pets/share-button'
import { TakedownNote } from '@/components/pets/takedown-note'
import { LinkButton } from '@/components/ui/link-button'
import { litterPath } from '@/lib/litters/paths'

type Props = {
  litter: { code: string }
  /** Ya traducidos. `takedown`, el motivo de una camada dada de baja. */
  texts: { seeLitter: string; share: ShareTexts; takedown: string | null }
}

// Debajo de una camada en «Mis animales» (FR-042), con las mismas formas que `MyPetActions`: la card
// abre la edición, y acá van «Ver ficha» y «Compartir», en `ghost`. Una camada no tiene las acciones
// de estado de un animal hasta #206. Dada de baja no se comparte: queda su motivo y su ficha, que se
// lo dice a su dueña (FR-044).
export function MyLitterActions({ litter, texts }: Props) {
  const { code } = litter
  if (texts.takedown !== null) {
    return (
      <div className="flex flex-col items-start gap-1 px-1">
        <TakedownNote text={texts.takedown} />
        <LinkButton href={litterPath(code)} variant="ghost" size="sm">
          {texts.seeLitter}
        </LinkButton>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
      <LinkButton href={litterPath(code)} variant="ghost" size="sm">
        {texts.seeLitter}
      </LinkButton>
      <ShareButton
        code={code}
        path={litterPath(code)}
        from="my_pets"
        texts={texts.share}
        variant="ghost"
        size="sm"
      />
    </div>
  )
}
