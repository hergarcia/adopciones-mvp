import { getTranslations } from 'next-intl/server'
import { ApplicationList } from '@/components/applications/application-list'
import { InboxLitterGroup } from '@/components/applications/inbox-litter-group'
import { InboxPetCard } from '@/components/applications/inbox-pet-card'
import { InboxSection } from '@/components/applications/inbox-section'
import type { InboxEntry } from '@/lib/applications/inbox-groups'
import { petInboxPath } from '@/lib/applications/paths'
import type { InboxPet } from '@/lib/applications/types'
import { inboxLitterTexts, inboxPetTexts } from '@/app/[locale]/_components/inbox-texts'

type Props = {
  entries: InboxEntry[]
  /** Ya traducida: la descripción de una pared de animales sueltos. */
  label: string
}

type Run = { kind: 'pets'; pets: InboxPet[] } | Extract<InboxEntry, { kind: 'litter' }>

// Los animales sueltos seguidos van en una misma pared y cada camada corta con su grupo, así el orden
// de `groupInbox` se respeta tal cual.
function runsOf(entries: InboxEntry[]): Run[] {
  const runs: Run[] = []
  for (const entry of entries) {
    const last = runs.at(-1)
    if (entry.kind === 'litter') runs.push(entry)
    else if (last?.kind === 'pets') last.pets.push(entry.pet)
    else runs.push({ kind: 'pets', pets: [entry.pet] })
  }
  return runs
}

async function cardsOf(pets: InboxPet[]) {
  const texts = await Promise.all(pets.map((pet) => inboxPetTexts(pet)))
  return pets.map((pet, index) => (
    <InboxPetCard
      key={pet.petId}
      href={pet.lastSentAt === null ? null : petInboxPath(pet.petId)}
      cover={pet.cover}
      index={index}
      texts={texts[index]}
    />
  ))
}

// Sin camadas, la pared de siempre. Con camadas, cada tramo de animales sueltos lleva su título, así
// no se leen como crías de la camada de al lado.
export async function InboxWall({ entries, label }: Props) {
  const t = await getTranslations('litters.inbox')
  const runs = runsOf(entries)
  const [only] = runs
  if (runs.length <= 1 && only?.kind !== 'litter') {
    return <ApplicationList label={label}>{await cardsOf(only?.pets ?? [])}</ApplicationList>
  }
  const sections = await Promise.all(
    runs.map(async (run, index) => {
      if (run.kind === 'pets') {
        const afterLitter = runs.slice(0, index).some((before) => before.kind === 'litter')
        return (
          <InboxSection
            key={run.pets[0]?.petId}
            title={t(afterLitter ? 'other_pets' : 'own_pets')}
            label={label}
          >
            {await cardsOf(run.pets)}
          </InboxSection>
        )
      }
      return (
        <InboxLitterGroup key={run.litter.id} texts={await inboxLitterTexts(run)}>
          {await cardsOf(run.litter.young)}
        </InboxLitterGroup>
      )
    }),
  )
  return <div className="flex flex-col gap-10">{sections}</div>
}
