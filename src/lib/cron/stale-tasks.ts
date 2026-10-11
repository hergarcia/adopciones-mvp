import { TASKS, type TaskName, type TaskSchedule } from './tasks'

export type TaskRun = { task: string; lastOkAt: Date }

const MINUTE_MS = 60_000
// Una tarea frecuente puede perder una vuelta suelta sin avisar (el doble de su frecuencia); una
// diaria, una hora de holgura (spec §Edge Cases «Una tarea que no corrió»).
const MAX_GRACE_MINUTES = 60

function limitMs({ everyMinutes, graceMinutes }: TaskSchedule): number {
  return (everyMinutes + (graceMinutes ?? Math.min(everyMinutes, MAX_GRACE_MINUTES))) * MINUTE_MS
}

/**
 * Las tareas cuya última vuelta pasó su plazo, en el orden de `TASKS`. Una tarea sin vuelta anotada
 * está atrasada desde ahora; la vuelta de una tarea que no está en `TASKS` no cuenta.
 */
export function staleTasks(runs: readonly TaskRun[], now: Date): { task: TaskName; since: Date }[] {
  const lastOk = new Map(runs.map((run) => [run.task, run.lastOkAt]))
  return TASKS.flatMap((schedule: TaskSchedule) => {
    const since = lastOk.get(schedule.name)
    if (since === undefined) return [{ task: schedule.name, since: now }]
    return now.getTime() - since.getTime() > limitMs(schedule)
      ? [{ task: schedule.name, since }]
      : []
  })
}
