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

  // Este caso probaba que --user todavía no existía. La historia #9 lo construyó, así que cambió
  // de sujeto: ahora prueba la opción, que es lo que hay que sostener de acá en adelante.
  it('--user recorre con sesión, y admite elegir a qué persona sembrada', () => {
    const anonima = parseArgs(['--story', 'scaffold'])
    expect(anonima.user).toBe(false)
    expect(anonima.userEmail).toBeUndefined()

    const conSesion = parseArgs(['--story', 'scaffold', '--user'])
    expect(conSesion.user).toBe(true)
    expect(conSesion.userEmail).toBeUndefined()

    const otraPersona = parseArgs(['--story', 'scaffold', '--user', 'nueva@example.test'])
    expect(otraPersona.user).toBe(true)
    expect(otraPersona.userEmail).toBe('nueva@example.test')
    expect(otraPersona.error).toBeUndefined()
  })

  it('--user seguido de una ruta no se come la ruta', () => {
    const parsed = parseArgs(['--story', 'scaffold', '--user', '/mi-perfil'])
    expect(parsed.userEmail).toBeUndefined()
    expect(parsed.routes).toEqual(['/mi-perfil'])
  })

  it('un argumento que no entiende es invocación inválida, no una corrida de la portada', () => {
    expect(parseArgs(['--story', 'scaffold', 'muestra']).error).toContain('empiezan con')
    expect(parseArgs(['--story', 'scaffold', '--desktpo', '/muestra']).error).toContain('--desktpo')
  })

  it('una ruta reescrita por Git Bash dice cómo evitarlo', () => {
    expect(parseArgs(['--story', 'scaffold', 'C:/Program Files/Git/muestra']).error).toContain(
      'MSYS_NO_PATHCONV=1',
    )
  })

  it('el valor de --story no cuenta como argumento suelto', () => {
    expect(parseArgs(['/muestra', '--story', 'scaffold']).error).toBeUndefined()
  })

  it('los cuatro códigos de salida son distintos', () => {
    expect(new Set(Object.values(EXIT)).size).toBe(4)
    expect(EXIT.appDown).toBe(2)
  })
})
