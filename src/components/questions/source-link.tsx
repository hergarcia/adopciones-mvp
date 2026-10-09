import { textLink } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'

export type SourceLinkTexts = { href: string; label: string }

// La norma en otra pestaña: el sitio queda donde estaba (US1-AS7). Un `a` común y no `TextLink`,
// porque es de afuera y no se navega con el enrutador.
export function SourceLink({ source }: { source: SourceLinkTexts }) {
  return (
    <a
      href={source.href}
      target="_blank"
      rel="noopener"
      className={cn(textLink({ placement: 'inline' }), 'text-sm')}
    >
      {source.label}
    </a>
  )
}
