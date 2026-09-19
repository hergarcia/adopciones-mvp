import { describe, expect, it } from 'vitest'
import {
  MAX_EMAILS_PER_ADDRESS_PER_HOUR,
  planLinkRequest,
  visibleResult,
} from './link-request-policy'
import { MIN_SECONDS_BETWEEN_REQUESTS } from './request-window'

const FREE = { allowed: true } as const
const THROTTLED = { allowed: false, waitSeconds: 42 } as const

// Covers: US1-AS7, US1-AS8, US1-AS9, FR-006, FR-006a, FR-006c
describe('si sale el correo', () => {
  it('sale cuando el navegador puede pedir y la dirección no llegó a su tope', () => {
    expect(planLinkRequest({ window: FREE, emailsToAddressInLastHour: 0 })).toEqual({
      outcome: 'accepted',
      send: true,
    })
  })

  it('sigue saliendo justo debajo del tope de la dirección', () => {
    const plan = planLinkRequest({
      window: FREE,
      emailsToAddressInLastHour: MAX_EMAILS_PER_ADDRESS_PER_HOUR - 1,
    })
    expect(plan).toEqual({ outcome: 'accepted', send: true })
  })

  it('deja de salir exactamente en el tope de la dirección', () => {
    const plan = planLinkRequest({
      window: FREE,
      emailsToAddressInLastHour: MAX_EMAILS_PER_ADDRESS_PER_HOUR,
    })
    expect(plan).toEqual({ outcome: 'accepted', send: false })
  })

  it('pasado el tope tampoco sale', () => {
    const plan = planLinkRequest({
      window: FREE,
      emailsToAddressInLastHour: MAX_EMAILS_PER_ADDRESS_PER_HOUR + 5,
    })
    expect(plan).toEqual({ outcome: 'accepted', send: false })
  })

  it('el tope del propio navegador frena antes de mirar la dirección', () => {
    expect(planLinkRequest({ window: THROTTLED, emailsToAddressInLastHour: 0 })).toEqual({
      outcome: 'wait',
      waitSeconds: 42,
    })
  })
})

// La propiedad que sostiene toda la privacidad del ingreso: escribir la dirección de otra persona
// no puede revelar nada sobre ella. Si este bloque se pone rojo, el producto delata quién tiene
// cuenta y quién pidió un enlace hace poco.
describe('lo que ve quien pide es siempre lo mismo', () => {
  it('no cambia porque el correo haya salido o no', () => {
    const salio = visibleResult({ outcome: 'accepted', send: true })
    const noSalio = visibleResult({ outcome: 'accepted', send: false })
    expect(salio).toEqual(noSalio)
  })

  it('en cualquier estado de la dirección, la respuesta es idéntica', () => {
    const responses = Array.from({ length: MAX_EMAILS_PER_ADDRESS_PER_HOUR + 3 }, (_, count) =>
      visibleResult(planLinkRequest({ window: FREE, emailsToAddressInLastHour: count })),
    )
    expect(new Set(responses.map((r) => JSON.stringify(r))).size).toBe(1)
  })

  it('aceptado, la espera que se anuncia es el minuto del propio navegador', () => {
    expect(visibleResult({ outcome: 'accepted', send: true })).toEqual({
      waitSeconds: MIN_SECONDS_BETWEEN_REQUESTS,
    })
  })

  it('frenado, la espera es la que calculó el navegador con sus propios pedidos', () => {
    expect(visibleResult({ outcome: 'wait', waitSeconds: 42 })).toEqual({ waitSeconds: 42 })
  })
})
