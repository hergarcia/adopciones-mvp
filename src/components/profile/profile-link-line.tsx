import { CopyProfileLink, type CopyProfileLinkTexts } from './copy-profile-link'

type Props = {
  url: string
  /** Ya traducidos. */
  texts: { line: string; copy: CopyProfileLinkTexts }
}

// En «Mis animales», un solo enlace para pegar en la biografía o en el grupo en vez de uno por
// animal (#238). La página la muestra solo si el perfil ya tiene algún animal a la vista.
export function ProfileLinkLine({ url, texts }: Props) {
  return (
    <div className="flex max-w-[var(--measure)] flex-col items-start gap-3">
      <p className="text-base text-ink">{texts.line}</p>
      <CopyProfileLink url={url} texts={texts.copy} from="my_pets" />
    </div>
  )
}
