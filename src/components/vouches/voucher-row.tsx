import { PersonRow } from '@/components/profile/person-list'
import { ZoneLabel } from '@/components/zones/zone-label'
import type { Voucher } from '@/lib/vouches/types'

type Props = {
  voucher: Voucher
  /** Falso para una vista previa de enlace, que tomaría una de estas fotos como la del perfil. */
  showPhoto: boolean
}

// Quien responde por la persona: su zona, lo mismo que su propio perfil ya muestra. La foto es
// decorativa porque el nombre está al lado.
export function VoucherRow({ voucher, showPhoto }: Props) {
  return (
    <PersonRow person={voucher} showPhoto={showPhoto} photoAlt="" lazy>
      <ZoneLabel zone={voucher} />
    </PersonRow>
  )
}
