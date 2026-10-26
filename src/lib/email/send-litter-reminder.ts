import { litterPanelPath } from '@/lib/litters/paths'
import { sendReminderEmail } from './reminder-email'

// «¿La camada de Luna sigue disponible?» (FR-011): uno por camada y ninguno por cría. «Sigue
// disponible» renueva la camada entera y «Ya no está disponible» lleva a su panel (FR-013).
export function sendLitterReminder(input: {
  ownerId: string
  litterId: string
  name: string
  expiresAt: Date
  token: string
  locale: string
}): Promise<boolean> {
  return sendReminderEmail({
    ownerId: input.ownerId,
    namespace: 'emails.litter_reminder',
    values: { name: input.name },
    expiresAt: input.expiresAt,
    token: input.token,
    notAvailablePath: litterPanelPath(input.litterId),
    locale: input.locale,
  })
}
