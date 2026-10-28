import { describe, expect, it } from 'vitest'
import { findWatched, scanMessages } from './watched-phrases.mjs'

const patterns = (text) => findWatched(text).map(({ pattern }) => pattern)

describe('las frases vigiladas de la guía sin vicios', () => {
  it('marca un contraste armado y dice cuál es la frase', () => {
    expect(findWatched('El compromiso no es un contrato: es la palabra de las dos.')).toEqual([
      { pattern: 'contraste armado', phrase: 'no es un contrato: es' },
    ])
  })

  it('marca «no solo… sino» y «no se trata de… sino»', () => {
    expect(patterns('No solo adoptás un perro, sino una familia.')).toContain('contraste armado')
    expect(patterns('No se trata de publicar, sino de encontrar casa.')).toContain(
      'contraste armado',
    )
  })

  it('marca un título que no dice nada, y deja uno que nombra lo que contiene', () => {
    expect(patterns('Lo que queda')).toEqual(['título que no dice nada'])
    expect(patterns('Lo que no promete')).toEqual(['título que no dice nada'])
    expect(patterns('Lo que contestaste')).toEqual([])
    expect(patterns('Lo que queda guardado de tu pedido')).toEqual([])
  })

  it('marca la importancia inflada sin confundirla con otra palabra', () => {
    expect(patterns('Es un paso clave para adoptar.')).toEqual(['importancia inflada'])
    expect(patterns('Es fundamental verificar.')).toEqual(['importancia inflada'])
    expect(patterns('Elegí las claves del enclave.')).toEqual([])
  })

  it('marca las muletillas y los restos de chatbot', () => {
    expect(patterns('Cabe destacar que es gratis.')).toEqual(['muletilla'])
    expect(patterns('A la hora de adoptar, mirá el perfil.')).toEqual(['muletilla'])
    expect(patterns('¡Ups! Algo salió mal.')).toEqual(['resto de chatbot', 'resto de chatbot'])
    expect(patterns('No dudes en escribirnos.')).toEqual(['resto de chatbot'])
  })

  it('marca la cola negativa, el gerundio colgado y la negrita de decoración', () => {
    expect(patterns('Adoptá sin vueltas.')).toEqual(['cola negativa'])
    expect(patterns('Luna llegó en marzo, convirtiéndose en la reina.')).toEqual([
      'gerundio colgado',
    ])
    expect(patterns('Es **gratis** para todos.')).toEqual(['negrita decorativa'])
    expect(patterns('Es <strong>gratis</strong>.')).toEqual(['negrita decorativa'])
  })

  it('no marca una frase citada a propósito', () => {
    expect(findWatched('Hay quien pide «no es un depósito, es una seña» por adelantado.')).toEqual(
      [],
    )
    expect(findWatched('La estafa dice "a la hora de pagar, mandá el flete".')).toEqual([])
  })

  it('una frase vigilada fuera de la cita se marca igual', () => {
    expect(patterns('Cabe destacar que «pagá el flete y te lo mando» es una estafa.')).toEqual([
      'muletilla',
    ])
  })

  it('un texto llano no tiene hallazgos', () => {
    expect(findWatched('Te mandamos un enlace al correo y entrás con un toque.')).toEqual([])
  })
})

describe('el recorrido de los mensajes', () => {
  it('nombra la clave completa de cada hallazgo', () => {
    const messages = {
      home: { title: 'Perros en adopción', lead: 'Cabe destacar que es gratis.' },
      about: { sections: { why: { title: 'Lo que importa' } } },
      count: 3,
    }
    expect(scanMessages(messages)).toEqual([
      { key: 'home.lead', pattern: 'muletilla', phrase: 'Cabe destacar' },
      {
        key: 'about.sections.why.title',
        pattern: 'título que no dice nada',
        phrase: 'Lo que importa',
      },
    ])
  })
})
