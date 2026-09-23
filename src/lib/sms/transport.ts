export type SmsTransport = 'twilio' | 'outbox' | 'none'

type Settings = {
  accountSid: string | undefined
  authToken: string | undefined
  messagingServiceSid: string | undefined
  supabaseUrl: string
}

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost'])

// Por dónde sale un código. A disco solo contra la base local, que tiene personas y números de
// mentira: en cualquier otro lado, sin Twilio, el pedido falla (FR-009c). Depende de dónde corre
// el producto y no de una opción que alguien se pueda olvidar de apagar.
export function smsTransport(settings: Settings): SmsTransport {
  const credentials = [settings.accountSid, settings.authToken, settings.messagingServiceSid]
  if (credentials.every((value) => value !== undefined)) return 'twilio'
  return isLocal(settings.supabaseUrl) ? 'outbox' : 'none'
}

function isLocal(url: string): boolean {
  return URL.canParse(url) && LOCAL_HOSTS.has(new URL(url).hostname)
}
