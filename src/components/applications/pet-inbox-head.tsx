import { TextLink } from '@/components/ui/text-link'
import { INBOX_PATH } from '@/lib/applications/paths'

type Props = {
  /** La ficha del animal, o la de su camada si es una cría. */
  sheetHref: string
  /**
   * Ya traducidos: la vuelta, «Solicitudes por Luna», el enlace a la ficha, la camada de una cría o
   * null, y «Tu pregunta: ¿Tenés patio cerrado?» o null sin pregunta o sin solicitudes (#298).
   */
  texts: {
    back: string
    title: string
    sheet: string
    litter: string | null
    question: string | null
  }
}

// El encabezado de «Solicitudes por Luna»: la pregunta propia va una sola vez, debajo de la ficha,
// así cada renglón de la carpeta trae solo la respuesta.
export function PetInboxHead({ sheetHref, texts }: Props) {
  return (
    <header className="flex flex-col items-start gap-2">
      <TextLink href={INBOX_PATH} prefetch={false}>
        {texts.back}
      </TextLink>
      <h1 className="afiche text-2xl break-words text-ink">{texts.title}</h1>
      {texts.litter === null ? null : (
        <p className="text-sm break-words text-ink-muted">{texts.litter}</p>
      )}
      <TextLink href={sheetHref}>{texts.sheet}</TextLink>
      {texts.question === null ? null : (
        <p className="max-w-[var(--measure)] text-base break-words text-ink">{texts.question}</p>
      )}
    </header>
  )
}
