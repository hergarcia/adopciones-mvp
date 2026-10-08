import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Resend } from 'resend'
import { optionalEnv } from '@/lib/env'
import {
  renderNoticeEmail,
  renderNoticeText,
  type InlineImage,
  type NoticeEmailExtras,
  type NoticeEmailTexts,
} from './notice-email-template'

const MAIL_DIR = '.artifacts/mail'
const DEFAULT_FROM = 'onboarding@resend.dev'

export type SendOutcome = { ok: true } | { ok: false }

// Dos salidas, una sola plantilla: lo que se prueba es exactamente lo que se manda.
//
// Sin `RESEND_API_KEY` el mensaje se escribe a archivo y de ahí lo lee la prueba de punta a punta.
// No es una simulación de cortesía: Resend necesita un dominio verificado para mandarle a
// cualquier dirección, y el dominio no existe hasta que se decida el nombre (KL-006).
export async function sendEmail(input: {
  to: string
  subject: string
  texts: NoticeEmailTexts
  url: string
  lang: string
  extras?: NoticeEmailExtras
}): Promise<SendOutcome> {
  const html = renderNoticeEmail(input.texts, input.url, input.lang, input.extras)
  const text = renderNoticeText(input.texts, input.url, input.extras)
  const apiKey = optionalEnv('RESEND_API_KEY')

  if (apiKey === undefined) {
    await writeToDisk(input.to, input.subject, html, text, input.extras?.inlineImage)
    return { ok: true }
  }

  const inline = input.extras?.inlineImage
  const { error } = await new Resend(apiKey).emails.send({
    from: optionalEnv('RESEND_FROM') ?? DEFAULT_FROM,
    to: input.to,
    subject: input.subject,
    html,
    text,
    ...(inline === undefined
      ? {}
      : {
          attachments: [
            { content: inline.content, filename: inline.filename, contentId: inline.contentId },
          ],
        }),
  })

  return error ? { ok: false } : { ok: true }
}

// La foto en línea se anota sin su contenido: la prueba solo necesita saber que fue.
async function writeToDisk(
  to: string,
  subject: string,
  html: string,
  text: string,
  inline: InlineImage | undefined,
) {
  await mkdir(MAIL_DIR, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-')
  const inlineImage =
    inline === undefined
      ? undefined
      : { contentId: inline.contentId, filename: inline.filename, bytes: inline.content.length }
  const payload = JSON.stringify({ to, subject, html, text, inlineImage }, null, 2)
  // Dos correos en el mismo milisegundo pisaban el mismo archivo: el e2e en paralelo perdía uno.
  await writeFile(join(MAIL_DIR, `${stamp}-${randomUUID()}.json`), payload, 'utf8')
}
