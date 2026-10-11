import { staleTasks, type TaskRun } from './stale-tasks'
import { TASKS, type TaskName } from './tasks'

/** La última llamada de una tarea a la aplicación que no respondió 2xx; sin respuesta, `null`. */
export type FailedCall = { task: string; statusCode: number | null; calledAt: Date }

export type TaskAlert = { task: TaskName; problem: string; since: Date }

function problemOf({ statusCode }: FailedCall): string {
  return statusCode === null
    ? 'la aplicación no respondió'
    : `la aplicación respondió ${statusCode}`
}

/**
 * Lo que la vigilancia avisa, una cosa por tarea y en el orden de `TASKS`: la llamada que falló dice
 * más que la vuelta atrasada (un secreto que no coincide, la aplicación caída). Lo de una tarea que
 * no está en `TASKS` no cuenta.
 */
export function taskAlerts(
  runs: readonly TaskRun[],
  failedCalls: readonly FailedCall[],
  now: Date,
): TaskAlert[] {
  const failed = new Map(failedCalls.map((call) => [call.task, call]))
  const late = new Map(staleTasks(runs, now).map(({ task, since }) => [task, since]))
  return TASKS.flatMap(({ name }): TaskAlert[] => {
    const call = failed.get(name)
    if (call !== undefined) return [{ task: name, problem: problemOf(call), since: call.calledAt }]
    const since = late.get(name)
    return since === undefined ? [] : [{ task: name, problem: 'sin vuelta completa', since }]
  })
}
