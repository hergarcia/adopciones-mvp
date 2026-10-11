import { isCronRequest } from '@/lib/cron/is-cron-request'
import { ROUTE_TASKS } from '@/lib/cron/route-tasks'
import { taskAlerts, type TaskAlert } from '@/lib/cron/task-alerts'
import { reportFailure, taskFailed } from '@/lib/errors/report'
import {
  claimTaskAlert,
  listFailedTaskCalls,
  listTaskRuns,
  recordTaskRun,
} from '@/lib/supabase/queries/task-runs'

const TASK = ROUTE_TASKS.vigilancia
const MINUTE_MS = 60_000

// En minutos y no como fecha: el aviso pasa por `scrub`, que se lleva los tramos largos de dígitos
// de una fecha como si fueran un teléfono. La hora del aviso dice desde cuándo.
async function alertIfFirstToday({ task, problem, since }: TaskAlert, now: Date): Promise<void> {
  if (!(await claimTaskAlert(task))) return
  const minutes = Math.floor((now.getTime() - since.getTime()) / MINUTE_MS)
  const description = `${problem} hace ${minutes} min`
  reportFailure({ screen: 'no_screen', step: task, error: description })
}

async function watch(): Promise<void> {
  const now = new Date()
  const [runs, failedCalls] = await Promise.all([listTaskRuns(), listFailedTaskCalls()])
  await Promise.all(
    taskAlerts(runs, failedCalls, now).map((alert) => alertIfFirstToday(alert, now)),
  )
}

// La tarea que se pasó de su plazo, o cuya llamada a la aplicación no respondió 2xx, va al registro
// de errores una vez por día (FR-043, research R7).
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

// Vercel Cron, una vez por día: cubre que se caiga `pg_cron` o que la base no llegue a la aplicación,
// y su vuelta es la escritura diaria que mantiene despierta la base (research R2, R7).
export async function GET(request: Request) {
  return run(request, true)
}
