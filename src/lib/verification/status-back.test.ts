// Covers: #283, «Volver a Mis animales» en el pedido que empezó en la invitación
import { describe, expect, it } from 'vitest'
import { statusBack } from './status-back'

describe('statusBack', () => {
  it('en revisión, el pedido que empezó en la invitación vuelve a «Mis animales»', () => {
    expect(statusBack('in_review', 'my_pets')).toBe('my_pets')
  })

  it('el que empezó en «Mi perfil», o sin origen conocido, vuelve al perfil como hoy', () => {
    expect(statusBack('in_review', 'profile')).toBe('profile')
    expect(statusBack('in_review', null)).toBe('profile')
  })

  it('fuera de revisión vuelve al perfil aunque haya empezado en la invitación', () => {
    expect(statusBack('expired', 'my_pets')).toBe('profile')
    expect(statusBack('approved', 'my_pets')).toBe('profile')
  })
})
