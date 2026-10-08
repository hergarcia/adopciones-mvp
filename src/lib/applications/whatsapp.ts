import type { Contact } from './types'

type Values = { sender: string; pet: string; app: string }

/** Los dos textos de `applications.whatsapp`, ya con sus valores. */
export type WhatsappTexts = (side: Contact['side'], values: Values) => string

// El mensaje ya escrito de «Abrir WhatsApp» (FR-014): quien escribe, el animal y el sitio, nada
// más; quien solicitó dice que la aceptaron, el publicador que la acepta.
export function whatsappMessage(
  input: { side: Contact['side']; petName: string; senderName: string; appName: string },
  texts: WhatsappTexts,
): string {
  return texts(input.side, { sender: input.senderName, pet: input.petName, app: input.appName })
}

// `wa.me` abre la app en el teléfono y WhatsApp Web en la computadora (research R9). Pide el número
// en dígitos, sin el `+`, y el texto codificado.
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replaceAll(/\D/gu, '')}?text=${encodeURIComponent(text)}`
}
