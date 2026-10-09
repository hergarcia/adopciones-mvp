import { getTranslations } from 'next-intl/server'
import { noticeEmail } from '@/lib/applications/notices'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { petShareImagePath } from '@/lib/pets/paths'
import { getCommitmentForEmail, type CommitmentEmailRow } from '@/lib/supabase/queries/adoptions'
import type { ClaimedNotice } from '@/lib/supabase/queries/application-response-records'
import { deliverNotice } from './deliver-notice'
import { sendCommitmentEmail } from './send-commitment-email'
import { sendEmail } from './send-email'
import { sendFollowUpAnsweredEmail } from './send-follow-up-answered'

// Un correo de la bandeja de salida (contracts §Correos): el nombre del animal, su sexo para
// concordar y el botón a la solicitud. Nunca un teléfono, una respuesta, una pregunta, un motivo ni
// el correo de nadie (FR-063). Nunca lanza: la respuesta del publicador ya está guardada (FR-064).
// El log no lleva dirección ni id.
export async function sendApplicationNotice(notice: ClaimedNotice, locale: string): Promise<void> {
  // El del compromiso lleva el texto entero y va a las dos: tiene su propio armado (research R7).
  if (notice.kind === 'commitment_accepted') return sendCommitmentEmail(notice, locale)
  // El de la respuesta lleva la primera foto adentro (historia #69, research R8).
  if (notice.kind === 'follow_up_answered') return sendFollowUpAnsweredEmail(notice, locale)
  const { sent } = await deliverNotice(async () => {
    const to = await getAccountEmail(notice.recipientId)
    if (to === null) return { ok: false }
    const [t, adoption] = await Promise.all([
      getTranslations({ locale, namespace: 'emails.applications' }),
      adoptionOf(notice),
    ])
    const values = {
      name: notice.petName,
      person: adoption?.adopterName ?? '',
      sex: notice.petSex ?? 'male',
      app: APP_NAME,
      email: SUPPORT_EMAIL,
    }
    const kind = notice.kind
    return sendEmail({
      to,
      subject: t(`${kind}.subject`, values),
      url: new URL(noticeEmail(kind, notice.applicationId).path, APP_URL).toString(),
      lang: locale,
      texts: {
        heading: t(`${kind}.heading`, values),
        body: t(`${kind}.body`, values),
        button: t(`${kind}.button`),
        fallback: t(`${kind}.fallback`),
        footer: t(`${kind}.footer`, values),
      },
      extras: coverOf(notice, adoption),
    })
  })
  if (!sent) console.error(`[correo] solicitud ${notice.kind}: no se pudo mandar`)
}

const ABOUT_ADOPTION: readonly ClaimedNotice['kind'][] = [
  'adoption_declined',
  'follow_up_requested',
]

// «Yo no adopté» dice quién (contracts §Correos): el nombre de hoy de quien adoptó, que la fila de la
// adopción le sigue dando a quien lo dio; «¿Cómo va Tobi?» lleva la portada. Los demás correos no
// nombran a nadie.
async function adoptionOf(notice: ClaimedNotice): Promise<CommitmentEmailRow | null> {
  if (!ABOUT_ADOPTION.includes(notice.kind)) return null
  return getCommitmentForEmail(notice.applicationId, notice.recipientId)
}

// La portada del animal por la ruta pública de la imagen de compartir, como el correo del
// compromiso (research R8), mientras se pueda mostrar.
function coverOf(notice: ClaimedNotice, adoption: CommitmentEmailRow | null) {
  if (notice.kind !== 'follow_up_requested' || adoption === null) return undefined
  if (adoption.petCode === null || adoption.coverId === null) return undefined
  return {
    image: {
      src: new URL(petShareImagePath(adoption.petCode, adoption.coverId), APP_URL).toString(),
      alt: adoption.petName,
    },
  }
}
