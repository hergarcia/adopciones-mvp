import { describe, expect, it } from 'vitest'
import { taskAlerts } from './task-alerts'
import { TASKS, type TaskName } from './tasks'

const NOW = new Date('2026-10-12T13:00:00.000Z')
const MINUTE = 60_000
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * MINUTE)

/** Todas las tareas con su vuelta recién hecha, salvo las que se pisan. */
function runs(overrides: Partial<Record<TaskName, Date>> = {}) {
  return TASKS.map(({ name }) => ({ task: name, lastOkAt: overrides[name] ?? NOW }))
}

// Covers: FR-043, US5-AS3. La base anota la vuelta de una tarea apenas le pide el trabajo a la
// aplicación, sin esperar la respuesta: un secreto que no coincide o la aplicación caída dejan las
// vueltas al día, y solo la respuesta dice que el trabajo no se hizo.
describe('qué avisa la vigilancia', () => {
  it('con las vueltas al día y ninguna llamada fallida no avisa nada', () => {
    expect(taskAlerts(runs(), [], NOW)).toEqual([])
  })

  it('una llamada que la aplicación rechazó, con su respuesta y desde cuándo', () => {
    const calledAt = ago(12)
    expect(taskAlerts(runs(), [{ task: 'admin-digest', statusCode: 401, calledAt }], NOW)).toEqual([
      { task: 'admin-digest', problem: 'la aplicación respondió 401', since: calledAt },
    ])
  })

  it('una llamada sin respuesta', () => {
    const calledAt = ago(3)
    const failed = [{ task: 'pet-lifecycle', statusCode: null, calledAt }]
    expect(taskAlerts(runs(), failed, NOW)).toEqual([
      { task: 'pet-lifecycle', problem: 'la aplicación no respondió', since: calledAt },
    ])
  })

  it('una tarea atrasada sin llamada fallida, desde su última vuelta', () => {
    const since = ago(11)
    expect(taskAlerts(runs({ 'identity-expire': since }), [], NOW)).toEqual([
      { task: 'identity-expire', problem: 'sin vuelta completa', since },
    ])
  })

  it('de una tarea atrasada y con una llamada fallida, avisa solo la llamada', () => {
    const calledAt = ago(1500)
    const failed = [{ task: 'daily-cleanup', statusCode: 500, calledAt }]
    expect(taskAlerts(runs({ 'daily-cleanup': ago(2000) }), failed, NOW)).toEqual([
      { task: 'daily-cleanup', problem: 'la aplicación respondió 500', since: calledAt },
    ])
  })

  it('la llamada de algo que no es una tarea vigilada no avisa', () => {
    const failed = [{ task: 'task-watch', statusCode: 401, calledAt: ago(5) }]
    expect(taskAlerts(runs(), failed, NOW)).toEqual([])
  })

  it('avisa cada tarea en el orden de la lista, sea por la llamada o por la vuelta', () => {
    const calledAt = ago(20)
    const since = ago(30)
    const failed = [
      { task: 'daily-cleanup', statusCode: 401, calledAt },
      { task: 'admin-digest', statusCode: 401, calledAt },
    ]
    expect(taskAlerts(runs({ 'pet-lifecycle': since }), failed, NOW)).toEqual([
      { task: 'pet-lifecycle', problem: 'sin vuelta completa', since },
      { task: 'admin-digest', problem: 'la aplicación respondió 401', since: calledAt },
      { task: 'daily-cleanup', problem: 'la aplicación respondió 401', since: calledAt },
    ])
  })
})
