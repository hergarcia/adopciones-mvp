'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, type ComponentType } from 'react'
import { flushSync } from 'react-dom'
import { ErrorText } from '@/components/ui/error-text'
import type { SaveMoment } from '@/lib/analytics/events'
import type { ProfileSuggestion } from '@/lib/auth/google'
import { leavingLoss } from '@/lib/profile/leaving-loss'
import { profileFormData } from '@/lib/profile/profile-form-data'
import { withSavedFlag } from '@/lib/profile/saved-flag'
import { trackProfileMoment } from '@/actions/profile'
import { fillFragment } from '@/lib/forms/fill-fragment'
import type { ProfileFieldErrors } from '@/lib/schemas/profile'
import { afterOpenModule, useAfterOpen } from '@/hooks/use-after-open'
import { useAvatarChoice } from '@/hooks/use-avatar-choice'
import { useProfileSave } from '@/hooks/use-profile-save'
import { AvatarField } from './avatar-field'
import { PersonalDataNotice } from './personal-data-notice'
import { ProfileFields } from './profile-fields'
import { ProfileFormTirita } from './profile-form-tirita'
import type {
  ProfileDraft,
  ProfileFieldIds,
  ProfileFormTexts,
  ProfileFormValues,
  ProfileLeavingProps,
} from './profile-form-types'
import { SaveFailedNotice } from './save-failed-notice'

// Las reglas del perfil traen zod, 34 KB: llegan después de abrir, y un «Guardar» que llega antes
// las espera trabajando (historia #326, como el cuestionario en #304).
const loadProfileRules = afterOpenModule(() => import('@/lib/schemas/profile'))
type ProfileRules = Awaited<ReturnType<typeof loadProfileRules>>

// El orden de la pantalla: el foco va al primero que falta.
const FIELD_ORDER = ['displayName', 'department', 'locality'] as const

function focusFirstMissing(errors: ProfileFieldErrors, ids: ProfileFieldIds) {
  const first = FIELD_ORDER.find((field) => errors[field] !== undefined)
  const target = first === undefined ? null : document.getElementById(ids[first])
  target?.focus()
  // En el centro y no apenas asomado: en el teléfono, el teclado que abre el campo tapa la mitad de
  // abajo de la pantalla.
  target?.scrollIntoView({ block: 'center' })
}

export type ProfileFormProps = {
  texts: ProfileFormTexts
  departments: { value: string; label: string }[]
  localitiesByDepartment: Record<string, readonly string[]>
  initial: ProfileFormValues
  next?: string
  /** En qué pantalla está: la acción lo usa para confirmar y contar el alta una sola vez. */
  mode: SaveMoment
  /** A dónde lleva «Entrar de nuevo» si la sesión se cerró al guardar (FR-008). */
  signInHref: string
  /** Lo que está en pantalla: en el alta, con su borrador en este navegador (`CreateProfileForm`). */
  draft: ProfileDraft
  /** El aviso de salir sin guardar, con su guardia: cada pantalla decide cuándo baja. */
  Leaving: ComponentType<ProfileLeavingProps>
  /** Lo que trajo la cuenta de Google, solo al completar el perfil (FR-030b). */
  suggestion?: ProfileSuggestion
  /** Las salidas de la cuenta al pie, solo en el alta (FR-016b de #9). */
  accountActions?: React.ReactNode
}

export function ProfileForm({
  texts,
  departments,
  localitiesByDepartment,
  initial,
  next,
  mode,
  signInHref,
  draft,
  Leaving,
  suggestion,
  accountActions,
}: ProfileFormProps) {
  const router = useRouter()
  const base = useId()
  const ids: ProfileFieldIds = {
    displayName: `${base}-name`,
    department: `${base}-department`,
    locality: `${base}-locality`,
  }
  const rules = useAfterOpen(loadProfileRules)
  const [checking, setChecking] = useState(false)
  const { values, setValues, clearDraft, canKeepDraft } = draft
  const photo = useAvatarChoice()
  const { avatar, removeAvatar } = photo
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const { save, busy, notice } = useProfileSave({
    moment: mode,
    onSaved: (data) => {
      clearDraft()
      // El aviso lo muestra la pantalla a la que se llega: montado acá se desmontaría con la
      // navegación de la línea siguiente, antes de que nadie lo lea (docs/10 §Componentes).
      // El alta se reemplaza en el historial: es un paso de ida, y «Atrás» traería del caché del
      // router un formulario vacío para un perfil que ya existe.
      const destination = withSavedFlag(data.redirectTo, data.wasComplete)
      if (mode === 'create') router.replace(destination)
      else router.push(destination)
    },
    // La acción rechaza con la misma regla que el formulario: si igual llega un rechazo, se vuelve a
    // validar acá para que cada error vaya debajo de su campo, con el fragmento que cita.
    onInvalid: (key) => {
      loadProfileRules().then(
        (loaded) => {
          const checked = loaded.validateProfile(values)
          if (checked.ok) setError(texts.errors[key] ?? key)
          else showFieldErrors(checked.errors)
        },
        () => setError(texts.errors[key] ?? key),
      )
    },
  })
  const sessionClosed = notice?.reason === 'session'

  // Quitar la foto no cambia `values` y es un cambio (FR-001). Un guardado que no llegó deja la
  // pantalla con cambios sin guardar aunque lo escrito sea lo que trajo (FR-007).
  const photoPicked = avatar !== null || photo.isPreparing
  const changed =
    JSON.stringify(values) !== JSON.stringify(initial) ||
    photoPicked ||
    removeAvatar ||
    notice !== null
  const loss = leavingLoss({ keepsDraft: canKeepDraft, changed, photoPicked })

  const messageFor = (field: keyof ProfileFieldErrors) => {
    const found = fieldErrors[field]
    return found === undefined
      ? undefined
      : fillFragment(texts.errors[found.key] ?? found.key, found.values?.fragment)
  }

  const localities = localitiesByDepartment[values.department] ?? []

  const nameIsFromGoogle =
    suggestion?.displayName != null && values.displayName === suggestion.displayName

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  // Dibujados antes de mover el foco: el lector de pantalla lee la etiqueta junto con el error.
  function showFieldErrors(errors: ProfileFieldErrors) {
    flushSync(() => setFieldErrors(errors))
    focusFirstMissing(errors, ids)
  }

  function check(loaded: ProfileRules | null) {
    const send = () => void save(profileFormData(values, { mode, avatar, removeAvatar, next }))
    // Sin las reglas, que no llegaron, revisa la acción con el mismo schema.
    if (loaded === null) {
      send()
      return
    }

    // El mismo schema que usa la acción (docs/08 §Dónde vive la lógica): validar acá no es
    // adelantarse, es que el error entre debajo del campo que está mal en vez de arriba del botón.
    const checked = loaded.validateProfile(values)
    if (!checked.ok) {
      showFieldErrors(checked.errors)
      for (const rejected of loaded.profileContactRejections(checked.errors))
        void trackProfileMoment('profile_contact_rejected', rejected)
      return
    }
    setFieldErrors({})
    send()
  }

  // Guardar y reintentar son el mismo toque: el formulario se arma de nuevo con lo que está en
  // pantalla ahora, así que lo que la persona cambió después del fallo también va (FR-004).
  function submit() {
    if (busy || checking) return
    setError(null)
    if (rules !== null) {
      check(rules)
      return
    }
    setChecking(true)
    void loadProfileRules()
      .catch(() => null)
      .then((loaded) => {
        setChecking(false)
        check(loaded)
      })
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
          error={photo.photoError}
          onPrepare={photo.prepare}
          onPick={photo.pick}
          onRemove={photo.remove}
          onError={(key) => photo.fail(texts.errors[key] ?? key)}
        />

        <ProfileFields
          texts={texts}
          departments={departments}
          localities={localities}
          values={values}
          ids={ids}
          nameHint={nameIsFromGoogle ? texts.nameFromGoogle : undefined}
          publicHint={texts.publicHint}
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

        {notice ? (
          <SaveFailedNotice
            reason={notice.reason}
            attempt={notice.attempt}
            texts={texts.saveFailed}
            loss={loss}
          />
        ) : null}

        <ProfileFormTirita
          busy={busy || checking}
          sessionClosed={sessionClosed}
          signInHref={signInHref}
          texts={{ submit: texts.submit, signIn: texts.saveFailed.signIn }}
        />
      </form>

      <div className="mt-6">
        <PersonalDataNotice {...texts.dataNotice} />
      </div>

      {/* Con la sesión cerrada no hay cuenta de la que salir: «Cerrar sesión» cerraría lo que ya
          está cerrado y se llevaría el borrador que el aviso promete, y «Borrar mi cuenta» no puede
          andar. El único paso es la tirita. */}
      {sessionClosed ? null : accountActions}

      <Leaving loss={loss} saving={busy} texts={texts.leaving} />
    </>
  )
}
