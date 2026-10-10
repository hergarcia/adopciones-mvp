import type { Instrumentation } from 'next'
import { routeTask } from '@/lib/cron/route-tasks'
import { reportFailureNow } from '@/lib/errors/report'
import { screenName } from '@/lib/errors/screen-name'

type Context = Parameters<Instrumentation.onRequestError>[2]

function stepOf({ routeType, routePath }: Context): string {
  if (routeType === 'render') return 'open_screen'
  if (routeType === 'route') return routeTask(routePath)
  return routeType
}

// La falla que termina en la pantalla de error del sitio, o en una ruta (research R10 vía 1). La
// pantalla sale de la ruta del archivo, que no lleva el código de la ficha ni el id de nadie; nunca de
// `request.path`, que sí, ni de `request.headers`.
export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  await reportFailureNow({
    screen: screenName(context.routePath),
    step: stepOf(context),
    error,
  })
}
