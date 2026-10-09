import { TextLink } from '@/components/ui/text-link'

type Link = { href: string; label: string }

export type RelatedQuestionsTexts = { title: string; links: Link[]; toIndex: Link }

// Sin `prefetch`: abrir una página la cuenta, y traerla por adelantado contaría una que nadie abrió.
export function RelatedQuestions({ texts }: { texts: RelatedQuestionsTexts }) {
  if (texts.links.length === 0) {
    return (
      <TextLink href={texts.toIndex.href} prefetch={false}>
        {texts.toIndex.label}
      </TextLink>
    )
  }
  return (
    <section>
      <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      <ul className="mt-2 flex flex-col">
        {texts.links.map((link) => (
          <li key={link.href}>
            <TextLink href={link.href} prefetch={false}>
              {link.label}
            </TextLink>
          </li>
        ))}
      </ul>
    </section>
  )
}
