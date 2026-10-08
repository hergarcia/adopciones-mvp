import { LinkButton } from '@/components/ui/link-button'

type Props =
  | {
      kind: 'revealed'
      /** El número ya formateado para leerlo. */
      phone: string
      /** La ruta propia de «Abrir WhatsApp», que mide y redirige (research R9). */
      whatsappHref: string
      /** Ya traducidos. */
      texts: { title: string; name: string; phoneLabel: string; whatsapp: string; hint: string }
    }
  | { kind: 'no_phone'; texts: { title: string; name: string; noPhone: string } }

// El contacto de la otra persona (docs/10, `ContactReveal`): aparece al aceptar, con un fade, sobre
// yerba suave —el número es el verificado: es confianza, no acción—, escrito grande para copiarlo, y
// «Abrir WhatsApp» como la tirita. Sin teléfono verificado hoy, lo dice sin número ni botón
// (FR-013). Antes de aceptar no se dibuja nada, ni un hueco.
export function ContactReveal(props: Props) {
  return (
    <section
      aria-labelledby="contacto"
      className="flex flex-col items-start gap-3 border-2 border-primary bg-primary-soft p-4 motion-safe:animate-[fade-in_var(--dur-base)_var(--ease-out)] md:p-6"
    >
      <h2 id="contacto" className="text-sm text-ink-muted">
        {props.texts.title}
      </h2>
      <p className="text-lg font-medium break-words text-ink">{props.texts.name}</p>
      {props.kind === 'no_phone' ? (
        <p className="text-base text-ink">{props.texts.noPhone}</p>
      ) : (
        <>
          <p
            aria-label={props.texts.phoneLabel}
            className="text-2xl font-medium text-ink tabular-nums select-all"
          >
            {props.phone}
          </p>
          <LinkButton
            href={props.whatsappHref}
            variant="tirita"
            size="lg"
            native
            className="w-full md:w-auto"
          >
            {props.texts.whatsapp}
          </LinkButton>
          <p className="text-sm text-ink-muted">{props.texts.hint}</p>
        </>
      )}
    </section>
  )
}
