import { getTranslations } from 'next-intl/server'
import { SupportWhatsAppLink } from '@/components/support/support-whatsapp-link'
import { SUPPORT_WHATSAPP } from '@/lib/config'
import {
  footerGroups,
  type FooterGroup as Group,
  type FooterLinkId,
  type FooterScope,
} from '@/lib/footer/groups'
import { supportWhatsAppHref } from '@/lib/support/whatsapp'
import { BrandSignature } from './brand-signature'
import { FooterLink } from './footer-link'

type Props = {
  scope: FooterScope
}

// El pie de todas las pantallas (docs/10, decisiones 2026-10-20 de la historia #200): Animales,
// Confianza y Ayuda, cada grupo con su nombre, y la firma del cartel al final. Sobre piedra, separado
// por el divisor entre planos; no es la línea punteada, que es la perforación de la tirita de la
// pantalla, y del pie no se arranca nada.
export async function SiteFooter({ scope }: Props) {
  const t = await getTranslations('footer')
  const groups = footerGroups({ scope, supportHref: supportWhatsAppHref(SUPPORT_WHATSAPP) })
  return (
    // Desde 1024, una banda: los grupos miden lo que sus enlaces y la firma cierra el renglón a la
    // derecha, como al pie de un cartel. En tres tercios cada lista dejaba 200 px en blanco y la
    // firma quedaba sola en un renglón abajo.
    <footer className="flex flex-col gap-10 border-t-2 border-line bg-surface px-gutter py-8 md:px-gutter-wide lg:flex-row lg:items-end lg:justify-between lg:gap-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-16">
        {groups.map((group) => (
          <FooterGroup
            key={group.id}
            group={group}
            title={t(`groups.${group.id}`)}
            label={(id) => t(`links.${id}`)}
          />
        ))}
      </div>
      {/* Del alto de un enlace, para que la firma quede centrada con el último renglón de enlaces. */}
      <div className="flex shrink-0 lg:min-h-11 lg:items-center">
        <BrandSignature />
      </div>
    </footer>
  )
}

type GroupProps = {
  group: Group
  title: string
  label: (id: FooterLinkId) => string
}

// Un solo pie por pantalla: el `id` del encabezado puede ser fijo por grupo.
function FooterGroup({ group, title, label }: GroupProps) {
  const headingId = `footer-${group.id}`
  return (
    <div>
      <h2 id={headingId} className="afiche text-lg text-ink">
        {title}
      </h2>
      <ul aria-labelledby={headingId} className="mt-2 flex flex-col">
        {group.links.map((link) => (
          <li key={link.id}>
            {link.external ? (
              <SupportWhatsAppLink href={link.href}>{label(link.id)}</SupportWhatsAppLink>
            ) : (
              <FooterLink href={link.href}>{label(link.id)}</FooterLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
