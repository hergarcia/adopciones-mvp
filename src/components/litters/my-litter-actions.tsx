import { ShareButton, type ShareTexts } from '@/components/pets/share-button'
import { LinkButton } from '@/components/ui/link-button'
import { litterPath } from '@/lib/litters/paths'

type Props = {
  code: string
  /** Ya traducidos. */
  texts: { seeLitter: string; share: ShareTexts }
}

// Debajo de una camada en «Mis animales» (FR-042), con las mismas formas que `MyPetActions`: la card
// abre la edición, y acá van «Ver ficha» y «Compartir», en `ghost`.
export function MyLitterActions({ code, texts }: Props) {
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
