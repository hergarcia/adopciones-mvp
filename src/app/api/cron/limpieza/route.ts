import { isCronRequest } from '@/lib/cron/is-cron-request'
import { ROUTE_TASKS } from '@/lib/cron/route-tasks'
import { taskFailed } from '@/lib/errors/report'
import { purgePetPhotos } from '@/lib/supabase/queries/pet-photos'
import { recordTaskRun } from '@/lib/supabase/queries/task-runs'

const TASK = ROUTE_TASKS.limpieza

async function purge(): Promise<void> {
  const { ok } = await purgePetPhotos()
  if (!ok) throw new Error('Quedaron fotos sin borrar para la vuelta siguiente')
}

// La llama la base (`daily_cleanup_tick`, a diario): las fotos de publicaciones sin terminar de más
// de 24 horas (#53, KL-53-1) se borran por la API de Storage, que la base no alcanza. La vuelta se
// anota solo si terminó; si no, la falla va al registro y la vigilancia la ve atrasada. Sin el
// secreto, 401 sin cuerpo.
export async function POST(request: Request) {
  if (!isCronRequest(request)) {
    return new Response(null, { status: 401 })
  }

  const done = await purge().then(() => true, taskFailed(TASK, false))
  if (done) await recordTaskRun(TASK).catch(taskFailed(TASK, undefined))
  return new Response(null, { status: 204 })
}
