import { describe, expect, it } from 'vitest'
import { staleTasks } from './stale-tasks'
import { TASKS, type TaskName } from './tasks'

const NOW = new Date('2026-10-12T13:00:00.000Z')
const MINUTE = 60_000

const ago = (minutes: number, seconds = 0) =>
  new Date(NOW.getTime() - minutes * MINUTE - seconds * 1000)

/** Todas las tareas con su vuelta recién hecha, salvo las que se pisan. */
function runs(overrides: Partial<Record<TaskName, Date>> = {}) {
  return TASKS.map(({ name }) => ({ task: name, lastOkAt: overrides[name] ?? NOW }))
}

// Covers: FR-043, spec §Edge Cases «Una tarea que no corrió». Avisar de más es ruido que el equipo
// aprende a ignorar; de menos, una promesa a las personas que se rompe sin que nadie se entere.
describe('qué tarea se pasó de su plazo', () => {
  it('con todas las vueltas al día no avisa ninguna', () => {
    expect(staleTasks(runs(), NOW)).toEqual([])
  })

  it.each([
    ['pet-lifecycle', 10],
    ['identity-expire', 10],
    ['identity-expiry-mail', 10],
    ['follow-ups', 120],
    ['admin-digest', 1500],
    ['phone-records-purge', 1500],
    ['daily-cleanup', 1500],
    ['vigilancia-diaria', 1560],
  ] as const)('%s: justo a los %i minutos no avisa; un segundo después sí', (task, minutes) => {
    expect(staleTasks(runs({ [task]: ago(minutes) }), NOW)).toEqual([])

    const since = ago(minutes, 1)
    expect(staleTasks(runs({ [task]: since }), NOW)).toEqual([{ task, since }])
  })

  it('una tarea sin ninguna vuelta anotada está atrasada desde ahora', () => {
    const missing = runs().filter((run) => run.task !== 'follow-ups')
    expect(staleTasks(missing, NOW)).toEqual([{ task: 'follow-ups', since: NOW }])
  })

  it('la vuelta de una tarea que ya no existe no avisa', () => {
    expect(staleTasks([...runs(), { task: 'tarea-vieja', lastOkAt: ago(100_000) }], NOW)).toEqual(
      [],
    )
  })

  it('avisa cada tarea atrasada, en el orden de la lista', () => {
    const since = ago(2000)
    expect(staleTasks(runs({ 'admin-digest': since, 'pet-lifecycle': since }), NOW)).toEqual([
      { task: 'pet-lifecycle', since },
      { task: 'admin-digest', since },
    ])
  })
})
