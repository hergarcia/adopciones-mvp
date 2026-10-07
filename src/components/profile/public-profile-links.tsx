import { LinkButton } from '@/components/ui/link-button'
import { CopyProfileLink, type CopyProfileLinkTexts } from './copy-profile-link'

type Props = {
  /** Ya traducidos. */
  texts: { title: string; view: string; copy: CopyProfileLinkTexts }
  profileHref: string
  profileUrl: string
  /** «Mis avales» con cuántos la avalan hoy, así un aval nuevo se nota sin entrar (FR-022). */
  vouches: { href: string; label: string }
  /** «Mis bloqueos» (historia #13), debajo de «Mis avales». */
  blocks: { href: string; label: string }
  /** «Mis solicitudes» (historia #63), la otra carpeta de la persona, al final. */
  applications: { href: string; label: string }
  /** «Solicitudes» (historia #65): las que le llegan por sus animales, al lado de las que mandó. */
  inbox: { href: string; label: string }
}

// «Tu perfil público» en «Mi perfil»: verlo como lo ven los demás, copiar su enlace y llegar a sus
// avales y a sus bloqueos. Todo en `secondary` o `ghost`: la tirita de la pantalla sigue siendo «Editar mi perfil».
export function PublicProfileLinks({
  texts,
  profileHref,
  profileUrl,
  vouches,
  blocks,
  applications,
  inbox,
}: Props) {
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
      <LinkButton href={blocks.href} variant="ghost">
        {blocks.label}
      </LinkButton>
      <LinkButton href={applications.href} variant="ghost">
        {applications.label}
      </LinkButton>
      {/* Sin prefetch: abrirla da por vistas las solicitudes de cada animal (research R6). */}
      <LinkButton href={inbox.href} variant="ghost" prefetch={false}>
        {inbox.label}
      </LinkButton>
    </section>
  )
}
