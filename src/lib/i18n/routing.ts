import { defineRouting } from 'next-intl/routing'

// Español es el único idioma al lanzar y va sin prefijo en la URL: los links se comparten por
// WhatsApp y cuanto más cortos, mejor (docs/06 §URLs). El segmento existe desde el primer commit
// para que agregar pt-BR no sea reestructurar rutas (docs/06 §Por qué ahora).
export const routing = defineRouting({
  locales: ['es'],
  defaultLocale: 'es',
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]

export function isSupportedLocale(value: string | undefined): value is Locale {
  const supported: readonly string[] = routing.locales
  return value !== undefined && supported.includes(value)
}
