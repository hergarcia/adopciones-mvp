import { getTranslations } from 'next-intl/server'
import sharp from 'sharp'
import { followUpAnsweredEmail } from '@/lib/applications/notices'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import type { ClaimedNotice } from '@/lib/supabase/queries/application-response-records'
import {
  downloadFollowUpCard,
  followUpAnsweredForEmail,
} from '@/lib/supabase/queries/follow-up-records'
import type { InlineImage } from './notice-email-template'
import { deliverNotice } from './deliver-notice'
import { sendEmail } from './send-email'

const EMAIL_IMAGE_WIDTH = 600

// La primera foto, en JPEG: Outlook no muestra WebP adentro de un correo (research R8).
async function firstPhoto(
  followUpId: string,
  photoId: string | null,
  alt: string,
): Promise<InlineImage | undefined> {
  if (photoId === null) return undefined
  const card = await downloadFollowUpCard(followUpId, photoId)
  if (card === null) return undefined
  const content = await sharp(card)
    .resize({ width: EMAIL_IMAGE_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer()
  return { contentId: `seguimiento-${photoId}`, alt, filename: 'foto.jpg', content }
}

// «Ana contó cómo va Tobi» (contracts §Correos), a quien lo dio: la primera foto adentro y el camino
// a la pantalla del animal. Nunca el texto de la respuesta, un teléfono ni un correo (FR-035). No sale si la
// base no lo devuelve: un bloqueo en el medio o una cuenta borrada. Nunca lanza: la respuesta ya
// quedó guardada. El log no lleva dirección ni id.
export async function sendFollowUpAnsweredEmail(
  notice: ClaimedNotice,
  locale: string,
): Promise<void> {
  const { sent } = await deliverNotice(async () => {
    const [to, row] = await Promise.all([
      getAccountEmail(notice.recipientId),
      followUpAnsweredForEmail(notice.applicationId, notice.recipientId),
    ])
    if (to === null || row === null) return { ok: false }
    const t = await getTranslations({
      locale,
      namespace: 'emails.applications.follow_up_answered',
    })
    const values = {
      name: row.petName,
      person: row.adopterName,
      sex: row.petSex,
      app: APP_NAME,
      email: SUPPORT_EMAIL,
    }
    const inlineImage = await firstPhoto(row.followUpId, row.firstPhotoId, row.petName).catch(
      () => undefined,
    )
    return sendEmail({
      to,
      subject: t('subject', values),
      url: new URL(followUpAnsweredEmail(row.petId).path, APP_URL).toString(),
      lang: locale,
      texts: {
        heading: t('heading', values),
        body: t('body', values),
        button: t('button'),
        fallback: t('fallback'),
        footer: t('footer', values),
      },
      extras: inlineImage === undefined ? undefined : { inlineImage },
    })
  })
  if (!sent) console.error('[correo] seguimiento respondido: no se pudo mandar')
}
