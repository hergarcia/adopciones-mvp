import { getTranslations } from 'next-intl/server'
import type { AdopterPromiseTexts } from '@/components/home/adopter-promise'
import type { HomeHeroTexts } from '@/components/home/home-hero'
import type { RecentPetsTexts } from '@/components/home/recent-pets'
import type { RescuerStepsTexts } from '@/components/home/rescuer-steps'
import { levelsPath } from '@/lib/profile/public-paths'
import { badgeLabel } from '@/app/[locale]/_components/level-texts'

export type HomeTexts = {
  hero: HomeHeroTexts
  rescuer: RescuerStepsTexts
  adopter: AdopterPromiseTexts
  recent: RecentPetsTexts
}

export async function homeTexts(): Promise<HomeTexts> {
  const [t, badge] = await Promise.all([getTranslations('home'), badgeLabel(1, true)])
  return {
    hero: { title: t('hero.title'), publish: t('hero.publish'), browse: t('hero.browse') },
    rescuer: {
      title: t('rescuer.title'),
      steps: [t('rescuer.steps.publish'), t('rescuer.steps.share'), t('rescuer.steps.renew')],
    },
    adopter: {
      title: t('adopter.title'),
      sentences: [t('adopter.free'), t('adopter.verified'), t('adopter.private')],
      badge,
      levelsHref: levelsPath(1, '/'),
    },
    recent: {
      title: t('recent.title'),
      all: t('recent.all'),
      empty: t('recent.empty'),
      emptyAction: t('recent.empty_action'),
      failed: t('recent.failed'),
      failedAction: t('recent.failed_action'),
    },
  }
}
