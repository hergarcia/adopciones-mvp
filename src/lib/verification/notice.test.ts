import { describe, expect, it } from 'vitest'
import { screenNotice } from './notice'
import type { PhoneStatus } from './phone-status'

const VERIFIED: PhoneStatus = {
  kind: 'verified',
  number: '+59899123456',
  since: new Date('2026-09-20T14:00:00-03:00'),
}
const NONE: PhoneStatus = { kind: 'none' }

// Covers: FR-015a, FR-018a, US3-AS4. Si se equivoca, le dice a la persona algo que no pasó.
describe('el aviso de la pantalla', () => {
  it('después de cancelar un cambio, el número que sigue verificado', () => {
    expect(screenNotice({ guardado: 'cancelado' }, VERIFIED)).toEqual({
      message: 'cancelled_change',
      variant: 'success',
      number: '099 123 456',
    })
  })

  it('después de cancelar una primera verificación, sin número', () => {
    expect(screenNotice({ guardado: 'cancelado' }, NONE)).toEqual({
      message: 'cancelled_first',
      variant: 'success',
    })
  })

  it('si cancelar falló, un error, aunque venga otra marca', () => {
    expect(screenNotice({ error: 'cancelar', guardado: 'cancelado' }, VERIFIED)).toEqual({
      message: 'cancel_failed',
      variant: 'error',
    })
  })

  it('después de verificar, teléfono verificado', () => {
    expect(screenNotice({ guardado: 'telefono' }, VERIFIED)).toEqual({
      message: 'phone_verified',
      variant: 'success',
    })
  })

  it('las dos marcas de la historia #9 siguen igual', () => {
    expect(screenNotice({ guardado: 'perfil' }, NONE)).toEqual({
      message: 'profile_saved',
      variant: 'success',
    })
    expect(screenNotice({ guardado: 'cambios' }, NONE)).toEqual({
      message: 'profile_changes_saved',
      variant: 'success',
    })
  })

  it('sin marca, o con una desconocida, nada', () => {
    expect(screenNotice({}, VERIFIED)).toBeNull()
    expect(screenNotice({ guardado: 'otra', error: 'otro' }, VERIFIED)).toBeNull()
  })
})
