import { PetExpiryLine, type ExpiryLine } from '@/components/pets/pet-expiry-line'
import { PetPastedPhoto } from '@/components/pets/pet-pasted-photo'
import { PetPhoto } from '@/components/pets/pet-photo'
import { CardStamp } from '@/components/pets/pet-status-stamp'
import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { ShareButton, type ShareTexts } from '@/components/pets/share-button'
import { TakedownNote } from '@/components/pets/takedown-note'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { LinkButton } from '@/components/ui/link-button'
import { litterEditPath, litterPath } from '@/lib/litters/paths'
import type { MyLitter } from '@/lib/litters/types'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import type { ListedCardView } from '@/lib/pets/types'
import { LitterCountLine } from './litter-count-line'
import { LitterStatusActions, type LitterStatusTexts } from './litter-status-actions'

type Props = {
  litter: Pick<MyLitter, 'id' | 'code' | 'name' | 'state'>
  returnPath: string
  gateHref: string
  /** La portada firmada, su `alt` y el sello de la camada, ya armados. */
  photo: Pick<ListedCardView, 'photo' | 'alt' | 'stamp'>
  /** Ya traducidos. */
  texts: {
    back: string
    count: string
    seeLitter: string
    edit: string
    share: ShareTexts
    takedown: string | null
    expiry: ExpiryLine | null
    youngTitle: string
    status: LitterStatusTexts
  }
  /** Una `YoungPanelRow` por cría, en el orden de la camada. */
  children: React.ReactNode
}

// A donde llevan «Ya no está disponible» y los avisos de la camada.
export function MyLitterPanel({ litter, returnPath, gateHref, photo, texts, children }: Props) {
  const takenDown = litter.state === 'taken_down'
  return (
    <div className="flex flex-col items-start gap-6">
      <LinkButton href={MY_PETS_PATH} variant="ghost" size="sm">
        {texts.back}
      </LinkButton>
      <PetWorkLayout
        photo="small"
        className="w-full"
        head={
          <header className="flex flex-col items-start gap-2">
            <h1 className="afiche text-2xl break-words text-ink">{litter.name}</h1>
            <LitterCountLine text={texts.count} />
            {texts.takedown ? <TakedownNote text={texts.takedown} /> : null}
            {texts.expiry ? <PetExpiryLine line={texts.expiry} /> : null}
          </header>
        }
        picture={
          <PetPastedPhoto
            view={photo}
            stamp={<CardStamp stamp={photo.stamp} />}
            side="left"
            sizes="(min-width: 1024px) 256px, 112px"
            eager
            photo={PetPhoto}
            photoClassName={WALL_PHOTO_FRAME}
          />
        }
      >
        <div className="flex max-w-[var(--measure)] flex-col gap-8">
          <LitterStatusActions
            litterId={litter.id}
            state={litter.state}
            layout="page"
            returnPath={returnPath}
            gateHref={gateHref}
            texts={texts.status}
            expiresSoon={texts.expiry?.soon}
            links={
              <div key="links" className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <LinkButton href={litterPath(litter.code)} variant="ghost">
                  {texts.seeLitter}
                </LinkButton>
                {takenDown ? null : (
                  <>
                    <ShareButton
                      code={litter.code}
                      path={litterPath(litter.code)}
                      from="my_pets"
                      texts={texts.share}
                      variant="ghost"
                    />
                    <LinkButton href={litterEditPath(litter.id)} variant="ghost">
                      {texts.edit}
                    </LinkButton>
                  </>
                )}
              </div>
            }
          />
          <section aria-labelledby="crias" className="flex flex-col gap-4">
            <h2 id="crias" className="text-xl font-bold text-ink">
              {texts.youngTitle}
            </h2>
            <ul className="flex flex-col gap-4">{children}</ul>
          </section>
        </div>
      </PetWorkLayout>
    </div>
  )
}
