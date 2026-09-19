import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ResendFromLinkButton } from '@/components/auth/resend-from-link-button'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { canResend, linkProblemMessage } from '@/lib/auth/link-problem'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ motivo?: string; link?: string; correo?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.link_problem')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function LinkProblemPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { motivo, link, correo } = await searchParams
  const problem = motivo ?? 'unknown'

  const t = await getTranslations('auth.link_problem')
  const other = await getTranslations('auth.signed_in_elsewhere')
  const errors = await getTranslations('auth.errors')

  // La dirección a la que se mandó el enlace NO se muestra (FR-005b): pedir otro funciona igual
  // porque el servidor la resuelve a partir del id.
  const message = linkProblemMessage(problem, {
    superseded: t('superseded'),
    consumed: t('consumed'),
    expired: t('expired'),
    unknown: t('unknown'),
    otherAccount: other('body', { email: correo ?? '' }),
  })

  return (
    <PageShell>
      {/* Un h1 por pantalla, también en las que son un estado vacío (docs/10 §Piso de
          accesibilidad). Va centrado como el resto del bloque: docs/10 §Layout admite centrar en
          vacíos y confirmaciones, y es la única excepción a la alineación a la izquierda. */}
      <h1 className="afiche text-center text-2xl text-ink">{t('title')}</h1>
      <EmptyState
        title={message}
        action={
          canResend(problem) && link ? (
            <ResendFromLinkButton
              linkId={link}
              label={t('resend')}
              unknownLabel={errors('link_unknown')}
            />
          ) : (
            <LinkButton href="/entrar" variant="ghost">
              {t('start_over')}
            </LinkButton>
          )
        }
      />
    </PageShell>
  )
}
