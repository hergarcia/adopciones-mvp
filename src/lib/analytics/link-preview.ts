// Las aplicaciones que abren un enlace para armar su vista previa, no una persona mirando (FR-028).
// Lista cerrada: un agente nuevo se suma acá cuando aparezca.
const PREVIEW_AGENTS = [
  'whatsapp',
  'facebookexternalhit',
  'facebot',
  'telegrambot',
  'twitterbot',
  'slackbot',
  'discordbot',
  'linkedinbot',
  'googlebot',
]

export function isLinkPreview(userAgent: string | null): boolean {
  if (userAgent === null) return false
  const agent = userAgent.toLowerCase()
  return PREVIEW_AGENTS.some((name) => agent.includes(name))
}
