import { getTranslations } from 'next-intl/server'
import type { HomeHeroTexts } from '@/components/home/home-hero'
import type { RescuerStepsTexts } from '@/components/home/rescuer-steps'

export type HomeTexts = { hero: HomeHeroTexts; rescuer: RescuerStepsTexts }

export async function homeTexts(): Promise<HomeTexts> {
  const t = await getTranslations('home')
  return {
    hero: { title: t('hero.title'), publish: t('hero.publish'), browse: t('hero.browse') },
    rescuer: {
      title: t('rescuer.title'),
      steps: [t('rescuer.steps.publish'), t('rescuer.steps.share'), t('rescuer.steps.renew')],
    },
  }
}
