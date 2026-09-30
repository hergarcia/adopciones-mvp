import { getTranslations } from 'next-intl/server'
import { CopyProfileLink } from '@/components/profile/copy-profile-link'
import { MyVouchesEmpty } from '@/components/vouches/my-vouches-empty'
import { MyVouchesList } from '@/components/vouches/my-vouches-list'
import { NextStepLink } from '@/components/vouches/next-step-link'
import { publicProfileUrl } from '@/lib/profile/public-paths'
import type { NextStep } from '@/lib/vouches/next-step'
import { MY_VOUCHES_PATH } from '@/lib/vouches/paths'
import type { MyVouch } from '@/lib/vouches/types'
import { copyProfileLinkTexts } from '@/app/[locale]/_components/profile-link-texts'
import { myVouchRow } from './my-vouch-row-item'

type Props = {
  rows: MyVouch[]
  /** Quien tiene la sesión: su id público, si llega a nivel 2 y, si no, el paso que le falta. */
  me: { publicId: string; levelTwo: boolean; step: NextStep }
}

// Las dos listas de «Mis avales» (FR-025): primero quién me avala, que es lo que se ve en el perfil
// público y lo que se viene a controlar; después a quién avalé. Desde 1024, lado a lado.
export async function MyVouchesSections({ rows, me }: Props) {
  const t = await getTranslations('vouches')
  const received = rows.filter((row) => row.direction === 'received')
  const given = rows.filter((row) => row.direction === 'given')

  // El paso que falta va una sola vez en la pantalla: en el primer vacío que lo necesita (docs/10
  // §Principios 6). Un pedido en revisión no tiene nada que tocar.
  const { step } = me
  const inReview = !me.levelTwo && step.kind === 'identity_in_review'
  const stepButton =
    me.levelTwo || inReview ? null : (
      <NextStepLink
        step={step}
        returnPath={MY_VOUCHES_PATH}
        labels={{
          complete_profile: t('steps.complete_profile'),
          verify_phone: t('steps.verify_phone'),
          verify_identity: t('steps.verify_identity'),
        }}
      />
    )
  const stepAbove = received.length === 0 && stepButton !== null

  const receivedEmpty = me.levelTwo ? (
    <MyVouchesEmpty
      lines={[t('empty.received'), t('empty.received_ask')]}
      action={
        <CopyProfileLink url={publicProfileUrl(me.publicId)} texts={await copyProfileLinkTexts()} />
      }
    />
  ) : (
    <MyVouchesEmpty
      lines={[
        t('empty.received'),
        t('empty.received_needs'),
        ...(inReview ? [t('slot.in_review')] : []),
      ]}
      action={stepButton}
    />
  )

  const givenEmpty = me.levelTwo ? (
    <MyVouchesEmpty lines={[t('empty.given'), t('empty.given_ask')]} />
  ) : (
    <MyVouchesEmpty
      lines={[t('empty.given'), stepAbove ? t('empty.given_needs_same') : t('empty.given_needs')]}
      action={stepAbove ? null : stepButton}
    />
  )

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-2">
      <MyVouchesList title={t('mine.received_title')} empty={receivedEmpty}>
        {await Promise.all(received.map(myVouchRow))}
      </MyVouchesList>
      <MyVouchesList title={t('mine.given_title')} empty={givenEmpty}>
        {await Promise.all(given.map(myVouchRow))}
      </MyVouchesList>
    </div>
  )
}
