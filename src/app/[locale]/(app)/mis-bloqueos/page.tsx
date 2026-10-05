import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AnnounceNotices } from '@/components/forms/announce-notices'
import { MyBlockRow } from '@/components/moderation/my-block-row'
import { MyBlocksEmpty } from '@/components/moderation/my-blocks-empty'
import { MyBlocksList } from '@/components/moderation/my-blocks-list'
import { UnblockButton } from '@/components/moderation/unblock-button'
import { LinkButton } from '@/components/ui/link-button'
import { requireProfile } from '@/lib/auth/require-profile'
import { momentDayLabel } from '@/lib/moderation/day-label'
import { MY_BLOCKS_PATH } from '@/lib/moderation/paths'
import { listMyBlocks } from '@/lib/supabase/queries/moderation'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { unblockTexts } from '@/app/[locale]/_components/moderation-texts'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.my_blocks')
  return { title: t('title'), robots: { index: false, follow: false } }
}

// A quiénes bloqueé, del más reciente al más viejo, con «Desbloquear» en cada uno (FR-017b). Al
// desbloquear, la fila sale y la lista lo anuncia.
export default async function MyBlocksPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  await requireProfile(MY_BLOCKS_PATH)
  const user = await getSessionUser()
  if (user === null) notFound()

  const [blocks, t, toast] = await Promise.all([
    listMyBlocks(user.id),
    getTranslations('moderation.my_blocks'),
    getTranslations('common.toast'),
  ])
  const rows = await Promise.all(
    blocks.map(async (block) => (
      <MyBlockRow
        key={block.publicId}
        block={block}
        texts={{
          photoAlt: t('photo_alt', { name: block.name }),
          since: t('since', { date: momentDayLabel(block.since, locale) }),
        }}
        action={
          <UnblockButton
            publicId={block.publicId}
            returnPath={MY_BLOCKS_PATH}
            inList
            size="sm"
            texts={await unblockTexts(block.name)}
          />
        }
      />
    )),
  )

  return (
    <PageShell width="full">
      <h1 className="afiche mb-6 text-2xl text-ink">{t('title')}</h1>
      <AnnounceNotices
        texts={{ label: toast('label'), region: toast('region'), close: toast('close') }}
      >
        <MyBlocksList
          label={t('list_label')}
          empty={
            <MyBlocksEmpty
              text={t('empty')}
              action={
                <LinkButton href="/mi-perfil" variant="secondary">
                  {t('back_profile')}
                </LinkButton>
              }
            />
          }
        >
          {rows}
        </MyBlocksList>
      </AnnounceNotices>
    </PageShell>
  )
}
