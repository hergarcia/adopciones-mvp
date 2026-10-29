// Covers: historia #257 US4-AS1, US4-AS2, US4-AS3, US4-AS5, FR-033, FR-034, FR-036
import { describe, expect, it } from 'vitest'
import { identityAskResolvedEvents, identityAskSentEvent } from './identity-ask-events'

describe('identityAskSentEvent', () => {
  it('con el nivel de quien publicó y la marca de camada', () => {
    expect(identityAskSentEvent({ litter: true, publisherLevel: 1 })).toEqual({
      name: 'identity_ask_sent',
      props: { litter: true, publisher_level: 1 },
    })
    expect(identityAskSentEvent({ litter: false, publisherLevel: 0 })).toEqual({
      name: 'identity_ask_sent',
      props: { litter: false, publisher_level: 0 },
    })
  })

  it('sin nivel cuando no se pudo leer, nunca uno por defecto', () => {
    expect(identityAskSentEvent({ litter: false, publisherLevel: null })).toEqual({
      name: 'identity_ask_sent',
      props: { litter: false },
    })
  })

  it('no lleva ids: solo el nivel y la camada', () => {
    const { props } = identityAskSentEvent({ litter: true, publisherLevel: 2 })
    expect(Object.keys(props ?? {}).toSorted()).toEqual(['litter', 'publisher_level'])
  })
})

describe('identityAskResolvedEvents', () => {
  it('uno por pedido resuelto, cada uno con el nivel de quien lo pidió', () => {
    expect(identityAskResolvedEvents([1, 2])).toEqual([
      { name: 'identity_ask_resolved', props: { publisher_level: 1 } },
      { name: 'identity_ask_resolved', props: { publisher_level: 2 } },
    ])
  })

  it('dos pedidos del mismo nivel son dos momentos', () => {
    expect(identityAskResolvedEvents([0, 0])).toEqual([
      { name: 'identity_ask_resolved', props: { publisher_level: 0 } },
      { name: 'identity_ask_resolved', props: { publisher_level: 0 } },
    ])
  })

  it('ninguno cuando la aprobación no resolvió pedidos', () => {
    expect(identityAskResolvedEvents([])).toEqual([])
  })

  it('sin nivel cuando no se pudo leer, pero el momento llega igual', () => {
    expect(identityAskResolvedEvents([null, 3])).toEqual([
      { name: 'identity_ask_resolved', props: {} },
      { name: 'identity_ask_resolved', props: { publisher_level: 3 } },
    ])
  })

  it('no lleva ids: solo el nivel', () => {
    const [event] = identityAskResolvedEvents([2])
    expect(Object.keys(event?.props ?? {})).toEqual(['publisher_level'])
  })
})
