import { unsubscribeWithLink } from '@/lib/alerts/unsubscribe'
import { reportFailure } from '@/lib/errors/report'

// El «darse de baja» del programa de correo (`List-Unsubscribe-Post`, research R7): corta lo mismo
// que la pantalla. Responde 200 sin cuerpo siempre, también con un token que no existe, para no
// decir si existía.
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('t') ?? ''
  await unsubscribeWithLink(token).catch((cause: unknown) => {
    reportFailure({ screen: 'no_screen', step: 'unsubscribe_pet_alerts', error: cause })
  })
  return new Response(null, { status: 200 })
}
