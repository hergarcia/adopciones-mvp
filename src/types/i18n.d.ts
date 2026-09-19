import type messages from '../../messages/es.json'

// Las claves salen del archivo de mensajes, así una clave inexistente falla `pnpm typecheck` en
// lugar de aparecer como texto crudo en pantalla (FR-029). En next-intl 4 esto se declara
// aumentando `AppConfig`; el `IntlMessages` global de versiones anteriores se ignora en silencio.
declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages
  }
}
