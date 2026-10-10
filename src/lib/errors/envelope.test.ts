// Covers: FR-033, US4-AS1, US4-AS2, US4-AS7, contracts/servicios.md §2. Lo que sale a Sentry es
// exactamente esto: la pantalla, el paso, la hora, qué falló y dónde. Nada de la persona, de su
// pedido ni de las variables del código que la tocó.
import { describe, expect, it } from 'vitest'
import { failureEnvelope } from './envelope'

const NOW = new Date('2026-10-10T15:04:05.000Z')
const DSN = 'https://clavepublica@o4507.ingest.de.sentry.io/4508123'
const base = {
  screen: 'pet_sheet',
  step: 'open_screen',
  environment: 'production',
  now: NOW,
  dsn: DSN,
}

function errorWith(name: string, message: string, stack: string | undefined): Error {
  const error = new Error(message)
  error.name = name
  error.stack = stack
  return error
}

function linesOf(body: string): Record<string, unknown>[] {
  return body.split('\n').map((line): Record<string, unknown> => JSON.parse(line))
}

function eventOf(error: unknown, overrides: Partial<typeof base> = {}) {
  const [, , event] = linesOf(failureEnvelope({ ...base, ...overrides, error }).body)
  return event
}

const STACK = [
  'TypeError: no se pudo leer ana@correo.com at casa.js:1:2',
  '    at Tick (/var/task/.next/server/app/page.js:12:34)',
  '    at new Foo (C:\\Program Files (x86)\\proyecto\\src\\lib\\a.ts:3:4)',
  '    at async Promise.all (index 0)',
  '    at file:///C:/proyecto/node_modules/next/dist/x.js:567:89',
  '\tat run (node:internal/process/task_queues:95:5)',
].join('\n')

describe('failureEnvelope: el pedido', () => {
  it('va a la ingesta del DSN, con su clave pública y sin la secreta', () => {
    const { url, headers } = failureEnvelope({ ...base, error: undefined })
    expect(url).toBe('https://o4507.ingest.de.sentry.io/api/4508123/envelope/')
    expect(headers).toStrictEqual({
      'content-type': 'application/x-sentry-envelope',
      'x-sentry-auth':
        'Sentry sentry_version=7, sentry_key=clavepublica, sentry_client=adopciones/1',
    })
  })

  it('tres líneas: el sobre, el ítem y el evento, con el mismo id', () => {
    const lines = linesOf(failureEnvelope({ ...base, error: undefined }).body)
    expect(lines).toHaveLength(3)
    const [envelope, item, event] = lines
    expect(envelope).toStrictEqual({
      event_id: event?.event_id,
      sent_at: NOW.toISOString(),
      dsn: DSN,
    })
    expect(item).toStrictEqual({ type: 'event' })
    expect(event?.event_id).toMatch(/^[0-9a-f]{32}$/u)
  })

  it('cada aviso lleva su propio id', () => {
    expect(eventOf(undefined)?.event_id).not.toBe(eventOf(undefined)?.event_id)
  })
})

describe('failureEnvelope: el evento', () => {
  it('lleva solo las claves del contrato, con la pantalla, el paso, la hora y dónde', () => {
    const error = errorWith('TypeError', 'Cannot read "nombre" of undefined', undefined)
    expect(eventOf(error, { environment: 'preview' })).toStrictEqual({
      event_id: expect.any(String),
      timestamp: '2026-10-10T15:04:05.000Z',
      platform: 'node',
      level: 'error',
      environment: 'preview',
      message: 'pet_sheet · open_screen',
      tags: { pantalla: 'pet_sheet', paso: 'open_screen' },
      fingerprint: ['pet_sheet', 'open_screen', 'TypeError'],
      exception: { values: [{ type: 'TypeError', value: 'Cannot read … of undefined' }] },
    })
  })

  it('los marcos de la pila, del más viejo al más nuevo, sin variables ni líneas de código', () => {
    const error = errorWith('TypeError', 'no se pudo leer ana@correo.com', STACK)
    expect(eventOf(error)?.exception).toStrictEqual({
      values: [
        {
          type: 'TypeError',
          value: 'no se pudo leer …',
          stacktrace: {
            frames: [
              {
                filename: 'node:internal/process/task_queues',
                function: 'run',
                lineno: 95,
                colno: 5,
              },
              {
                filename: 'node_modules/next/dist/x.js',
                function: '?',
                lineno: 567,
                colno: 89,
              },
              { filename: 'src/lib/a.ts', function: 'new Foo', lineno: 3, colno: 4 },
              { filename: '.next/server/app/page.js', function: 'Tick', lineno: 12, colno: 34 },
            ],
          },
        },
      ],
    })
  })

  it('un Error sin marcos que leer sale sin pila', () => {
    const error = errorWith('RangeError', 'fuera de rango', 'RangeError: fuera de rango')
    expect(eventOf(error)?.exception).toStrictEqual({
      values: [{ type: 'RangeError', value: 'fuera de rango' }],
    })
  })

  it('sin un Error, el tipo es el paso y el valor la descripción limpia, sin pila', () => {
    const event = eventOf('Twilio respondió 500 para 099 123 456', { step: 'request_code' })
    expect(event?.exception).toStrictEqual({
      values: [{ type: 'request_code', value: 'Twilio respondió 500 para …' }],
    })
    expect(event?.fingerprint).toStrictEqual(['pet_sheet', 'request_code', 'request_code'])
  })

  it('sin descripción, o con algo que no es un texto, el valor sale vacío', () => {
    expect(eventOf(undefined)?.exception).toStrictEqual({
      values: [{ type: 'open_screen', value: '' }],
    })
    expect(eventOf({ message: 'ana@correo.com' })?.exception).toStrictEqual({
      values: [{ type: 'open_screen', value: '' }],
    })
  })
})
