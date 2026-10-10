import type { TaskName } from '@/lib/cron/tasks'
import { createServiceSupabase } from '@/lib/supabase/service'

// Las vueltas de las tareas solas (#169, US5). Con permisos de servicio: las usan las rutas de las
// tareas, que no tienen sesión, y las tablas viven en `private`, fuera de la API.

export type TaskRun = { task: string; lastOkAt: Date }

export async function listTaskRuns(): Promise<TaskRun[]> {
  const { data, error } = await createServiceSupabase().rpc('list_task_runs')
  if (error) throw new Error('No se pudieron leer las vueltas de las tareas', { cause: error })
  return data.map((row) => ({ task: row.task, lastOkAt: new Date(row.last_ok_at) }))
}

export async function recordTaskRun(task: TaskName): Promise<void> {
  const { error } = await createServiceSupabase().rpc('record_task_run', { p_task: task })
  if (error) throw new Error('No se pudo anotar la vuelta de la tarea', { cause: error })
}

/** true si es el primer aviso de hoy (día de Uruguay) de esa tarea; false si ya se avisó. */
export async function claimTaskAlert(task: TaskName): Promise<boolean> {
  const { data, error } = await createServiceSupabase().rpc('claim_task_alert', { p_task: task })
  if (error) throw new Error('No se pudo reclamar el aviso de la tarea', { cause: error })
  return data
}
