// Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-014, US1-AS1, US2-AS4, US2-AS5, US2-AS6
// Covers (#201): FR-018, FR-019, US1-AS1 («Nosotros» último en Confianza, nunca en la cuenta suspendida)
import { describe, expect, it } from 'vitest'
import { ABOUT_PATH } from '@/lib/about/page'
import { FEEDBACK_PATH } from '@/lib/feedback/screens'
import { LISTING_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import { LEVELS_PATH } from '@/lib/profile/public-paths'
import { QUESTIONS_PATH } from '@/lib/questions/paths'
import { footerGroups } from './groups'

const SUPPORT = '/api/soporte/whatsapp'

const animals = {
  id: 'animals',
  links: [
    { id: 'listing', href: LISTING_PATH, external: false },
    { id: 'publish', href: PUBLISH_PATH, external: false },
  ],
}

const trust = {
  id: 'trust',
  links: [
    { id: 'levels', href: LEVELS_PATH, external: false },
    { id: 'questions', href: QUESTIONS_PATH, external: false },
    { id: 'about', href: ABOUT_PATH, external: false },
  ],
}

const feedback = { id: 'feedback', href: FEEDBACK_PATH, external: false }
const support = { id: 'support', href: SUPPORT, external: true }

describe('footerGroups', () => {
  it('el pie entero: Animales, Confianza y Ayuda, cada uno con sus enlaces en orden', () => {
    expect(footerGroups({ scope: 'site', supportHref: SUPPORT })).toStrictEqual([
      animals,
      trust,
      { id: 'help', links: [feedback, support] },
    ])
  })

  it('sin número de soporte, Ayuda queda con Opinar y sin un lugar vacío', () => {
    expect(footerGroups({ scope: 'site', supportHref: null })).toStrictEqual([
      animals,
      trust,
      { id: 'help', links: [feedback] },
    ])
  })

  it('la cuenta suspendida ve solo Ayuda', () => {
    expect(footerGroups({ scope: 'help', supportHref: SUPPORT })).toStrictEqual([
      { id: 'help', links: [feedback, support] },
    ])
  })

  it('la cuenta suspendida sin número de soporte ve solo Ayuda con Opinar', () => {
    expect(footerGroups({ scope: 'help', supportHref: null })).toStrictEqual([
      { id: 'help', links: [feedback] },
    ])
  })

  it('el WhatsApp va con la ruta propia que recibe, la única que abre afuera', () => {
    const links = footerGroups({ scope: 'site', supportHref: '/otra' }).flatMap((g) => g.links)
    expect(links.filter((link) => link.external)).toStrictEqual([
      { id: 'support', href: '/otra', external: true },
    ])
  })

  it('«Nosotros» va último en Confianza, y la cuenta suspendida no lo ve', () => {
    const ids = (scope: 'site' | 'help') =>
      footerGroups({ scope, supportHref: null }).flatMap((g) => g.links.map((link) => link.id))
    expect(ids('site').at(-2)).toBe('about')
    expect(ids('help')).not.toContain('about')
  })
})
