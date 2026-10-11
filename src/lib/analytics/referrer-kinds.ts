const KINDS = ['social', 'search', 'assistant'] as const
export type ReferrerKind = (typeof KINDS)[number]

// Las listas de research R11. Un dominio nuevo se suma cuando aparezca en la medición como «sin
// origen conocido».
const DOMAINS: Record<ReferrerKind, readonly string[]> = {
  social: [
    'facebook.com',
    'fb.com',
    'instagram.com',
    't.co',
    'x.com',
    'twitter.com',
    'tiktok.com',
    'linkedin.com',
    'lnkd.in',
    'threads.net',
    'whatsapp.com',
  ],
  search: ['bing.com', 'duckduckgo.com', 'yahoo.com', 'ecosia.org', 'search.brave.com'],
  assistant: [
    'chatgpt.com',
    'chat.openai.com',
    'claude.ai',
    'perplexity.ai',
    'gemini.google.com',
    'copilot.microsoft.com',
  ],
}

// Google Búsqueda en cualquier país (`google.com.uy`, `google.co.uk`, `google.de`), y solo ella: los
// otros subdominios de Google (el correo, los documentos, Gemini) no son un buscador.
const GOOGLE_SEARCH = /^(?:www\.)?google\.(?:com?\.)?[a-z]{2,3}$/u

// El mismo dominio o un subdominio suyo: `m.facebook.com` es Facebook, `facebook.com.evil.com` no.
function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

/** Qué clase de sitio es un host, o null si no está en ninguna lista. */
export function referrerKind(host: string): ReferrerKind | null {
  const name = host.toLowerCase()
  if (GOOGLE_SEARCH.test(name)) return 'search'
  return KINDS.find((kind) => DOMAINS[kind].some((domain) => hostMatches(name, domain))) ?? null
}
