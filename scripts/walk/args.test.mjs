import { describe, expect, it } from 'vitest'
import { EXIT, parseArgs } from './args.mjs'

describe('argumentos del driver', () => {
  it('sin rutas recorre solo la portada', () => {
    expect(parseArgs(['--story', 'scaffold']).routes).toEqual(['/'])
  })

  it('toma las rutas que le pasan, sin repetir', () => {
    expect(parseArgs(['--story', 'scaffold', '/', '/muestra', '/']).routes).toEqual([
      '/',
      '/muestra',
    ])
  })

  it('lee --desktop y --headed', () => {
    const parsed = parseArgs(['--story', 'scaffold', '--desktop', '--headed'])
    expect(parsed.desktop).toBe(true)
    expect(parsed.headed).toBe(true)
  })

  it('sin --story es invocación inválida', () => {
    expect(parseArgs([]).error).toContain('--story')
    expect(parseArgs(['--story', '--desktop']).error).toContain('--story')
  })

  it('un slug inválido es invocación inválida', () => {
    expect(parseArgs(['--story', 'Scaffold Y Compuertas']).error).toContain('no sirve')
    expect(parseArgs(['--story', '-malo-']).error).toContain('no sirve')
  })

  it('--user falla diciendo con qué historia llega', () => {
    expect(parseArgs(['--story', 'scaffold', '--user', 'a@b.c']).error).toContain(
      'registro e ingreso',
    )
  })

  it('los cuatro códigos de salida son distintos', () => {
    expect(new Set(Object.values(EXIT)).size).toBe(4)
    expect(EXIT.appDown).toBe(2)
  })
})
