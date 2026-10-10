// Los dominios que la RFC 2606 reserva para pruebas: nadie tiene una casilla ahí.
const RESERVED = new Set(['test', 'example', 'invalid', 'localhost'])

/**
 * Si una dirección puede recibir un correo de verdad. Las personas de prueba de las comprobaciones
 * contra la nube usan `@example.test` (research R15).
 */
export function isDeliverable(email: string): boolean {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase()
  return !RESERVED.has(domain.slice(domain.lastIndexOf('.') + 1))
}
