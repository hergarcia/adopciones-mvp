import { getTranslations } from 'next-intl/server'
import type { AlertNameWords } from './alert-name'
import { departmentName } from '@/lib/zones/departments'

const g = (masculine: string, feminine: string) => ({ masculine, feminine })

// Las piezas del nombre de un aviso, traducidas en el servidor: las usan «Mis avisos» y el correo.
// La corrida de las 8 no tiene el idioma de un pedido: por eso se pasa siempre.
export async function alertNameWords(locale: string): Promise<AlertNameWords> {
  const t = await getTranslations({ locale, namespace: 'alerts.name' })
  return {
    all: t('all'),
    animals: t('animals'),
    species: {
      dog: g(t('species.dog.masculine'), t('species.dog.feminine')),
      cat: g(t('species.cat.masculine'), t('species.cat.feminine')),
    },
    sexNoun: { male: t('sex_noun.male'), female: t('sex_noun.female') },
    males: t('males'),
    size: {
      small: g(t('size.small.masculine'), t('size.small.feminine')),
      medium: g(t('size.medium.masculine'), t('size.medium.feminine')),
      large: g(t('size.large.masculine'), t('size.large.feminine')),
    },
    age: {
      puppy: g(t('age.puppy.masculine'), t('age.puppy.feminine')),
      young: g(t('age.young.masculine'), t('age.young.feminine')),
      adult: g(t('age.adult.masculine'), t('age.adult.feminine')),
      senior: g(t('age.senior.masculine'), t('age.senior.feminine')),
    },
    neutered: g(t('neutered.masculine'), t('neutered.feminine')),
    or: t('or'),
    inDepartment: (department) => t('in_department', { department: departmentName(department) }),
  }
}
