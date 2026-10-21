// Covers: US4-AS1 (la pantalla del aviso), FR-033. La pantalla viaja con su nombre: nunca un segmento
// de la dirección, que lleva el código de una ficha, el id de una persona o el de una solicitud.
import { describe, expect, it } from 'vitest'
import { screenName } from './screen-name'

describe('screenName: cada pantalla por su dirección', () => {
  it.each([
    ['/', 'home'],
    ['/animales', 'listing'],
    ['/animales/4k2m9x7q1z', 'pet_sheet'],
    ['/niveles', 'levels'],
    ['/nosotros', 'about'],
    ['/perfil/a1b2c3', 'public_profile'],
    ['/preguntas', 'questions'],
    ['/preguntas/como-adoptar', 'question'],
    ['/sigue-disponible/tok/listo', 'still_available'],
    ['/opinar', 'feedback'],
    ['/cuenta-suspendida', 'suspended_account'],
    ['/completar-perfil', 'complete_profile'],
    ['/cuenta-borrada', 'account_deleted'],
    ['/entrar', 'sign_in'],
    ['/entrar/enlace', 'sign_in_link'],
    ['/entrar/revisa-tu-correo', 'check_email'],
    ['/administrar', 'admin'],
    ['/administrar/personas/p-123', 'admin_person'],
    ['/mi-perfil', 'profile'],
    ['/mi-perfil/editar', 'edit_profile'],
    ['/mis-animales', 'my_pets'],
    ['/mis-animales/publicar', 'publish_pet'],
    ['/mis-animales/6d1f5f0e', 'my_pet'],
    ['/mis-animales/6d1f5f0e/editar', 'edit_pet'],
    ['/mis-animales/6d1f5f0e/adoptado', 'pet_adopted'],
    ['/mis-avales', 'my_vouches'],
    ['/mis-bloqueos', 'my_blocks'],
    ['/mis-solicitudes', 'my_applications'],
    ['/mis-solicitudes/6d1f5f0e', 'my_application'],
    ['/revision', 'review'],
    ['/revision/6d1f5f0e', 'review_request'],
    ['/revision/encuestas', 'review_surveys'],
    ['/revision/opiniones', 'review_feedback'],
    ['/revision/publicaciones', 'review_pets'],
    ['/revision/reportes', 'review_reports'],
    ['/revision/suspendidas', 'review_suspended'],
    ['/solicitar/4k2m9x7q1z', 'apply'],
    ['/solicitar/4k2m9x7q1z/enviada', 'application_sent'],
    ['/solicitudes', 'inbox'],
    ['/solicitudes/6d1f5f0e', 'inbox_application'],
    ['/solicitudes/animal/6d1f5f0e', 'inbox_pet'],
    ['/verificar-identidad', 'identity_request'],
    ['/verificar-telefono', 'phone_verification'],
    ['/verificar-telefono/codigo', 'phone_code'],
    ['/verificar-telefono/en-otra-cuenta', 'phone_in_other_account'],
    ['/verificar-telefono/no-se-puede-usar', 'phone_unusable'],
    ['/verificar-telefono/quedarme', 'phone_keep'],
    ['/muestra', 'samples'],
  ])('%s → %s', (path, screen) => {
    expect(screenName(path)).toBe(screen)
  })
})

describe('screenName: las dos formas de una ruta', () => {
  it('la del archivo, como la da onRequestError, y la dirección real dan la misma pantalla', () => {
    expect(screenName('/app/[locale]/(public)/animales/[code]')).toBe('pet_sheet')
    expect(screenName('/animales/4k2m9x7q1z')).toBe('pet_sheet')
    expect(screenName('/[locale]/(app)/administrar/personas/[publicId]/page')).toBe('admin_person')
  })

  it('con y sin el prefijo de idioma, y con la barra final', () => {
    expect(screenName('/es/animales/4k2m9x7q1z')).toBe('pet_sheet')
    expect(screenName('/es')).toBe('home')
    expect(screenName('/animales/')).toBe('listing')
  })

  it('el idioma es solo el primer segmento', () => {
    expect(screenName('/animales/es')).toBe('pet_sheet')
    expect(screenName('/mis-animales/es/editar')).toBe('edit_pet')
  })

  it('app es solo el primer segmento', () => {
    expect(screenName('/animales/app')).toBe('pet_sheet')
  })

  it('page y route al final son el archivo, no un segmento de la ruta', () => {
    expect(screenName('/[locale]/(public)/animales/[code]/page')).toBe('pet_sheet')
    expect(screenName('/app/[locale]/(public)/perfil/[id]/route')).toBe('public_profile')
    expect(screenName('/[locale]/(public)/animales/page/[code]')).toBe('other_screen')
  })

  it('un grupo es un segmento entero entre paréntesis', () => {
    expect(screenName('/perfil/a(b)')).toBe('public_profile')
    expect(screenName('/perfil/(a)b')).toBe('public_profile')
    expect(screenName('/(public)/perfil/(a)/b')).toBe('public_profile')
  })

  it('una ruta de una tarea no es ninguna pantalla', () => {
    expect(screenName('/app/api/cron/publicaciones/route')).toBe('no_screen')
    expect(screenName('/api/cron/resumen')).toBe('no_screen')
  })
})

describe('screenName: lo que no es una pantalla conocida', () => {
  it.each([
    '/no-existe',
    '/animales/4k2m9x7q1z/fotos',
    '/administrar/personas',
    '/api/animales',
    '/api/cron',
    '/api/cron/a/b',
  ])('%s → other_screen', (path) => {
    expect(screenName(path)).toBe('other_screen')
  })

  it('nunca devuelve un segmento de la dirección', () => {
    expect(screenName('/ana-perez')).toBe('other_screen')
    expect(screenName('/perfil/ana-perez/avales')).toBe('other_screen')
  })
})
