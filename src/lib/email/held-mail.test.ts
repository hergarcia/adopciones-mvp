// Covers: #289 US2-AS1, US2-AS5, US3-AS1, US3-AS2, US3-AS6, FR-033, FR-034, FR-035 (los correos de
// resultado de la identidad con las que esperaban)
import { describe, expect, it } from 'vitest'
import {
  heldApprovedParagraphs,
  heldCappedParagraphs,
  heldUntilParagraphs,
  type HeldMailTexts,
} from './held-mail'

const t: HeldMailTexts = (key, values) => `${key}:${JSON.stringify(values)}`
const format = {
  day: (value: string) => `día ${value}`,
  list: (names: string[]) => names.join(' y '),
}

describe('heldApprovedParagraphs', () => {
  it('las que salieron van juntas, con cuántas son', () => {
    expect(
      heldApprovedParagraphs(
        [
          { name: 'Tobi', outcome: 'released', until: null },
          { name: 'Pipo', outcome: 'released', until: null },
        ],
        true,
        t,
        format,
      ),
    ).toEqual(['held_released:{"count":2,"names":"Tobi y Pipo"}'])
  })

  it('cada una que sigue esperando dice hasta qué día; con nivel 2, porque el animal no recibe', () => {
    expect(
      heldApprovedParagraphs(
        [
          { name: 'Tobi', outcome: 'waiting', until: '2026-11-16' },
          { name: 'Luna', outcome: 'waiting', until: '2026-11-17' },
        ],
        true,
        t,
        format,
      ),
    ).toEqual([
      'held_waiting:{"name":"Tobi","date":"día 2026-11-16"}',
      'held_waiting:{"name":"Luna","date":"día 2026-11-17"}',
    ])
  })

  it('sin el teléfono vigente, lo que falta es confirmarlo', () => {
    expect(
      heldApprovedParagraphs(
        [{ name: 'Tobi', outcome: 'waiting', until: '2026-11-16' }],
        false,
        t,
        format,
      ),
    ).toEqual(['held_waiting_phone:{"name":"Tobi","date":"día 2026-11-16"}'])
  })

  it('mezcla: primero las que salieron, después las que esperan; la que venció no se nombra', () => {
    expect(
      heldApprovedParagraphs(
        [
          { name: 'Pipo', outcome: 'waiting', until: '2026-11-12' },
          { name: 'Tobi', outcome: 'released', until: null },
          { name: 'Michi', outcome: 'lapsed', until: '2026-11-10' },
        ],
        true,
        t,
        format,
      ),
    ).toEqual([
      'held_released:{"count":1,"names":"Tobi"}',
      'held_waiting:{"name":"Pipo","date":"día 2026-11-12"}',
    ])
  })

  it('una que espera sin último día no se nombra', () => {
    expect(
      heldApprovedParagraphs([{ name: 'Tobi', outcome: 'waiting', until: null }], true, t, format),
    ).toEqual([])
  })

  it('sin ninguna, no agrega nada', () => {
    expect(heldApprovedParagraphs([], true, t, format)).toEqual([])
  })
})

describe('heldUntilParagraphs', () => {
  // Covers: #289 US3-AS1, US3-AS2
  it('rechazada o vencida: cada una que sigue esperando dice hasta qué día', () => {
    expect(
      heldUntilParagraphs(
        [
          { name: 'Tobi', outcome: 'waiting', until: '2026-11-16' },
          { name: 'Luna', outcome: 'waiting', until: '2026-11-17' },
        ],
        t,
        format,
      ),
    ).toEqual([
      'held_waiting:{"name":"Tobi","date":"día 2026-11-16"}',
      'held_waiting:{"name":"Luna","date":"día 2026-11-17"}',
    ])
  })

  it('ni las que salieron, ni las que no van a salir, ni una sin último día', () => {
    expect(
      heldUntilParagraphs(
        [
          { name: 'Tobi', outcome: 'released', until: null },
          { name: 'Pipo', outcome: 'lapsed', until: '2026-11-12' },
          { name: 'Michi', outcome: 'waiting', until: null },
        ],
        t,
        format,
      ),
    ).toEqual([])
    expect(heldUntilParagraphs([], t, format)).toEqual([])
  })
})

describe('heldCappedParagraphs', () => {
  // Covers: #289 US3-AS6
  it('con el tope, todas juntas, con cuántas son, y que no van a salir', () => {
    expect(
      heldCappedParagraphs(
        [
          { name: 'Tobi', outcome: 'lapsed', until: null },
          { name: 'Pipo', outcome: 'waiting', until: '2026-11-12' },
          { name: 'Luna', outcome: 'lapsed', until: null },
        ],
        t,
        format,
      ),
    ).toEqual(['held_capped:{"count":2,"names":"Tobi y Luna"}'])
  })

  it('sin ninguna cerrada, no agrega nada', () => {
    expect(
      heldCappedParagraphs([{ name: 'Tobi', outcome: 'released', until: null }], t, format),
    ).toEqual([])
    expect(heldCappedParagraphs([], t, format)).toEqual([])
  })
})
