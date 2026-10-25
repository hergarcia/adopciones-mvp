import Link from 'next/link'
import { rowLinkTitle } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'

export type MyListLink = {
  href: string
  /** Ya traducido, con lo que la lista dice hoy: «Mis avales: te avalan 3 personas». */
  label: string
  /** `false` donde abrir la página registra algo: traerla por adelantado lo contaría. */
  prefetch?: boolean
}

type Props = {
  title: string
  links: readonly MyListLink[]
}

// Las listas de la persona en «Mi perfil», juntas bajo un nombre. Son renglones de una lista con
// divisores y no botones: llevan a otra pantalla, no cambian nada (historia #202).
export function MyListLinks({ title, links }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <ul className="border-t-2 border-line">
        {links.map((link) => (
          <li key={link.href} className="border-b-2 border-line">
            <Link
              href={link.href}
              prefetch={link.prefetch}
              className="press group flex min-h-11 items-center py-3"
            >
              <span className={cn(rowLinkTitle(), 'text-base font-medium')}>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
