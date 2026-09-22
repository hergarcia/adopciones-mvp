import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmailFallback } from '@/components/auth/email-fallback'
import { EmailLinkForm } from '@/components/auth/email-link-form'
import { GoogleButton } from '@/components/auth/google-button'
import { isGoogleConfigured } from '@/lib/auth/google-config'
import { signInLayout } from '@/lib/auth/sign-in-layout'
import { safeDestination } from '@/lib/auth/next-destination'
import { getMyProfile } from '@/lib/supabase/queries/profiles'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string; motivo?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.sign_in')
  // Un formulario de ingreso no tiene nada que indexar, y lo que entra a un índice generativo no
  // se retira (docs/08 §Encontrable).
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { next, motivo } = await searchParams
  const destination = safeDestination(next)

  // Quien ya tiene sesión no necesita este formulario: se lo lleva adentro (FR-007c).
  if ((await getSessionUser()) !== null) {
    const pending = `/completar-perfil?next=${encodeURIComponent(destination)}`
    redirect((await getMyProfile()) === null ? pending : destination)
  }

  const t = await getTranslations('auth.sign_in')
  const errors = await getTranslations('auth.errors')
  const layout = signInLayout(isGoogleConfigured(), motivo)

  const emailForm = (
    <EmailLinkForm
      isPrimary={layout.lead === 'email'}
      next={next}
      texts={{
        emailLabel: t('email_label'),
        emailPlaceholder: t('email_placeholder'),
        submit: t('submit'),
        errors: {
          'auth.errors.email_required': errors('email_required'),
          'auth.errors.email_format': errors('email_format'),
          'auth.errors.send_failed': errors('send_failed'),
          'auth.errors.link_unknown': errors('link_unknown'),
        },
        rateLimited: { one: errors('rate_limited_one'), many: errors.raw('rate_limited_many') },
      }}
    />
  )

  return (
    <PageShell>
      <h1 className="afiche text-2xl text-ink">{t('title')}</h1>
      <p className="mt-3 text-base text-ink-muted">
        {t(layout.lead === 'google' ? 'lead_google' : 'lead')}
      </p>

      {layout.notice ? (
        <p className="mt-6 border-2 border-accent bg-accent-soft p-3 text-base text-ink">
          {errors(layout.notice)}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-6">
        {layout.lead === 'google' ? (
          <>
            <GoogleButton label={t('google')} next={next} />
            <EmailFallback label={t('email_fallback')} isOpen={layout.isEmailOpen}>
              {emailForm}
            </EmailFallback>
          </>
        ) : (
          emailForm
        )}
      </div>
    </PageShell>
  )
}
