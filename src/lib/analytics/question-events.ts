import { LEVELS_PATH } from '@/lib/profile/public-paths'
import { IDENTITY_PATH } from '@/lib/verification/paths'
import { ACTION_PATH, questionBySlug, type QuestionSlug } from '@/lib/questions/pages'
import { QUESTIONS_PATH, questionSlugOf } from '@/lib/questions/paths'
import { isLinkPreview } from './link-preview'
import type { QuestionViewOrigin, TrackedEvent } from './events'

type Request = { referer: string | null; host: string | null; userAgent: string | null }

// De dónde se llegó, solo si fue desde este mismo sitio: un `host` desconocido nunca lo es. Se
// guarda cuál de los orígenes es, nunca la dirección (FR-053).
function sitePathname(referer: string | null, host: string | null): string | null {
  const url = URL.parse(String(referer))
  return url !== null && url.host === host ? url.pathname : null
}

function viewOrigin(pathname: string | null): QuestionViewOrigin {
  if (pathname === QUESTIONS_PATH) return 'index'
  if (pathname === LEVELS_PATH) return 'levels'
  if (pathname === IDENTITY_PATH) return 'identity_request'
  return questionSlugOf(String(pathname)) === null ? 'link' : 'question'
}

export function questionViewEvent(view: Request & { slug: QuestionSlug }): TrackedEvent | null {
  if (isLinkPreview(view.userAgent)) return null
  const origin = viewOrigin(sitePathname(view.referer, view.host))
  return { name: 'question_viewed', props: { page: view.slug, origin } }
}

// El pie es el único enlace al índice desde una pantalla que no es de contenido; el de una página
// que se quedó sin relacionadas también cuenta como pie (research R7 de la #8).
export function questionsIndexViewEvent(view: Request): TrackedEvent | null {
  if (isLinkPreview(view.userAgent)) return null
  const origin = sitePathname(view.referer, view.host) === null ? 'link' : 'footer'
  return { name: 'questions_index_viewed', props: { origin } }
}

// En la pantalla de destino, antes de cualquier puerta: cuenta también sin sesión. Solo si el
// destino es la acción de la página de la que se vino; la cabecera hacia otro lado no cuenta.
export function questionActionEvent(
  request: Request & { destination: string },
): TrackedEvent | null {
  if (isLinkPreview(request.userAgent)) return null
  const from = questionSlugOf(String(sitePathname(request.referer, request.host)))
  const page = questionBySlug(String(from))
  if (page === null || ACTION_PATH[page.action] !== request.destination) return null
  return { name: 'question_action_used', props: { page: page.slug } }
}
