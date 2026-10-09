import { TextLink } from '@/components/ui/text-link'
import { QuestionList, type QuestionListTexts } from './question-list'
import { SourceLink, type SourceLinkTexts } from './source-link'

export type QuestionSectionTexts = {
  title: string
  paragraphs: string[]
  /** Lo que se repasa, después de los párrafos que lo presentan. */
  list: QuestionListTexts | null
  /** Junto al dato legal que respaldan; solo en «Qué exige Uruguay». */
  sources: SourceLinkTexts[]
}

type Props = {
  texts: QuestionSectionTexts
  /** Un bloque que la página toma de otra pantalla, como la escalera de los niveles. */
  children?: React.ReactNode
  /** La aclaración chica debajo del bloque, como la del ejemplo inventado. */
  note?: string
  more?: { href: string; label: string }
}

export function QuestionSection({ texts, children, note, more }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight text-ink">{texts.title}</h2>
      {texts.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-base text-ink">
          {paragraph}
        </p>
      ))}
      {texts.list && <QuestionList list={texts.list} />}
      {texts.sources.length > 0 && (
        <ul className="flex flex-col gap-2">
          {texts.sources.map((source) => (
            <li key={source.href}>
              <SourceLink source={source} />
            </li>
          ))}
        </ul>
      )}
      {children}
      {note && <p className="text-sm text-ink-muted">{note}</p>}
      {more && (
        <TextLink href={more.href} className="self-start">
          {more.label}
        </TextLink>
      )}
    </section>
  )
}
