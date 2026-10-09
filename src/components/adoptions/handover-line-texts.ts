import { getLocale, getTranslations } from 'next-intl/server'
import type { EndAdoptionTexts } from '@/components/adoptions/end-adoption-dialog'
import { handoverLine } from '@/lib/adoptions/handover-line'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import { momentDayLabel } from '@/lib/moderation/day-label'
import type { Sex } from '@/lib/pets/options'

// Los textos de un adoptado en Mis animales y en su pantalla (historia #67), armados en el servidor.

/** El renglón de un adoptado en Mis animales (FR-040), o null si no hay a quién nombrar. */
export async function handoverLineTexts(
  summary: PetAdoptionSummary | undefined,
  sex: Sex,
): Promise<{ main: string; commitment: string | null } | null> {
  const line = handoverLine(summary)
  if (line === null) return null
  const [t, locale] = await Promise.all([getTranslations('adoptions.line'), getLocale()])
  if (line.kind === 'outside') return { main: t('outside', { sex }), commitment: null }
  if (line.kind === 'declined') {
    return { main: t('declined', { sex, person: line.person }), commitment: null }
  }
  return {
    main: t('person', { sex, person: line.person }),
    commitment:
      line.commitment.kind === 'pending'
        ? t('pending', { person: line.person })
        : t('accepted', { date: momentDayLabel(line.commitment.at, locale) }),
  }
}

/** El aviso al volver de marcar adoptado: «Tobi quedó adoptado por Ana». */
export async function handedOverNotice(
  pet: { name: string; sex: Sex },
  summary: PetAdoptionSummary | undefined,
): Promise<string> {
  const t = await getTranslations('adoptions.handover')
  const person = summary?.kind === 'site' ? summary.adopterName : null
  return person === null
    ? t('done_outside', { name: pet.name, sex: pet.sex })
    : t('done_site', { name: pet.name, sex: pet.sex, person })
}

/** La confirmación de volver a publicar un adoptado a una persona (R6), o null si no termina nada. */
export async function endAdoptionTexts(
  pet: { name: string },
  summary: PetAdoptionSummary | undefined,
): Promise<EndAdoptionTexts | null> {
  const person = summary?.endsPerson === true ? summary.adopterName : null
  if (person === null) return null
  const t = await getTranslations('adoptions.end')
  return {
    title: t('title', { name: pet.name }),
    body: t('body', { person }),
    confirm: t('confirm'),
    cancel: t('cancel'),
    close: t('close'),
  }
}
