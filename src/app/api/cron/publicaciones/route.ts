import { followUpResolvedEvent } from '@/lib/analytics/follow-up-events'
import { daysSincePublished } from '@/lib/analytics/pet-events'
import { track, trackAll } from '@/lib/analytics/track'
import { isCronRequest } from '@/lib/cron/is-cron-request'
import { ROUTE_TASKS } from '@/lib/cron/route-tasks'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { taskFailed } from '@/lib/errors/report'
import { sendLitterReminder } from '@/lib/email/send-litter-reminder'
import { sendPetReminder } from '@/lib/email/send-pet-reminder'
import { routing } from '@/lib/i18n/routing'
import { hashRenewalToken, newRenewalToken } from '@/lib/pets/renewal-token'
import { purgeFollowUpPhotos } from '@/lib/supabase/queries/follow-up-records'
import { claimFollowUpEvents } from '@/lib/supabase/queries/follow-ups'
import {
  claimLitterExpiries,
  claimLitterReminders,
  createLitterRenewalLink,
  type DueLitterReminder,
} from '@/lib/supabase/queries/litter-status'
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
const TASK = ROUTE_TASKS.publicaciones

async function remind(reminder: DueReminder) {
  const token = newRenewalToken()
  await createRenewalLink(reminder.petId, hashRenewalToken(token))
  const sent = await sendPetReminder({ ...reminder, token, locale: routing.defaultLocale })
  if (sent) await track('pet_reminder_sent', {}, { visit: false })
}

// Un solo correo por camada, ninguno por cría (FR-011, SC-001).
async function remindLitter(reminder: DueLitterReminder) {
  const token = newRenewalToken()
  await createLitterRenewalLink(reminder.litterId, hashRenewalToken(token))
  const sent = await sendLitterReminder({ ...reminder, token, locale: routing.defaultLocale })
  if (sent) await track('pet_reminder_sent', { litter: 'litter' }, { visit: false })
}

// De a uno y espaciados, por el límite de Resend; cada uno ya quedó marcado al tomarlo.
async function sendSpaced(sends: (() => Promise<void>)[]) {
  for (const [index, send] of sends.entries()) {
    if (index > 0) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
      await new Promise((resolve) => setTimeout(resolve, REMINDER_SPACING_MS))
    }
    // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
    await send().catch(taskFailed(TASK, undefined))
  }
}

// La llama la base (`pet_lifecycle_tick`, cada 5 minutos) cuando hay un recordatorio debido o un
// vencimiento sin medir (research R4). Los recordatorios ya quedaron marcados al tomarlos: cada uno
// se intenta una vez, salga o no (FR-017). Sin el secreto, 401 sin cuerpo.
export async function POST(request: Request) {
  if (!isCronRequest(request)) {
    return new Response(null, { status: 401 })
  }

  const reminders = await claimPetReminders(REMINDERS_PER_RUN).catch(taskFailed(TASK, []))
  // Las camadas toman lo que dejaron los animales, así una vuelta no manda más de diez correos.
  const litterReminders = await claimLitterReminders(
    Math.max(REMINDERS_PER_RUN - reminders.length, 0),
  ).catch(taskFailed(TASK, []))
  await sendSpaced([
    ...reminders.map((reminder) => () => remind(reminder)),
    ...litterReminders.map((reminder) => () => remindLitter(reminder)),
  ])

  const now = new Date()
  const expiries = await claimPetExpiries(EXPIRIES_PER_RUN).catch(taskFailed(TASK, []))
  const litterExpiries = await claimLitterExpiries(EXPIRIES_PER_RUN).catch(taskFailed(TASK, []))
  await Promise.all([
    ...litterExpiries.map((publishedAt) =>
      track(
        'pet_expired',
        {
          from: 'available',
          days_since_published: daysSincePublished(publishedAt, now),
          litter: 'litter',
        },
        { visit: false },
      ),
    ),
    ...expiries.map((expiry) =>
      track(
        'pet_expired',
        {
          from: expiry.status === 'in_process' ? 'in_process' : 'available',
          days_since_published: daysSincePublished(expiry.publishedAt, now),
        },
        { visit: false },
      ),
    ),
  ])
  // Los seguimientos que la vuelta horaria de la base pidió o no pidió (historia #69, R11).
  const followUps = await claimFollowUpEvents(FOLLOW_UP_EVENTS_PER_RUN).catch(taskFailed(TASK, []))
  await trackAll(followUps.map(followUpResolvedEvent), { visit: false })
  // Lo que una acción dejó en la bandeja de salida sin vaciar —o el pedido del seguimiento, que la
  // base escribe sola—, porque nadie lo mandó todavía.
  await drainApplicationNotices()
  // Los objetos de las fotos del seguimiento que quedaron sin fila (R7).
  await purgeFollowUpPhotos().catch(taskFailed(TASK, undefined))
  return new Response(null, { status: 204 })
}
