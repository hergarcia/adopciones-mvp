import { cva, type VariantProps } from 'class-variance-authority'
import { TextLink } from '@/components/ui/text-link'

type Link = { href: string; label: string }

const list = cva('flex flex-col', {
  variants: { size: { base: 'mt-2 gap-3', lg: 'mt-3 gap-4' } },
  defaultVariants: { size: 'base' },
})

type Props = VariantProps<typeof list> & { links: readonly Link[] }

// Una pregunta por entrada, con aire entre una y otra: partidas en dos renglones, dos seguidas se
// leían como un solo párrafo subrayado y sus áreas de toque se tocaban. Sin `prefetch`: abrir una
// página la cuenta, y traerla por adelantado contaría una que nadie abrió.
export function QuestionLinks({ links, size }: Props) {
  return (
    <ul className={list({ size })}>
      {links.map((link) => (
        <li key={link.href}>
          <TextLink
            href={link.href}
            prefetch={false}
            weight={size === 'lg' ? 'medium' : 'regular'}
            className={size === 'lg' ? 'text-lg' : undefined}
          >
            {link.label}
          </TextLink>
        </li>
      ))}
    </ul>
  )
}
