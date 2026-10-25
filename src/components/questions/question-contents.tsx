import { TextLink } from '@/components/ui/text-link'

export type QuestionContentsTexts = {
  label: string
  links: { href: string; label: string }[]
}

// Los atajos a cada sección de una página larga, como la de los estados: quien llega buscando
// «Pausado» lo toca y salta ahí, sin leer las otras cinco.
export function QuestionContents({ texts }: { texts: QuestionContentsTexts }) {
  return (
    <nav aria-label={texts.label}>
      <ul className="flex flex-wrap gap-x-6">
        {texts.links.map((link) => (
          <li key={link.href}>
            <TextLink href={link.href} weight="medium">
              {link.label}
            </TextLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
