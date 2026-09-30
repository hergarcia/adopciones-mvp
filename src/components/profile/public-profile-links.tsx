import { LinkButton } from '@/components/ui/link-button'
import { CopyProfileLink, type CopyProfileLinkTexts } from './copy-profile-link'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; view: string; copy: CopyProfileLinkTexts }
  profileHref: string
  profileUrl: string
  /** «Mis avales» con cuántos la avalan hoy, así un aval nuevo se nota sin entrar (FR-022). */
  vouches: { href: string; label: string }
}

// «Tu perfil público» en «Mi perfil»: verlo como lo ven los demás, copiar su enlace y llegar a sus
// avales. Todo en `secondary` o `ghost`: la tirita de la pantalla sigue siendo «Editar mi perfil».
export function PublicProfileLinks({ texts, profileHref, profileUrl, vouches }: Props) {
  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      <LinkButton href={profileHref} variant="secondary" prefetch={false}>
        {texts.view}
      </LinkButton>
      <CopyProfileLink url={profileUrl} texts={texts.copy} />
      <LinkButton href={vouches.href} variant="ghost">
        {vouches.label}
      </LinkButton>
    </section>
  )
}
