import { LinkButton } from '@/components/ui/link-button'
import { petPath } from '@/lib/pets/paths'
import { ShareButton, type ShareTexts } from './share-button'

type Props = {
  code: string
  /** Ya traducidos. */
  texts: { seePet: string; share: ShareTexts }
}

// Debajo de cada card de «Mis animales» (FR-014): la card sigue abriendo la edición, y acá van «Ver
// ficha» y «Compartir», en `ghost`: la tirita de la pantalla sigue siendo «Publicar un animal» y,
// sin nivel 1, «Compartir» pesa menos que «Confirmar mi teléfono» del aviso (FR-020).
export function MyPetActions({ code, texts }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
      <LinkButton href={petPath(code)} variant="ghost" size="sm">
        {texts.seePet}
      </LinkButton>
      <ShareButton code={code} from="my_pets" texts={texts.share} variant="ghost" size="sm" />
    </div>
  )
}
