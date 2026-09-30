import { Card } from '@/components/ui/card'

type Props = {
  email: string
  /** Ya traducidos. */
  texts: { label: string; onlyYou: string }
}

// El correo de la cuenta en «Mi perfil», con que solo lo ve quien tiene la sesión.
export function EmailCard({ email, texts }: Props) {
  return (
    <Card>
      <p className="text-sm text-ink-muted">{texts.label}</p>
      <p className="mt-1 text-base text-ink">{email}</p>
      <p className="mt-2 text-sm text-primary">{texts.onlyYou}</p>
    </Card>
  )
}
