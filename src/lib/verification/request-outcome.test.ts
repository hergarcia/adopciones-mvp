import { describe, expect, it } from 'vitest'
import { requestOutcome, type Delivery, type Reserved } from './request-outcome'

const NOW = new Date('2026-09-22T20:00:00-03:00')
const FORMAT = { timeZone: 'America/Montevideo', locale: 'es' }
const IN_A_MINUTE = new Date(NOW.getTime() + 60_000)
const TOMORROW = new Date('2026-09-23T09:15:00-03:00')

function reserved(overrides: Partial<Reserved>): Reserved {
  return { decision: 'send', retryAt: null, reachedCap: false, reachedSiteCap: false, ...overrides }
}

function outcome(r: Partial<Reserved>, delivery: Delivery | null = null) {
  return requestOutcome({
    reserved: reserved(r),
    delivery,
    number: '099 123 456',
    nextAt: IN_A_MINUTE,
    now: NOW,
    format: FORMAT,
  })
}

// Covers: FR-006a, FR-011, US1-AS1
describe('un pedido que salió y uno frenado en silencio', () => {
  it('responden exactamente lo mismo', () => {
    const sent = outcome({ decision: 'send' }, 'sent').result
    const skipped = outcome({ decision: 'skip' }).result
    expect(skipped).toEqual(sent)
  })

  it('y lo que responden es el número y cuándo se puede pedir otro', () => {
    expect(outcome({ decision: 'send' }, 'sent').result).toEqual({
      ok: true,
      data: { number: '099 123 456', next: { kind: 'seconds', seconds: 60 } },
    })
  })

  it('solo el que salió se mide como código pedido', () => {
    expect(outcome({ decision: 'send' }, 'sent').events).toEqual(['phone_code_requested'])
    expect(outcome({ decision: 'skip' }).events).toEqual([])
  })
})

// Covers: FR-017c, FR-010, FR-010a, FR-011b, US1-AS7, US3-AS5
describe('los frenos que se le dicen a la persona', () => {
  it('el mismo número verificado', () => {
    expect(outcome({ decision: 'same_number' })).toEqual({
      result: { ok: false, error: 'verification.errors.same_number' },
      events: [],
    })
  })

  it('la espera, con los segundos que faltan', () => {
    expect(outcome({ decision: 'wait', retryAt: new Date(NOW.getTime() + 42_000) })).toEqual({
      result: {
        ok: false,
        error: 'verification.errors.wait',
        detail: { retry: { kind: 'seconds', seconds: 42 } },
      },
      events: [],
    })
  })

  it('el tope diario y el techo del sitio, con el día y la hora', () => {
    const daily = outcome({ decision: 'daily_cap', retryAt: TOMORROW }).result
    expect(daily).toMatchObject({
      ok: false,
      error: 'verification.errors.daily_cap',
      detail: { retry: { kind: 'at', day: 'tomorrow', time: '9:15' } },
    })
    const site = outcome({ decision: 'site_cap', retryAt: TOMORROW }).result
    expect(site).toMatchObject({ ok: false, error: 'verification.errors.site_cap' })
  })

  it('chocar con un freno no se mide: el tope se mide al llegar a él', () => {
    expect(outcome({ decision: 'daily_cap', retryAt: TOMORROW, reachedCap: true }).events).toEqual(
      [],
    )
  })
})

// Covers: FR-002a, FR-009a, FR-009e, US1-AS12
describe('cuando el mensaje no salió', () => {
  it('rechazado por el número: que lo revise, y cuándo puede pedir otro, porque contó', () => {
    expect(outcome({ decision: 'send' }, 'rejected').result).toEqual({
      ok: false,
      error: 'verification.errors.number_unreachable',
      detail: { retry: { kind: 'seconds', seconds: 60 } },
    })
  })

  it('una falla del servicio: que no salió y no es su culpa', () => {
    expect(outcome({ decision: 'send' }, 'failed')).toEqual({
      result: { ok: false, error: 'verification.errors.send_failed' },
      events: [],
    })
  })

  it('sin resultado de entrega, igual que una falla', () => {
    expect(outcome({ decision: 'send' }, null).result).toEqual({
      ok: false,
      error: 'verification.errors.send_failed',
    })
  })

  it('salió y no se pudo anotar: no se sabe, y no se dice ni una cosa ni la otra', () => {
    expect(outcome({ decision: 'send' }, 'settle_failed')).toEqual({
      result: { ok: false, error: 'verification.errors.request_unknown' },
      events: [],
    })
  })
})

// Covers: FR-024
describe('el tope diario y el techo alcanzados', () => {
  it('con el pedido que salió, se miden los dos', () => {
    expect(
      outcome({ decision: 'send', reachedCap: true, reachedSiteCap: true }, 'sent').events,
    ).toEqual(['phone_code_requested', 'phone_code_cap_reached', 'phone_site_cap_reached'])
  })

  it('con uno frenado en silencio, también: cuenta para los dos', () => {
    expect(outcome({ decision: 'skip', reachedCap: true, reachedSiteCap: true }).events).toEqual([
      'phone_code_cap_reached',
      'phone_site_cap_reached',
    ])
  })

  it('con uno rechazado, el tope sí y el techo no: no mandó nada', () => {
    expect(
      outcome({ decision: 'send', reachedCap: true, reachedSiteCap: true }, 'rejected').events,
    ).toEqual(['phone_code_cap_reached'])
  })

  it('con uno que falló, ninguno: no contó', () => {
    expect(
      outcome({ decision: 'send', reachedCap: true, reachedSiteCap: true }, 'failed').events,
    ).toEqual([])
  })

  it('sin llegar a nada, solo el pedido', () => {
    expect(outcome({ decision: 'send', reachedSiteCap: true }, 'sent').events).toEqual([
      'phone_code_requested',
      'phone_site_cap_reached',
    ])
    expect(outcome({ decision: 'send', reachedCap: true }, 'sent').events).toEqual([
      'phone_code_requested',
      'phone_code_cap_reached',
    ])
  })
})
