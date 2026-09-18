import type messages from '../../messages/es.json'

// Las claves salen del archivo de mensajes, así una clave inexistente falla `pnpm typecheck` en
// lugar de aparecer como texto crudo en pantalla (FR-029).
declare global {
  type IntlMessages = typeof messages
}
