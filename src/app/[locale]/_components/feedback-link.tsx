import { FEEDBACK_PATH } from '@/lib/feedback/screens'
import { NavLink } from './nav-link'

type Props = {
  /** «Opinar», en la cabecera y en el menú de la cuenta. */
  label: string
  className?: string
}

export function FeedbackLink({ label, className }: Props) {
  return (
    <NavLink href={FEEDBACK_PATH} prefetch={false} className={className}>
      {label}
    </NavLink>
  )
}
