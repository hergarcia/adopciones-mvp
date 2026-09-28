import { Disclosure } from '@/components/ui/disclosure'
import { cn } from '@/lib/cn'
import type { Voucher } from '@/lib/vouches/types'
import { VoucherRow } from './voucher-row'

type Props = {
  /** Los más recientes, a la vista, y el resto, para desplegar: `splitVouchers`. */
  shown: readonly Voucher[]
  rest: readonly Voucher[]
  showPhotos: boolean
  /** Ya traducidos. `more`: «y 45 personas más». */
  texts: { title: string; more: string }
}

// Quienes responden por la persona, del aval más reciente al más viejo y sin fechas (FR-005): cada
// nombre lleva a su perfil, y así la confianza se recorre de persona en persona. Los que no entran
// de entrada se despliegan sin JavaScript.
export function ProfileVouchers({ shown, rest, showPhotos, texts }: Props) {
  if (shown.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ink">{texts.title}</h2>
      <VoucherList vouchers={shown} showPhotos={showPhotos} />
      {rest.length === 0 ? null : (
        <Disclosure label={texts.more}>
          <VoucherList vouchers={rest} showPhotos={showPhotos} className="mt-3" />
        </Disclosure>
      )}
    </section>
  )
}

// Texto con divisores, como «Mis avales»: una lista de gente, no un muro de tarjetas.
function VoucherList({
  vouchers,
  showPhotos,
  className,
}: {
  vouchers: readonly Voucher[]
  showPhotos: boolean
  className?: string
}) {
  return (
    <ul className={cn('divide-y-2 divide-line border-y-2 border-line', className)}>
      {vouchers.map((voucher) => (
        <VoucherRow key={voucher.publicId} voucher={voucher} showPhoto={showPhotos} />
      ))}
    </ul>
  )
}
