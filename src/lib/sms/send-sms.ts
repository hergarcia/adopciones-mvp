import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { optionalEnv, requireEnv } from '@/lib/env'
import { reportFailure } from '@/lib/errors/report'
import { requestScreen } from '@/lib/errors/request-screen'
import { smsTransport } from './transport'
import { twilioOutcome, type SmsOutcome } from './twilio-outcome'

const OUTBOX = '.artifacts/sms'

// Sin tope, un Twilio que no contesta deja a la persona esperando hasta que la plataforma corta la
// función, y ve un error en vez de que el mensaje no salió (FR-009a); el pedido queda en `sending`.
const TWILIO_TIMEOUT_MS = 10_000

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

  if (transport === 'none') return serviceFailed('sin las credenciales de Twilio')
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
        signal: AbortSignal.timeout(TWILIO_TIMEOUT_MS),
      },
    )
    const payload: unknown = response.ok ? null : await response.json().catch(() => null)
    const code = errorCode(payload)
    const outcome = twilioOutcome(response.status, code)
    // Solo el estado y el código de Twilio: su mensaje puede nombrar el número.
    if (outcome === 'failed') {
      return serviceFailed(`Twilio respondió ${response.status} (${code ?? 'sin código'})`)
    }
    return outcome
  } catch (cause) {
    // La red o el tope de espera, no el número: del servicio (FR-009a).
    return serviceFailed(cause)
  }
}

// El mensaje que no salió por el servicio llega al registro, sin el número (FR-013, US4-AS5). Que
// sea del número (`rejected`) es un rechazo por una regla y no llega.
async function serviceFailed(error: unknown): Promise<SmsOutcome> {
  reportFailure({ screen: await requestScreen(), step: 'request_code', error })
  return 'failed'
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
