import { PetStatusStamp } from '@/components/pets/pet-status-stamp'
import { OpeningLink } from '@/components/ui/opening-link'
import { TextLink, textLink } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'
import type { PetState } from '@/lib/pets/types'
import { QuestionList, type QuestionListTexts } from './question-list'
import { SourceLink, type SourceLinkTexts } from './source-link'

export type QuestionSectionTexts = {
  title: string
  paragraphs: string[]
  /** Lo que se repasa, después de los párrafos que lo presentan. */
  list: QuestionListTexts | null
  /** Junto al dato legal que respaldan; solo en «Qué exige Uruguay». */
  sources: SourceLinkTexts[]
  /** El `id` de la sección, para que un enlace lleve directo a ella. */
  anchor?: string
  /** Los sellos que nombra el título, tal como se ven sobre la foto de un animal. */
  stamps?: { state: PetState; label: string }[]
}

type Props = {
  texts: QuestionSectionTexts
  /** Un bloque que la página toma de otra pantalla, como la escalera de los niveles. */
  children?: React.ReactNode
  /** La aclaración chica debajo del bloque, como la del ejemplo inventado. */
  note?: string
  /** `opensOnce` para «Qué dice cada nivel», cuya apertura se cuenta: se apaga hasta que aparece. */
  more?: { href: string; label: string; prefetch?: boolean; opensOnce?: boolean }
}

export function QuestionSection({ texts, children, note, more }: Props) {
  return (
    <section id={texts.anchor} className="flex scroll-mt-6 flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight text-ink">{texts.title}</h2>
      {texts.stamps && texts.stamps.length > 0 ? (
        <p className="flex flex-wrap gap-4">
          {texts.stamps.map((stamp) => (
            <PetStatusStamp key={stamp.label} state={stamp.state} label={stamp.label} />
          ))}
        </p>
      ) : null}
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
      {more?.opensOnce ? (
        <OpeningLink
          href={more.href}
          prefetch={more.prefetch}
          className={cn(textLink(), 'self-start')}
        >
          {more.label}
        </OpeningLink>
      ) : (
        more && (
          <TextLink href={more.href} prefetch={more.prefetch} className="self-start">
            {more.label}
          </TextLink>
        )
      )}
    </section>
  )
}
