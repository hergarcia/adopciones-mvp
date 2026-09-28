import Link from 'next/link'
import { publicProfilePath } from '@/lib/profile/public-paths'
import type { Voucher } from '@/lib/vouches/types'

type Props = { title: string; vouchers: readonly Voucher[] }

// Quienes responden por la persona: texto, cada nombre lleva a su propio perfil, y así la confianza
// se recorre de persona en persona (FR-005). Sin fechas de los avales. Sin prefetch: traer un perfil
// por adelantado contaría como una vista (research R10).
export function ProfileVouchers({ title, vouchers }: Props) {
  if (vouchers.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <ul className="flex flex-col">
        {vouchers.map((voucher) => (
          <li key={voucher.publicId}>
            <Link
              href={publicProfilePath(voucher.publicId)}
              prefetch={false}
              className="press inline-flex min-h-11 items-center text-base text-ink underline decoration-2 underline-offset-4 hover:decoration-4"
            >
              {voucher.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
