import { myPetPath } from '@/lib/pets/paths'
import type { Sex } from '@/lib/pets/options'
import { sendReminderEmail } from './reminder-email'

// «¿Tobi sigue disponible?» (FR-017, contracts §Correos): «Ya no está disponible» lleva al animal en
// «Mis animales».
export function sendPetReminder(input: {
  ownerId: string
  petId: string
  name: string
  sex: Sex
  expiresAt: Date
  token: string
  locale: string
}): Promise<boolean> {
  return sendReminderEmail({
    ownerId: input.ownerId,
    namespace: 'emails.pet_reminder',
    values: { name: input.name, sex: input.sex },
    expiresAt: input.expiresAt,
    token: input.token,
    notAvailablePath: myPetPath(input.petId),
    locale: input.locale,
  })
}
