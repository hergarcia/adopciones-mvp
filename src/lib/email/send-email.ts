import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Resend } from 'resend'
import { optionalEnv } from '@/lib/env'
import { renderNoticeEmail, renderNoticeText, type NoticeEmailTexts } from './notice-email-template'

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
}): Promise<SendOutcome> {
  const html = renderNoticeEmail(input.texts, input.url, input.lang)
  const text = renderNoticeText(input.texts, input.url)
  const apiKey = optionalEnv('RESEND_API_KEY')

  if (apiKey === undefined) {
    await writeToDisk(input.to, input.subject, html, text)
    return { ok: true }
  }

  const { error } = await new Resend(apiKey).emails.send({
    from: optionalEnv('RESEND_FROM') ?? DEFAULT_FROM,
    to: input.to,
    subject: input.subject,
    html,
    text,
  })

  return error ? { ok: false } : { ok: true }
}

async function writeToDisk(to: string, subject: string, html: string, text: string) {
  await mkdir(MAIL_DIR, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-')
  const payload = JSON.stringify({ to, subject, html, text }, null, 2)
  await writeFile(join(MAIL_DIR, `${stamp}.json`), payload, 'utf8')
}
