import { applicationAbandonedEvent } from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'

function parse(body: string): unknown {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

// El beacon de quien deja el cuestionario sin enviar (research R11): llega al cerrarse la página,
// sin esperar respuesta y sin sesión requerida. Solo valida y registra la última pregunta; nada de
// la persona viaja ni se guarda.
export async function POST(request: Request) {
  await trackAll([applicationAbandonedEvent(parse(await request.text()))])
  return new Response(null, { status: 204 })
}
