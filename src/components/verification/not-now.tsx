import type { ExitLevel, NotNowTarget } from '@/lib/verification/exit-question'
import { NotNowButton } from './not-now-button'
import { NotNowLink } from './not-now-link'

type Props = { level: ExitLevel; target: NotNowTarget; label: string }

// El mismo «Ahora no» en el mismo lugar; solo cambia si tocarlo hace la pregunta (historia #234).
export function NotNow({ level, target, label }: Props) {
  return target.ask ? (
    <NotNowButton level={level} from={target.from} label={label} />
  ) : (
    <NotNowLink href={target.href} label={label} />
  )
}
