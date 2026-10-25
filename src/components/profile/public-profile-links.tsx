import { LinkButton } from '@/components/ui/link-button'
import { CopyProfileLink, type CopyProfileLinkTexts } from './copy-profile-link'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; view: string; copy: CopyProfileLinkTexts }
  profileHref: string
  profileUrl: string
}

// «Tu perfil público» en «Mi perfil»: mandar su enlace y verlo como lo ven los demás. Copiar cambia
// algo y va en `secondary`; verlo lleva a otra pantalla y va en `ghost`, al lado. La tirita de la
// pantalla sigue siendo «Editar mi perfil».
export function PublicProfileLinks({ texts, profileHref, profileUrl }: Props) {
  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      <CopyProfileLink url={profileUrl} texts={texts.copy}>
        <LinkButton href={profileHref} variant="ghost" prefetch={false}>
          {texts.view}
        </LinkButton>
      </CopyProfileLink>
    </section>
  )
}
