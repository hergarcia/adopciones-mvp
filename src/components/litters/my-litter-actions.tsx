import { ShareButton, type ShareTexts } from '@/components/pets/share-button'
import { LinkButton } from '@/components/ui/link-button'
import { litterEditPath, litterPath } from '@/lib/litters/paths'

type Props = {
  litter: { id: string; code: string }
  /** Ya traducidos. */
  texts: { seeLitter: string; share: ShareTexts; edit: string }
}

// Debajo de una camada en «Mis animales» (FR-042), con las mismas formas que `MyPetActions`: la card
// abre la edición, y acá van «Ver ficha», «Compartir» y «Editar», en `ghost`. Una camada no tiene
// las acciones de estado de un animal hasta #206.
export function MyLitterActions({ litter, texts }: Props) {
  const { code } = litter
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
      <LinkButton href={litterEditPath(litter.id)} variant="ghost" size="sm">
        {texts.edit}
      </LinkButton>
    </div>
  )
}
