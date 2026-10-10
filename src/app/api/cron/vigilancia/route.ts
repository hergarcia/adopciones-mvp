import { isCronRequest } from '@/lib/cron/is-cron-request'
import { ROUTE_TASKS } from '@/lib/cron/route-tasks'
import { staleTasks } from '@/lib/cron/stale-tasks'
import type { TaskName } from '@/lib/cron/tasks'
import { reportFailure, taskFailed } from '@/lib/errors/report'
import { claimTaskAlert, listTaskRuns, recordTaskRun } from '@/lib/supabase/queries/task-runs'

const TASK = ROUTE_TASKS.vigilancia
const MINUTE_MS = 60_000

// En minutos y no como fecha: el aviso pasa por `scrub`, que se lleva los tramos largos de dígitos
// de una fecha como si fueran un teléfono. La hora del aviso dice desde cuándo.
async function alertIfFirstToday(task: TaskName, since: Date, now: Date): Promise<void> {
  if (!(await claimTaskAlert(task))) return
  const minutes = Math.floor((now.getTime() - since.getTime()) / MINUTE_MS)
  const description = `sin vuelta completa hace ${minutes} min`
  reportFailure({ screen: 'no_screen', step: task, error: description })
}

async function watch(): Promise<void> {
  const now = new Date()
  const late = staleTasks(await listTaskRuns(), now)
  await Promise.all(late.map(({ task, since }) => alertIfFirstToday(task, since, now)))
}

// La tarea que se pasó de su plazo va al registro de errores una vez por día (FR-043, research R7).
async function run(request: Request, isDaily: boolean): Promise<Response> {
  if (!isCronRequest(request)) {
    return new Response(null, { status: 401 })
  }

  const done = await watch().then(() => true, taskFailed(TASK, false))
  if (done && isDaily) await recordTaskRun(TASK).catch(taskFailed(TASK, undefined))
  return new Response(null, { status: 204 })
}

// La base, cada 15 minutos (`task_watch_tick`).
export async function POST(request: Request) {
  return run(request, false)
}

// Vercel Cron, una vez por día: cubre que se caiga `pg_cron`, y su vuelta es la escritura diaria
// que mantiene despierta la base (research R2, R7).
export async function GET(request: Request) {
  return run(request, true)
}
