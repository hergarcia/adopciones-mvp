import { ABOUT_PATH } from '@/lib/about/page'
import { FEEDBACK_PATH } from '@/lib/feedback/screens'
import { LISTING_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import { LEVELS_PATH } from '@/lib/profile/public-paths'
import { QUESTIONS_PATH } from '@/lib/questions/paths'

/** `help`: la pantalla de una cuenta suspendida, que no puede ir a otro lado que decir algo. */
export type FooterScope = 'site' | 'help'
export type FooterGroupId = 'animals' | 'trust' | 'help'
export type FooterLinkId =
  'listing' | 'publish' | 'levels' | 'questions' | 'about' | 'feedback' | 'support'
export type FooterLink = { id: FooterLinkId; href: string; external: boolean }
export type FooterGroup = { id: FooterGroupId; links: FooterLink[] }

const internal = (id: FooterLinkId, href: string): FooterLink => ({ id, href, external: false })

/** Los grupos del pie en su orden fijo, sin los enlaces que no llevan a ningún lado ni los grupos vacíos. */
export function footerGroups(options: {
  scope: FooterScope
  supportHref: string | null
}): FooterGroup[] {
  const { scope, supportHref } = options
  const help: FooterLink[] = [internal('feedback', FEEDBACK_PATH)]
  if (supportHref !== null) help.push({ id: 'support', href: supportHref, external: true })

  const groups: FooterGroup[] =
    scope === 'help'
      ? []
      : [
          {
            id: 'animals',
            links: [internal('listing', LISTING_PATH), internal('publish', PUBLISH_PATH)],
          },
          {
            id: 'trust',
            links: [
              internal('levels', LEVELS_PATH),
              internal('questions', QUESTIONS_PATH),
              internal('about', ABOUT_PATH),
            ],
          },
        ]
  groups.push({ id: 'help', links: help })
  return groups
}
