import { followUpResolvedEvent } from '@/lib/analytics/follow-up-events'
import { daysSincePublished } from '@/lib/analytics/pet-events'
import { track, trackAll } from '@/lib/analytics/track'
import { isCronRequest } from '@/lib/cron/is-cron-request'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { sendPetReminder } from '@/lib/email/send-pet-reminder'
import { routing } from '@/lib/i18n/routing'
import { hashRenewalToken, newRenewalToken } from '@/lib/pets/renewal-token'
import { claimFollowUpEvents } from '@/lib/supabase/queries/follow-ups'
import {
  claimPetExpiries,
  claimPetReminders,
  createRenewalLink,
  type DueReminder,
} from '@/lib/supabase/queries/pet-renewal'

// Lo que sobra queda para la vuelta siguiente, cinco minutos después (contracts §Tarea programada).
// Los recordatorios salen de a uno y espaciados: Resend acepta unos pocos pedidos por segundo, y cada
// uno ya quedó marcado al tomarlo, así que uno rechazado por la ráfaga no se volvería a intentar. El
// día que se aplica la migración vencen todos juntos: diez por vuelta son 2.880 por día.
const REMINDERS_PER_RUN = 10
const REMINDER_SPACING_MS = 600
const EXPIRIES_PER_RUN = 500
const FOLLOW_UP_EVENTS_PER_RUN = 500

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
  for (const [index, reminder] of reminders.entries()) {
    if (index > 0) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
      await new Promise((resolve) => setTimeout(resolve, REMINDER_SPACING_MS))
    }
    // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
    await remind(reminder).catch(() =>
      console.error('[tarea] recordatorio: no se pudo crear el enlace'),
    )
  }

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
  // Los seguimientos que la vuelta horaria de la base pidió o no pidió (historia #69, R11).
  const followUps = await claimFollowUpEvents(FOLLOW_UP_EVENTS_PER_RUN).catch(() => [])
  await trackAll(followUps.map(followUpResolvedEvent), { visit: false })
  // Lo que una acción dejó en la bandeja de salida sin vaciar —o el pedido del seguimiento, que la
  // base escribe sola—, porque nadie lo mandó todavía.
  await drainApplicationNotices()
  return new Response(null, { status: 204 })
}
