'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveProfile } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { ErrorText } from '@/components/ui/error-text'
import { validateProfile, type ProfileFieldErrors } from '@/lib/schemas/profile'
import { useProfileDraft } from '@/hooks/use-profile-draft'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { AvatarField } from './avatar-field'
import { ProfileFields } from './profile-fields'
import type { ProfileFormTexts, ProfileFormValues } from './profile-form-types'

type Props = {
  texts: ProfileFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  initial: ProfileFormValues
  next?: string
  /** El borrador solo existe mientras el perfil no está completo (FR-021). Editando uno que ya
   *  está guardado, lo que vale es lo guardado. */
  draft?: boolean
}

function translate(key: string | undefined, dictionary: Record<string, string>) {
  return key === undefined ? undefined : (dictionary[key] ?? key)
}

export function ProfileForm({
  texts,
  departments,
  localitiesByDepartment,
  initial,
  next,
  draft = false,
}: Props) {
  const router = useRouter()
  const { values, setValues, clearDraft } = useProfileDraft(initial, draft)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || avatar !== null
  const { leavingTo, leave, stay } = useUnsavedChanges(dirty && !pending)

  const messageFor = (field: keyof ProfileFieldErrors) =>
    translate(fieldErrors[field], texts.errors)

  const localities = localitiesByDepartment[values.department] ?? []

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    // El mismo schema que usa la acción (docs/08 §Dónde vive la lógica): validar acá no es
    // adelantarse, es que el error entre debajo del campo que está mal en vez de arriba del botón.
    const checked = validateProfile(values)
    if (!checked.ok) {
      setFieldErrors(checked.errors)
      return
    }
    setFieldErrors({})

    const form = new FormData()
    form.set('displayName', values.displayName)
    form.set('department', values.department)
    form.set('locality', values.locality)
    form.set('isRescuer', String(values.isRescuer))
    form.set('removeAvatar', String(removeAvatar))
    if (next) form.set('next', next)
    if (avatar) form.set('avatar', avatar)

    startTransition(async () => {
      const result = await saveProfile(form)
      if (!result.ok) {
        // Lo escrito se queda donde está: un guardado que falla no puede costarle el formulario.
        setError(texts.errors[result.error] ?? result.error)
        return
      }
      clearDraft()
      // El aviso lo muestra la pantalla a la que se llega: montado acá se desmontaría con la
      // navegación de la línea siguiente, antes de que nadie lo lea (docs/10 §Componentes).
      router.push(withSavedFlag(result.data.redirectTo, result.data.wasComplete))
    })
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-6">
        <AvatarField
          texts={texts.avatar}
          displayName={values.displayName}
          url={removeAvatar ? null : values.avatarUrl}
          onPick={(file) => {
            setAvatar(file)
            setRemoveAvatar(false)
          }}
          onRemove={() => {
            setAvatar(null)
            setRemoveAvatar(true)
          }}
          onError={(key) => setError(texts.errors[key] ?? key)}
        />

        <ProfileFields
          texts={texts}
          departments={departments}
          localities={localities}
          values={values}
          errorFor={messageFor}
          onChange={set}
        />

        {/* Arriba del botón queda solo lo que no es de ningún campo: que el guardado no salió. */}
        {error ? <ErrorText id="profile-error">{error}</ErrorText> : null}

        <Button type="submit" variant="tirita" size="lg" loading={pending}>
          {texts.submit}
        </Button>
      </form>

      {/* Perder lo escrito no se deshace, que es para lo que docs/10 reserva el Dialog. */}
      <Dialog
        open={leavingTo !== null}
        onOpenChange={stay}
        title={texts.leaving.title}
        closeLabel={texts.leaving.close}
      >
        <p className="text-base text-ink">{texts.leaving.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {/* Seguir editando primero: es lo que quiere quien llegó acá sin querer. */}
          <Button variant="primary" onClick={stay}>
            {texts.leaving.stay}
          </Button>
          <Button variant="secondary" onClick={leave}>
            {texts.leaving.leave}
          </Button>
        </div>
      </Dialog>
    </>
  )
}

// El aviso dice lo que decía el botón: «Guardar» → «Perfil guardado», «Guardar cambios» →
// «Cambios guardados» (docs/10 §Textos). Quién guardó por primera vez lo sabe la acción, no el
// formulario, así que viaja en la marca.
//
// Y solo se agrega cuando el destino es la pantalla que sabe mostrarla: pegársela a cualquier
// ruta dejaría una marca que nadie lee colgada de la URL.
const SHOWS_CONFIRMATION = '/mi-perfil'

function withSavedFlag(destination: string, wasComplete: boolean): string {
  if (!destination.startsWith(SHOWS_CONFIRMATION)) return destination

  const separator = destination.includes('?') ? '&' : '?'
  return `${destination}${separator}guardado=${wasComplete ? 'cambios' : 'perfil'}`
}
