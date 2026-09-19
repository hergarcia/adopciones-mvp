import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ResendLinkButton } from '@/components/auth/resend-link-button'
import { Card } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { MIN_SECONDS_BETWEEN_REQUESTS } from '@/lib/auth/request-window'
import { readPendingEmail } from '@/lib/auth/request-cookies'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.check_email')
  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function CheckEmailPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // La dirección viene de una cookie httpOnly y no de la URL: en la URL quedaría en el historial,
  // en los registros del servidor y en el `Referer` de todo lo que cargue la pantalla.
  const email = await readPendingEmail()
  if (email === null) redirect('/entrar')

  const t = await getTranslations('auth.check_email')
  const errors = await getTranslations('auth.errors')

  return (
    <PageShell>
      <LinkButton href="/entrar" variant="ghost">
        {t('back')}
      </LinkButton>

      <h1 className="afiche mt-6 text-2xl text-ink">{t('title')}</h1>
      <p className="mt-3 text-base text-ink">{t('sent_to', { email })}</p>

      <Card className="mt-6">
        <p className="text-base text-ink">{t('spam')}</p>
        <p className="mt-2 text-base text-ink">{t('one_use')}</p>
      </Card>

      <ResendLinkButton
        email={email}
        initialWaitSeconds={MIN_SECONDS_BETWEEN_REQUESTS}
        texts={{
          resend: t('resend'),
          resendIn: t.raw('resend_in'),
          resent: t('resent'),
          sendFailed: errors('send_failed'),
        }}
      />
    </PageShell>
  )
}
