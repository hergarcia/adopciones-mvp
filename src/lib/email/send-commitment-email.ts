import { getTranslations } from 'next-intl/server'
import { commitmentTexts } from '@/lib/adoptions/commitment-texts'
import { commitmentEmail } from '@/lib/applications/notices'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { petShareImagePath } from '@/lib/pets/paths'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { getCommitmentForEmail } from '@/lib/supabase/queries/adoptions'
import type { ClaimedNotice } from '@/lib/supabase/queries/application-response-records'
import { deliverNotice } from './deliver-notice'
import { sendEmail } from './send-email'

// «El compromiso por Tobi» (FR-051, contracts §Correos), a cada una de las dos cuando las dos lo
// aceptaron: la portada, el texto entero con los nombres de hoy y el día en que aceptó cada una.
// Nunca un teléfono, un correo ni una respuesta (FR-054). Nunca lanza: el compromiso ya quedó
// aceptado (FR-055). El log no lleva dirección ni id.
export async function sendCommitmentEmail(notice: ClaimedNotice, locale: string): Promise<void> {
  const { sent } = await deliverNotice(async () => {
    const [to, row] = await Promise.all([
      getAccountEmail(notice.recipientId),
      getCommitmentForEmail(notice.applicationId, notice.recipientId),
    ])
    if (to === null || row === null || row.adopterAcceptedAt === null) return { ok: false }
    const [t, dates] = await Promise.all([
      getTranslations({ locale, namespace: 'emails.applications.commitment_accepted' }),
      getTranslations({ locale, namespace: 'adoptions.commitment.dates' }),
    ])
    const { clauses, note } = await commitmentTexts(
      { pet: row.petName, sex: row.petSex, adopter: row.adopterName, publisher: row.publisherName },
      row.includesNeuter,
      locale,
    )
    const values = {
      name: row.petName,
      sex: row.petSex,
      adopter: row.adopterName,
      publisher: row.publisherName,
      app: APP_NAME,
      email: SUPPORT_EMAIL,
    }
    return sendEmail({
      to,
      subject: t('subject', values),
      url: new URL(commitmentEmail(row.side, notice.applicationId).path, APP_URL).toString(),
      lang: locale,
      texts: {
        heading: t('heading', values),
        body: t('body', values),
        button: t('button'),
        fallback: t('fallback'),
        footer: t('footer', values),
      },
      extras: {
        ...(row.petCode === null || row.coverId === null
          ? {}
          : {
              image: {
                src: new URL(petShareImagePath(row.petCode, row.coverId), APP_URL).toString(),
                alt: row.petName,
              },
            }),
        lines: [
          ...clauses,
          note,
          dates('other', {
            person: row.publisherName,
            date: momentDayLabel(row.markedAt, locale),
          }),
          dates('other', {
            person: row.adopterName,
            date: momentDayLabel(row.adopterAcceptedAt, locale),
          }),
        ],
      },
    })
  })
  if (!sent) console.error('[correo] compromiso: no se pudo mandar')
}
