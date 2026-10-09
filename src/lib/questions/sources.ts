// Dónde se publica una norma o la explica quien la aplica (research R11 de la #8): IMPO, el
// Parlamento y el portal del Estado, donde están el MGAP y el INBA. Host exacto, nunca `*.gub.uy`:
// una intendencia que haga falta se suma con su host y a su test.
export const OFFICIAL_SOURCE_HOSTS = [
  'www.impo.com.uy',
  'impo.com.uy',
  'parlamento.gub.uy',
  'www.parlamento.gub.uy',
  'www.gub.uy',
] as const

const HOSTS: readonly string[] = OFFICIAL_SOURCE_HOSTS

export function isOfficialSource(url: string): boolean {
  const parsed = URL.parse(url)
  return parsed?.protocol === 'https:' && HOSTS.includes(parsed.host)
}
