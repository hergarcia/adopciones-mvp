import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import { cn } from '@/lib/cn'

// El enlace que es texto: subrayado de tinta que engrosa al hover. `block` va en su propio renglón y
// mide los 44 px del piso táctil; `inline` va adentro de una frase, donde el renglón ya da el alto.
export const textLink = cva(
  'text-ink underline decoration-2 underline-offset-4 transition-[text-decoration-thickness] duration-[var(--dur-fast)] ease-out hover:decoration-4',
  {
    variants: {
      weight: { regular: '', medium: 'font-medium' },
      placement: { block: 'press inline-flex min-h-11 items-center', inline: '' },
    },
    defaultVariants: { weight: 'regular', placement: 'block' },
  },
)

type Props = VariantProps<typeof textLink> & {
  href: string
  children: React.ReactNode
  /** `false` donde abrir la página registra algo: traerla por adelantado lo contaría. */
  prefetch?: boolean
  className?: string
}

export function TextLink({ href, children, prefetch, weight, placement, className }: Props) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(textLink({ weight, placement }), className)}
    >
      {children}
    </Link>
  )
}
