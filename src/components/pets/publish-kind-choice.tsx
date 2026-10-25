import { LinkButton } from '@/components/ui/link-button'

type Option = { href: string; label: string; hint: string }

type Props = {
  /** Ya traducidos. */
  texts: { title: string; question: string }
  pet: Option
  litter: Option
}

// Lo primero de «Publicar un animal» (FR-001): dos enlaces, sin JavaScript. Ninguno es la tirita:
// las dos respuestas pesan lo mismo, y cada una dice debajo qué abre.
export function PublishKindChoice({ texts, pet, litter }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <hgroup className="flex flex-col gap-2">
        <h1 className="afiche text-2xl text-ink">{texts.title}</h1>
        <p className="text-lg text-ink">{texts.question}</p>
      </hgroup>
      <ul className="flex flex-col gap-6">
        {[pet, litter].map((option) => (
          <li key={option.href} className="flex flex-col gap-2">
            <LinkButton href={option.href} variant="secondary" size="lg" className="w-full">
              {option.label}
            </LinkButton>
            <p className="text-sm text-ink-muted">{option.hint}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
