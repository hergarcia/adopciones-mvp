// Las aplicaciones que abren un enlace para armar su vista previa, no una persona mirando (FR-028
// de la #12, FR-023 de la #57). Lista cerrada: un agente nuevo se suma acá cuando aparezca. La
// misma lista abre el listado y las fichas en robots.txt (research R7 de la #57).
export const LINK_PREVIEW_AGENTS = [
  'whatsapp',
  'facebookexternalhit',
  'facebot',
  'telegrambot',
  'twitterbot',
  'slackbot',
  'discordbot',
  'linkedinbot',
] as const

// Tampoco es una persona, pero indexa: no entra en robots.txt con los de arriba, que abrirían
// `/animales` a un buscador antes del dominio definitivo (docs/04).
const CRAWLERS = ['googlebot'] as const

export function isLinkPreview(userAgent: string | null): boolean {
  if (userAgent === null) return false
  const agent = userAgent.toLowerCase()
  return [...LINK_PREVIEW_AGENTS, ...CRAWLERS].some((name) => agent.includes(name))
}
