import { daysSincePublished } from '@/lib/analytics/pet-events'
import { track } from '@/lib/analytics/track'
import { isCronRequest } from '@/lib/cron/is-cron-request'
import { sendPetReminder } from '@/lib/email/send-pet-reminder'
import { routing } from '@/lib/i18n/routing'
import { hashRenewalToken, newRenewalToken } from '@/lib/pets/renewal-token'
import {
  claimPetExpiries,
  claimPetReminders,
  createRenewalLink,
  type DueReminder,
} from '@/lib/supabase/queries/pet-renewal'

// Lo que sobra queda para la vuelta siguiente, cinco minutos después (contracts §Tarea programada).
const REMINDERS_PER_RUN = 100
const EXPIRIES_PER_RUN = 500

async function remind(reminder: DueReminder) {
  const token = newRenewalToken()
  await createRenewalLink(reminder.petId, hashRenewalToken(token))
  const sent = await sendPetReminder({ ...reminder, token, locale: routing.defaultLocale })
  if (sent) await track('pet_reminder_sent', undefined, { visit: false })
}

// La llama la base (`pet_lifecycle_tick`, cada 5 minutos) cuando hay un recordatorio debido o un
// vencimiento sin medir (research R4). Los recordatorios ya quedaron marcados al tomarlos: cada uno
// se intenta una vez, salga o no (FR-017). Sin el secreto, 401 sin cuerpo.
export async function POST(request: Request) {
  if (!isCronRequest(request)) {
    return new Response(null, { status: 401 })
  }

  const reminders = await claimPetReminders(REMINDERS_PER_RUN).catch(() => [])
  await Promise.all(
    reminders.map((reminder) =>
      remind(reminder).catch(() =>
        console.error('[tarea] recordatorio: no se pudo crear el enlace'),
      ),
    ),
  )

  const now = new Date()
  const expiries = await claimPetExpiries(EXPIRIES_PER_RUN).catch(() => [])
  await Promise.all(
    expiries.map((expiry) =>
      track(
        'pet_expired',
        {
          from: expiry.status === 'in_process' ? 'in_process' : 'available',
          days_since_published: daysSincePublished(expiry.publishedAt, now),
        },
        { visit: false },
      ),
    ),
  )
  return new Response(null, { status: 204 })
}
