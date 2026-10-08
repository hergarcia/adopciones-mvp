// Covers: US1-AS3, US1-AS4, US1-AS5, US1-AS8, US2-AS3, FR-006, FR-007, FR-015 y los Edge Cases
// «Varias fotos elegidas de una vez que pasan el tope», «Una foto de varias elegidas falla» y
// «Fotos todavía preparándose».
import { describe, expect, it } from 'vitest'
import {
  acceptPhotoFile,
  addPhotos,
  emptyPhotoList,
  makeCover,
  markReady,
  markUploaded,
  movePhoto,
  photoIdsToSend,
  photosToUpload,
  preparingKeys,
  rejectPhoto,
  removePhoto,
  shouldRenewIds,
  submitReadiness,
  withNewIds,
  type PhotoList,
} from './photo-list'

const jpeg = (name = 'foto.jpg') => ({ name, type: 'image/jpeg', size: 1000 })
const preview = { src: 'blob:x', placeholder: null, width: 4, height: 3 }

function ready(keys: string[]): PhotoList<string> {
  let list = addPhotos(
    emptyPhotoList<string>(),
    keys.map((key) => ({ key, file: jpeg() })),
  )
  for (const key of keys) {
    list = markReady(list, key, { photoId: `id-${key}`, preview, prepared: `p-${key}` })
  }
  return list
}

const order = (list: PhotoList<string>) => list.slots.map((slot) => slot.key)

describe('acceptPhotoFile', () => {
  it('traduce el problema del archivo a las claves de los animales', () => {
    expect(acceptPhotoFile(jpeg())).toBeNull()
    expect(acceptPhotoFile({ type: 'image/heic', size: 1 })).toBe('pets.errors.photo_type')
    expect(acceptPhotoFile({ type: 'image/gif', size: 1 })).toBe('pets.errors.photo_type')
    expect(acceptPhotoFile({ type: 'image/png', size: 10 * 1024 * 1024 })).toBeNull()
    expect(acceptPhotoFile({ type: 'image/png', size: 10 * 1024 * 1024 + 1 })).toBe(
      'pets.errors.photo_too_big',
    )
  })
})

describe('emptyPhotoList', () => {
  it('arranca sin fotos, sin motivos y sin ninguna afuera', () => {
    expect(emptyPhotoList()).toEqual({ slots: [], rejections: [], overflow: 0 })
  })
})

describe('addPhotos', () => {
  it('entran preparándose, en el orden en que llegaron', () => {
    const list = addPhotos(emptyPhotoList<string>(), [
      { key: 'a', file: jpeg() },
      { key: 'b', file: jpeg() },
    ])
    expect(list).toEqual({
      slots: [
        { key: 'a', state: 'preparing' },
        { key: 'b', state: 'preparing' },
      ],
      rejections: [],
      overflow: 0,
    })
  })

  it('con 3 y 4 elegidas entran las 2 primeras y se cuentan 2 afuera', () => {
    const list = addPhotos(ready(['a', 'b', 'c']), [
      { key: 'd', file: jpeg() },
      { key: 'e', file: jpeg() },
      { key: 'f', file: jpeg() },
      { key: 'g', file: jpeg() },
    ])
    expect(order(list)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(list.overflow).toBe(2)
  })

  it('con 5 no entra ninguna más', () => {
    const list = addPhotos(ready(['a', 'b', 'c', 'd', 'e']), [{ key: 'f', file: jpeg() }])
    expect(order(list)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(list.overflow).toBe(1)
  })

  // Covers: US2-AS8 (historia #69: el seguimiento lleva hasta 3)
  it('con otro máximo: con 2 y 4 elegidas entra 1 y se cuentan 3 afuera', () => {
    const list = addPhotos(
      ready(['a', 'b']),
      ['c', 'd', 'e', 'f'].map((key) => ({ key, file: jpeg() })),
      3,
    )
    expect(order(list)).toEqual(['a', 'b', 'c'])
    expect(list.overflow).toBe(3)
  })

  it('una rechazada no ocupa lugar ni frena a las otras, y dice su motivo', () => {
    const list = addPhotos(ready(['a', 'b', 'c', 'd']), [
      { key: 'x', file: { name: 'IMG_1.HEIC', type: 'image/heic', size: 1 } },
      { key: 'e', file: jpeg() },
    ])
    expect(order(list)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(list.rejections).toEqual([
      { key: 'x', fileName: 'IMG_1.HEIC', error: 'pets.errors.photo_type' },
    ])
    expect(list.overflow).toBe(0)
  })

  it('una elección nueva reemplaza los motivos y el conteo de la anterior', () => {
    const first = addPhotos(ready(['a', 'b', 'c', 'd', 'e']), [
      { key: 'x', file: { name: 'x.gif', type: 'image/gif', size: 1 } },
      { key: 'f', file: jpeg() },
    ])
    const second = addPhotos(removePhoto(first, 'a'), [{ key: 'g', file: jpeg() }])
    expect(second.rejections).toEqual([])
    expect(second.overflow).toBe(0)
  })
})

describe('preparar y rechazar', () => {
  it('markReady deja la foto lista con su id y solo toca esa', () => {
    const list = markReady(
      addPhotos(emptyPhotoList<string>(), [
        { key: 'a', file: jpeg() },
        { key: 'b', file: jpeg() },
      ]),
      'a',
      { photoId: 'id-a', preview, prepared: 'p-a' },
    )
    expect(list.slots).toEqual([
      { key: 'a', state: 'ready', photoId: 'id-a', preview, prepared: 'p-a' },
      { key: 'b', state: 'preparing' },
    ])
  })

  it('rejectPhoto la saca de la grilla y suma su motivo a los que había', () => {
    const base = addPhotos(emptyPhotoList<string>(), [
      { key: 'x', file: { name: 'x.gif', type: 'image/gif', size: 1 } },
      { key: 'a', file: jpeg() },
      { key: 'b', file: jpeg() },
    ])
    const list = rejectPhoto(base, 'a', 'rota.jpg', 'pets.errors.photo_failed')
    expect(order(list)).toEqual(['b'])
    expect(list.rejections).toEqual([
      { key: 'x', fileName: 'x.gif', error: 'pets.errors.photo_type' },
      { key: 'a', fileName: 'rota.jpg', error: 'pets.errors.photo_failed' },
    ])
  })
})

describe('ordenar', () => {
  it('sacar la portada hace portada a la siguiente; sacar la última deja la lista vacía', () => {
    expect(order(removePhoto(ready(['a', 'b', 'c']), 'a'))).toEqual(['b', 'c'])
    expect(order(removePhoto(ready(['a']), 'a'))).toEqual([])
  })

  it('mover un lugar antes y después', () => {
    expect(order(movePhoto(ready(['a', 'b', 'c']), 'b', -1))).toEqual(['b', 'a', 'c'])
    expect(order(movePhoto(ready(['a', 'b', 'c']), 'b', 1))).toEqual(['a', 'c', 'b'])
    expect(order(movePhoto(ready(['a', 'b', 'c']), 'a', 1))).toEqual(['b', 'a', 'c'])
  })

  it('en los bordes, o con una que no está, no se mueve nada', () => {
    const list = ready(['a', 'b', 'c'])
    expect(movePhoto(list, 'a', -1)).toBe(list)
    expect(movePhoto(list, 'c', 1)).toBe(list)
    expect(movePhoto(list, 'z', 1)).toBe(list)
    expect(movePhoto(list, 'z', -1)).toBe(list)
  })

  it('hacer portada la pone primera sin cambiar el orden de las demás', () => {
    expect(order(makeCover(ready(['a', 'b', 'c', 'd']), 'c'))).toEqual(['c', 'a', 'b', 'd'])
    expect(order(makeCover(ready(['a', 'b']), 'a'))).toEqual(['a', 'b'])
    const list = ready(['a'])
    expect(makeCover(list, 'z')).toBe(list)
  })
})

describe('qué se sube y qué se manda', () => {
  it('se mandan los ids en el orden de la pantalla, sin las que se preparan', () => {
    const list = addPhotos(makeCover(ready(['a', 'b']), 'b'), [{ key: 'c', file: jpeg() }])
    expect(photoIdsToSend(list)).toEqual(['id-b', 'id-a'])
  })

  it('suben solo las que faltan', () => {
    const list = markUploaded(ready(['a', 'b']), 'a')
    expect(photosToUpload(list).map((slot) => slot.key)).toEqual(['b'])
    expect(list.slots[0]).toEqual({
      key: 'a',
      state: 'uploaded',
      photoId: 'id-a',
      preview,
      prepared: 'p-a',
    })
    expect(photoIdsToSend(list)).toEqual(['id-a', 'id-b'])
  })

  it('markUploaded no toca una que se está preparando', () => {
    const list = addPhotos(emptyPhotoList<string>(), [{ key: 'a', file: jpeg() }])
    expect(markUploaded(list, 'a').slots).toEqual([{ key: 'a', state: 'preparing' }])
  })

  it('withNewIds vuelve a subir las preparadas con ids nuevos y deja las publicadas', () => {
    const published = {
      key: 'p',
      state: 'uploaded' as const,
      photoId: 'id-p',
      preview,
      prepared: null,
    }
    const list = markUploaded(ready(['a', 'b']), 'a')
    let next = 0
    const renewed = withNewIds(
      { ...list, slots: [published, ...list.slots] },
      () => `nuevo-${++next}`,
    )
    expect(renewed.slots).toEqual([
      published,
      { key: 'a', state: 'ready', photoId: 'nuevo-1', preview, prepared: 'p-a' },
      { key: 'b', state: 'ready', photoId: 'id-b', preview, prepared: 'p-b' },
    ])
  })
})

describe('shouldRenewIds', () => {
  const published = {
    key: 'p',
    state: 'uploaded' as const,
    photoId: 'id-p',
    preview,
    prepared: null,
  }
  const onlyPublished = emptyPhotoList<string>([published])

  it('con fotos en espera rechazadas, siempre reintenta', () => {
    expect(shouldRenewIds('photos_invalid', onlyPublished)).toBe(true)
  })

  it('«cambió en otra pestaña» reintenta solo si hay fotos subidas desde esta pantalla', () => {
    const uploaded = markUploaded(ready(['a']), 'a')
    expect(shouldRenewIds('changed_elsewhere', uploaded)).toBe(true)
    expect(
      shouldRenewIds('changed_elsewhere', { ...uploaded, slots: [published, ...uploaded.slots] }),
    ).toBe(true)
    expect(shouldRenewIds('changed_elsewhere', onlyPublished)).toBe(false)
    expect(shouldRenewIds('changed_elsewhere', ready(['a']))).toBe(false)
  })

  it('otros fallos no reintentan', () => {
    const uploaded = markUploaded(ready(['a']), 'a')
    expect(shouldRenewIds('site', uploaded)).toBe(false)
    expect(shouldRenewIds('offline', uploaded)).toBe(false)
  })
})

describe('submitReadiness', () => {
  it('con una preparándose, espera', () => {
    const list = addPhotos(ready(['a']), [{ key: 'b', file: jpeg() }])
    expect(preparingKeys(list)).toEqual(['b'])
    expect(submitReadiness(list, ['b'])).toBe('wait')
  })

  it('si una que se esperaba termina rechazada, no se manda nada', () => {
    const list = rejectPhoto(
      addPhotos(ready(['a']), [{ key: 'b', file: jpeg() }]),
      'b',
      'b.jpg',
      'x',
    )
    expect(submitReadiness(list, ['b'])).toBe('blocked')
  })

  it('un rechazo de antes de tocar la acción no bloquea', () => {
    const list = rejectPhoto(
      addPhotos(ready(['a']), [{ key: 'b', file: jpeg() }]),
      'b',
      'b.jpg',
      'x',
    )
    expect(submitReadiness(list, [])).toBe('ready')
  })

  it('sin fotos, vacía; con todas listas o subidas, lista', () => {
    expect(submitReadiness(emptyPhotoList<string>(), [])).toBe('empty')
    expect(submitReadiness(markUploaded(ready(['a', 'b']), 'a'), [])).toBe('ready')
  })
})
