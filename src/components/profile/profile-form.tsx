'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import type { SaveMoment } from '@/lib/analytics/events'
import type { ProfileSuggestion } from '@/lib/auth/google'
import { profileFormData } from '@/lib/profile/profile-form-data'
import { withSavedFlag } from '@/lib/profile/saved-flag'
import { validateProfile, type ProfileFieldErrors } from '@/lib/schemas/profile'
import { useProfileDraft } from '@/hooks/use-profile-draft'
import { useProfileSave } from '@/hooks/use-profile-save'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { AvatarField } from './avatar-field'
import { LeavingDialog } from './leaving-dialog'
import { ProfileFields } from './profile-fields'
import type { ProfileFormTexts, ProfileFormValues } from './profile-form-types'
import { SaveFailedNotice } from './save-failed-notice'

type Props = {
  texts: ProfileFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  initial: ProfileFormValues
  next?: string
  /** En qué pantalla está: la acción lo usa para confirmar y contar el alta una sola vez. */
  mode: SaveMoment
  /** A dónde lleva «Entrar de nuevo» si la sesión se cerró al guardar (FR-008). */
  signInHref: string
  /** El borrador solo existe mientras el perfil no está completo (FR-021). Editando uno que ya
   *  está guardado, lo que vale es lo guardado. */
  draft?: boolean
  /** Lo que trajo la cuenta de Google, solo al completar el perfil (FR-030b). */
  suggestion?: ProfileSuggestion
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
  mode,
  signInHref,
  draft = false,
  suggestion,
}: Props) {
  const router = useRouter()
  const { values, setValues, clearDraft } = useProfileDraft(initial, draft)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  // Separado del de guardado: son dos campos distintos y cada error va debajo del suyo.
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { save, pending, notice } = useProfileSave({
    onSaved: (data) => {
      clearDraft()
      // El aviso lo muestra la pantalla a la que se llega: montado acá se desmontaría con la
      // navegación de la línea siguiente, antes de que nadie lo lea (docs/10 §Componentes).
      router.push(withSavedFlag(data.redirectTo, data.wasComplete))
    },
    onInvalid: (key) => setError(texts.errors[key] ?? key),
  })

  // Un guardado que no llegó deja la pantalla con cambios sin guardar aunque lo escrito sea lo que
  // trajo: quitar la foto y fallar no es lo mismo que no haber tocado nada (FR-007).
  const dirty =
    JSON.stringify(values) !== JSON.stringify(initial) || avatar !== null || notice !== null
  const { leavingTo, leave, stay } = useUnsavedChanges(dirty && !pending)

  const messageFor = (field: keyof ProfileFieldErrors) =>
    translate(fieldErrors[field], texts.errors)

  const localities = localitiesByDepartment[values.department] ?? []

  const nameIsFromGoogle =
    suggestion?.displayName != null && values.displayName === suggestion.displayName

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  // Guardar y reintentar son lo mismo: el formulario se arma de nuevo con lo que está en pantalla
  // ahora, así que lo que la persona cambió después del fallo también va (FR-004).
  function submit() {
    setError(null)

    // El mismo schema que usa la acción (docs/08 §Dónde vive la lógica): validar acá no es
    // adelantarse, es que el error entre debajo del campo que está mal en vez de arriba del botón.
    const checked = validateProfile(values)
    if (!checked.ok) {
      setFieldErrors(checked.errors)
      return
    }
    setFieldErrors({})

    save(profileFormData(values, { mode, avatar, removeAvatar, next }))
  }

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        noValidate
        className="mt-8 flex flex-col gap-6"
      >
        <AvatarField
          texts={texts.avatar}
          displayName={values.displayName}
          url={removeAvatar ? null : values.avatarUrl}
          suggestedUrl={suggestion?.photoUrl ?? null}
          error={photoError}
          onPick={(file) => {
            setPhotoError(null)
            setAvatar(file)
            setRemoveAvatar(false)
          }}
          onRemove={() => {
            setPhotoError(null)
            setAvatar(null)
            setRemoveAvatar(true)
          }}
          onError={(key) => setPhotoError(texts.errors[key] ?? key)}
        />

        <ProfileFields
          texts={texts}
          departments={departments}
          localities={localities}
          values={values}
          nameHint={nameIsFromGoogle ? texts.nameFromGoogle : undefined}
          errorFor={messageFor}
          onChange={set}
        />

        {/* Arriba del botón queda solo lo que no es de ningún campo: un rechazo que no tiene
            campo propio, o que el guardado no llegó. */}
        {error ? (
          <ErrorText id="profile-error" announce>
            {error}
          </ErrorText>
        ) : null}

        {/* Montado de nuevo en cada fallo, para que el lector de pantalla lo anuncie otra vez aunque
            el texto sea el mismo (FR-002, FR-005). */}
        {notice ? (
          <SaveFailedNotice
            key={notice.attempt}
            reason={notice.reason}
            texts={texts.saveFailed}
            onRetry={submit}
            retryDisabled={pending}
            signInHref={signInHref}
          />
        ) : null}

        <Button type="submit" variant="tirita" size="lg" loading={pending}>
          {texts.submit}
        </Button>
      </form>

      <LeavingDialog
        open={leavingTo !== null}
        texts={texts.leaving}
        onStay={stay}
        onLeave={leave}
      />
    </>
  )
}
