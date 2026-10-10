// Covers: US3-AS1, FR-021, contracts/servicios.md §1. Lo que sale a un tercero es lo que más expone
// si se rompe: nada que una visitas, ni la persona, ni su conexión, ni su ubicación.
import { describe, expect, it } from 'vitest'
import { posthogEvent } from './posthog'

const NOW = new Date('2026-10-10T15:04:05.000Z')
const base = {
  key: 'phc_clave',
  event: 'pet_viewed' as const,
  props: { origin: 'shared' },
  visit: 'v-123',
  environment: 'production',
  now: NOW,
}

describe('posthogEvent', () => {
  it('es exactamente el cuerpo del contrato', () => {
    expect(posthogEvent(base)).toStrictEqual({
      api_key: 'phc_clave',
      event: 'pet_viewed',
      distinct_id: 'v-123',
      timestamp: '2026-10-10T15:04:05.000Z',
      properties: {
        origin: 'shared',
        $process_person_profile: false,
        $geoip_disable: true,
        entorno: 'production',
      },
    })
  })

  it('un momento sin propiedades lleva solo las fijas, con su entorno', () => {
    expect(
      posthogEvent({ ...base, event: 'home_viewed', props: undefined, environment: 'preview' })
        .properties,
    ).toStrictEqual({ $process_person_profile: false, $geoip_disable: true, entorno: 'preview' })
  })

  it('una propiedad del momento con el nombre de una fija no la pisa', () => {
    const props = { entorno: 'otro', $process_person_profile: true, $geoip_disable: false }
    expect(posthogEvent({ ...base, props }).properties).toStrictEqual({
      $process_person_profile: false,
      $geoip_disable: true,
      entorno: 'production',
    })
  })

  it('nunca sale una propiedad reservada de PostHog: ni conexión, ni dirección, ni persona', () => {
    const props = {
      origin: 'shared',
      $ip: '190.64.1.1',
      $current_url: 'https://sitio/animales/AB12',
      $referrer: 'https://l.facebook.com/',
      $set: { email: 'ana@example.test' },
      $set_once: { phone: '099123456' },
      $user_id: 'u-1',
    }
    expect(Object.keys(posthogEvent({ ...base, props }).properties)).toStrictEqual([
      'origin',
      '$process_person_profile',
      '$geoip_disable',
      'entorno',
    ])
  })
})
