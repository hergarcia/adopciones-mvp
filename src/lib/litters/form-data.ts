import { formText } from '@/lib/forms/form-data'
import { petFormData, petFormValues } from '@/lib/pets/form-data'
import type { LitterFormValues, YoungFormValues } from './types'

export type YoungWithPhotos = YoungFormValues & { photoIds: string[] }

function isText(value: unknown): value is string {
  return typeof value === 'string'
}

function youngOf(value: unknown): YoungWithPhotos | null {
  if (typeof value !== 'object' || value === null) return null
  const key: unknown = Reflect.get(value, 'key')
  const name: unknown = Reflect.get(value, 'name')
  const sex: unknown = Reflect.get(value, 'sex')
  const description: unknown = Reflect.get(value, 'description')
  const photoIds: unknown = Reflect.get(value, 'photoIds')
  const id: unknown = Reflect.get(value, 'id')
  if (!isText(key) || !isText(name) || !isText(sex) || !isText(description)) return null
  if (!Array.isArray(photoIds) || !photoIds.every(isText)) return null
  if (id !== undefined && !isText(id)) return null
  return { key, ...(id === undefined ? {} : { id }), name, sex, description, photoIds }
}

/** La camada como viaja en la acción: lo común como un animal, y las crías con sus fotos en JSON. */
export function litterFormData(
  values: LitterFormValues,
  young: YoungWithPhotos[],
  extra: Record<string, string>,
): FormData {
  const form = petFormData({ ...values, sex: '' }, extra)
  form.delete('sex')
  form.set('deliversFrom', values.deliversFrom)
  form.set('young', JSON.stringify(young))
  return form
}

// Lo que no tiene la forma de una cría se descarta; si se descartó alguna, la cuenta de crías ya no
// es la que se mandó y el schema lo dice.
export function litterFormValues(form: FormData): {
  values: LitterFormValues
  young: YoungWithPhotos[]
} {
  const { sex: _sex, ...common } = petFormValues(form)
  let parsed: unknown = []
  try {
    parsed = JSON.parse(formText(form, 'young'))
  } catch {
    parsed = []
  }
  const young = (Array.isArray(parsed) ? parsed : []).flatMap((value) => {
    const one = youngOf(value)
    return one === null ? [] : [one]
  })
  return {
    values: {
      ...common,
      deliversFrom: formText(form, 'deliversFrom'),
      young: young.map(({ photoIds: _photoIds, ...own }) => own),
    },
    young,
  }
}
