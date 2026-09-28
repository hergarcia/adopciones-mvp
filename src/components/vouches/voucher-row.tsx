import { Avatar } from '@/components/profile/avatar'
import { TextLink } from '@/components/ui/text-link'
import { ZoneLabel } from '@/components/zones/zone-label'
import { publicPhotoPath, publicProfilePath } from '@/lib/profile/public-paths'
import type { Voucher } from '@/lib/vouches/types'

type Props = {
  voucher: Voucher
  /** Falso para una vista previa de enlace, que tomaría una de estas fotos como la del perfil. */
  showPhoto: boolean
}

// Quien responde por la persona, reconocible sin abrir otra página: su foto o sus iniciales, su
// nombre y su zona, lo mismo que su propio perfil ya muestra. La foto es decorativa porque el nombre
// está al lado. Sin prefetch: traer un perfil por adelantado contaría como una vista (research R10).
export function VoucherRow({ voucher, showPhoto }: Props) {
  const photoUrl = showPhoto && voucher.hasPhoto ? publicPhotoPath(voucher.publicId) : null
  return (
    <li className="flex items-center gap-4 py-3">
      <Avatar displayName={voucher.displayName} url={photoUrl} alt="" lazy />
      <div className="flex flex-col">
        <TextLink href={publicProfilePath(voucher.publicId)} prefetch={false} weight="medium">
          {voucher.displayName}
        </TextLink>
        <ZoneLabel zone={voucher} />
      </div>
    </li>
  )
}
