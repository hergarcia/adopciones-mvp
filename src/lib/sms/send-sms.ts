import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { optionalEnv, requireEnv } from '@/lib/env'
import { smsTransport } from './transport'
import { twilioOutcome, type SmsOutcome } from './twilio-outcome'

const OUTBOX = '.artifacts/sms'

// Un solo mensaje, y tres salidas que no se mezclan (plan §5): Twilio con sus tres credenciales,
// disco contra la base local, o ninguna. El texto es siempre el mismo, así que lo que prueba el
// e2e leyendo el disco es lo que se manda.
export async function sendSms(to: string, body: string): Promise<SmsOutcome> {
  const accountSid = optionalEnv('TWILIO_ACCOUNT_SID')
  const authToken = optionalEnv('TWILIO_AUTH_TOKEN')
  const messagingServiceSid = optionalEnv('TWILIO_MESSAGING_SERVICE_SID')

  const transport = smsTransport({
    accountSid,
    authToken,
    messagingServiceSid,
    supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  })

  if (transport === 'none') return 'failed'
  if (transport === 'outbox') return writeToOutbox(to, body)

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          MessagingServiceSid: messagingServiceSid ?? '',
          Body: body,
        }),
      },
    )
    const payload: unknown = response.ok ? null : await response.json().catch(() => null)
    return twilioOutcome(response.status, errorCode(payload))
  } catch {
    // La red, no el número: del servicio (FR-009a).
    return 'failed'
  }
}

function errorCode(payload: unknown): number | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined
  const code: unknown = Reflect.get(payload, 'code')
  return typeof code === 'number' ? code : undefined
}

async function writeToOutbox(to: string, body: string): Promise<SmsOutcome> {
  try {
    await mkdir(OUTBOX, { recursive: true })
    const stamp = new Date().toISOString().replaceAll(':', '-')
    await writeFile(join(OUTBOX, `${stamp}-${to}.json`), JSON.stringify({ to, body }, null, 2))
    return 'sent'
  } catch {
    return 'failed'
  }
}
