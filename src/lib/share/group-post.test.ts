// Covers: US1, US2, US3 y US4 de la #248: cuándo se ofrece el texto para el grupo y qué lleva.
import { describe, expect, it } from 'vitest'
import type { GroupPostParts } from './group-post'
import {
  groupPostText,
  offersLitterGroupPost,
  offersPetGroupPost,
  receivesApplications,
} from './group-post'

const LUNA: GroupPostParts = {
  urgent: null,
  title: 'Luna en adopción',
  inProcess: null,
  facts: 'Perra, 2 años. Tamaño mediano. Castrada. Vacunas al día. Con chip.',
  livesWith: 'Convive con perros.',
  zone: 'Pocitos, Montevideo',
  description: 'Es muy mimosa.\n\nLe encanta correr.',
  young: [],
  publisher: 'Quien publica tiene la identidad verificada.',
  invite: 'Si querés adoptarla, pedila desde este enlace:',
  url: 'https://sitio.test/animales/k3x9p2qa7m?desde=compartir',
}

describe('receivesApplications', () => {
  it.each(['available', 'in_process'] as const)('%s recibe solicitudes', (state) => {
    expect(receivesApplications(state)).toBe(true)
  })

  it.each(['paused', 'expired', 'taken_down', 'adopted'] as const)('%s no', (state) => {
    expect(receivesApplications(state)).toBe(false)
  })
})

describe('offersPetGroupPost', () => {
  const own = { isOwner: true, visibility: 'listed', state: 'available' } as const

  it('a quien lo publicó, disponible o en proceso', () => {
    expect(offersPetGroupPost(own)).toBe(true)
    expect(offersPetGroupPost({ ...own, state: 'in_process' })).toBe(true)
  })

  it('a quien visita, nunca', () => {
    expect(offersPetGroupPost({ ...own, isOwner: false })).toBe(false)
  })

  it('sin el teléfono verificado hoy (la ficha no se ve), no', () => {
    expect(offersPetGroupPost({ ...own, visibility: 'hidden' })).toBe(false)
  })

  it.each(['paused', 'expired', 'taken_down', 'adopted'] as const)('%s, no', (state) => {
    expect(offersPetGroupPost({ ...own, state })).toBe(false)
  })

  it('adoptado sigue a la vista pero no recibe solicitudes', () => {
    expect(offersPetGroupPost({ ...own, visibility: 'adopted', state: 'adopted' })).toBe(false)
  })
})

describe('offersLitterGroupPost', () => {
  const nala = {
    isOwner: true,
    visibility: 'listed',
    state: 'available',
    young: [{ state: 'adopted' }, { state: 'available' }],
  } as const

  it('con una cría que recibe solicitudes, a quien la publicó', () => {
    expect(offersLitterGroupPost(nala)).toBe(true)
    expect(offersLitterGroupPost({ ...nala, young: [{ state: 'in_process' }] })).toBe(true)
  })

  it('si ninguna cría recibe solicitudes, no', () => {
    expect(offersLitterGroupPost({ ...nala, young: [{ state: 'adopted' }] })).toBe(false)
  })

  it('a quien visita, no', () => {
    expect(offersLitterGroupPost({ ...nala, isOwner: false })).toBe(false)
  })

  it('oculta, no', () => {
    expect(offersLitterGroupPost({ ...nala, visibility: 'hidden' })).toBe(false)
  })

  it.each(['paused', 'expired', 'adopted', 'taken_down'] as const)('%s, no', (state) => {
    expect(offersLitterGroupPost({ ...nala, state })).toBe(false)
  })
})

describe('groupPostText', () => {
  it('lleva cada dato, la descripción entera, el nivel, la invitación y el enlace', () => {
    expect(groupPostText(LUNA)).toBe(
      [
        'Luna en adopción',
        '',
        'Perra, 2 años. Tamaño mediano. Castrada. Vacunas al día. Con chip.',
        'Convive con perros.',
        'Pocitos, Montevideo',
        '',
        'Es muy mimosa.',
        '',
        'Le encanta correr.',
        '',
        'Quien publica tiene la identidad verificada.',
        'Si querés adoptarla, pedila desde este enlace:',
        'https://sitio.test/animales/k3x9p2qa7m?desde=compartir',
      ].join('\n'),
    )
  })

  it('urgente arranca con «Urgente»; en proceso lo dice debajo del título', () => {
    const text = groupPostText({
      ...LUNA,
      urgent: 'Urgente',
      inProcess: 'Ya hay una familia en proceso y se siguen recibiendo solicitudes.',
    })
    expect(text.startsWith('Urgente\nLuna en adopción\nYa hay una familia en proceso')).toBe(true)
  })

  it('sin descripción ni convivencia conocida no deja renglones vacíos de más', () => {
    expect(groupPostText({ ...LUNA, description: null, livesWith: '' })).toBe(
      [
        'Luna en adopción',
        '',
        'Perra, 2 años. Tamaño mediano. Castrada. Vacunas al día. Con chip.',
        'Pocitos, Montevideo',
        '',
        'Quien publica tiene la identidad verificada.',
        'Si querés adoptarla, pedila desde este enlace:',
        'https://sitio.test/animales/k3x9p2qa7m?desde=compartir',
      ].join('\n'),
    )
  })

  it('una descripción de puros espacios cuenta como ninguna', () => {
    expect(groupPostText({ ...LUNA, description: '  \n ' })).not.toContain('\n\n\n')
    expect(groupPostText({ ...LUNA, description: '  Mimosa.  ' })).toContain('\n\nMimosa.\n\n')
  })

  it('de una camada, cuántas quedan y una línea por cría, antes del enlace', () => {
    const text = groupPostText({
      ...LUNA,
      title: 'La camada de Nala en adopción',
      description: null,
      young: ['Quedan 2 crías:', '- Tomás, macho', '- Coco, macho (en proceso)'],
      publisher: null,
    })
    expect(text).toContain(
      'Pocitos, Montevideo\n\nQuedan 2 crías:\n- Tomás, macho\n- Coco, macho (en proceso)\n\nSi querés',
    )
  })
})
