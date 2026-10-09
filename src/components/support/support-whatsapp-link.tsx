import { textLink } from '@/components/ui/text-link'

type LinkProps = {
  /** La ruta propia del WhatsApp de soporte. */
  href: string
  children: React.ReactNode
  placement?: 'block' | 'inline'
}

// Un `a` del navegador y no un `Link`: la ruta responde con una redirección afuera, que el router no
// puede seguir. En otra pestaña, para que lo elegido y lo escrito sigan acá; sin `noreferrer`, porque
// la ruta mide la pantalla por el `Referer`.
export function SupportWhatsAppLink({ href, children, placement = 'block' }: LinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={textLink({ weight: 'medium', placement })}
    >
      {children}
    </a>
  )
}

type ReplyProps = {
  href: string
  /** La frase entera, con `<link>…</link>` alrededor de lo que va enlazado. */
  template: string
}

// «Si querés que te respondan, escribinos por WhatsApp.»: la frase está entera en los mensajes y se
// parte solo para enlazar su parte. La nombran Opinar, su tope del día y el error de contacto.
export function SupportReply({ href, template }: ReplyProps) {
  const [before = '', rest = ''] = template.split('<link>')
  const [label = '', after = ''] = rest.split('</link>')
  return (
    <>
      {before}
      <SupportWhatsAppLink href={href} placement="inline">
        {label}
      </SupportWhatsAppLink>
      {after}
    </>
  )
}
