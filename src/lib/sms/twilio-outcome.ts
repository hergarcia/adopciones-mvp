export type SmsOutcome = 'sent' | 'rejected' | 'failed'

// Errores de Twilio que son **del número**: lo escrito no puede recibir el mensaje, cuenta para
// los topes de la persona y se le dice que lo revise (FR-002a). 21211: número inválido; 21614: no
// es un celular; 21610: se dio de baja de los mensajes; 21612: no se le puede mandar.
//
// El 21408 no está, a propósito: es "la región no está habilitada en la cuenta", una falla de
// configuración nuestra. Si contara como del número, con Uruguay sin habilitar se le diría a cada
// persona que su celular no recibe mensajes y se le gastaría el tope (FR-009a).
const NUMBER_ERRORS = new Set<number | undefined>([21211, 21614, 21610, 21612])

// Una red caída no llega acá: `sendSms` la cuenta como falla del servicio sin preguntar.
export function twilioOutcome(status: number, code?: number): SmsOutcome {
  if (status >= 200 && status < 300) return 'sent'
  return NUMBER_ERRORS.has(code) ? 'rejected' : 'failed'
}
