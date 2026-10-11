import type { TaskName } from './tasks'

// La tarea que llama a cada ruta (data-model §Trabajos de pg_cron): el paso del aviso de una falla en
// la ruta es esa tarea, con el mismo nombre que mira la vigilancia.
export const ROUTE_TASKS = {
  publicaciones: 'pet-lifecycle',
  identidad: 'identity-expiry-mail',
  resumen: 'admin-digest',
  limpieza: 'daily-cleanup',
  vigilancia: 'vigilancia-diaria',
} as const satisfies Record<string, TaskName>

const CRON_ROUTE = /\/api\/cron\/([^/]+)/u

/** La tarea de una ruta de `/api/cron/`, por la ruta de su archivo; `route` si no es de una tarea. */
export function routeTask(routePath: string): string {
  const folder = CRON_ROUTE.exec(routePath)?.[1]
  return Object.entries(ROUTE_TASKS).find(([name]) => name === folder)?.[1] ?? 'route'
}
