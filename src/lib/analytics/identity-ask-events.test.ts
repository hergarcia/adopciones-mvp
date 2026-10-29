// Covers: historia #257 US4-AS1, US4-AS5, FR-033, FR-036 (el momento de pedir la identidad)
import { describe, expect, it } from 'vitest'
import { identityAskSentEvent } from './identity-ask-events'

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
