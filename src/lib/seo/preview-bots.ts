// Los lectores que arman la vista previa de un enlace pegado en una app (research R7, R16). La
// misma lista abre `/animales/` en robots.txt y deja sus pedidos fuera de la medición: contarlos
// como visitas inflaría «vio una ficha desde afuera» cada vez que alguien pega un enlace.
export const PREVIEW_BOTS = [
  'facebookexternalhit',
  'Facebot',
  'WhatsApp',
  'Twitterbot',
  'TelegramBot',
] as const

export function isPreviewBot(userAgent: string | null): boolean {
  const agent = String(userAgent).toLowerCase()
  return PREVIEW_BOTS.some((bot) => agent.includes(bot.toLowerCase()))
}
