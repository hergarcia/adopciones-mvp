'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveProfile } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ErrorText } from '@/components/ui/error-text'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toast, ToastProvider } from '@/components/ui/toast'
import { useProfileDraft } from '@/hooks/use-profile-draft'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { MONTEVIDEO } from '@/lib/zones/departments'
import { AvatarField } from './avatar-field'
import { LocalityField } from './locality-field'
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
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || avatar !== null
  useUnsavedChanges(dirty && !pending)

  const isMontevideo = values.department === MONTEVIDEO
  const localities = localitiesByDepartment[values.department] ?? []

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

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
      setSaved(true)
      router.push(result.data.redirectTo)
    })
  }

  return (
    <ToastProvider label={texts.toastLabel} regionLabel={texts.toastRegion}>
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

        <label className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">{texts.nameLabel}</span>
          <Input
            name="displayName"
            autoComplete="name"
            placeholder={texts.namePlaceholder}
            value={values.displayName}
            onChange={(event) => set('displayName', event.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">{texts.departmentLabel}</span>
          <Select
            label={texts.departmentLabel}
            options={departments}
            placeholder={texts.departmentPlaceholder}
            value={values.department}
            onValueChange={(value) => {
              set('department', value)
              set('locality', '')
            }}
          />
        </div>

        <LocalityField
          texts={{
            ...texts.locality,
            label: isMontevideo ? texts.localityLabelMontevideo : texts.localityLabel,
          }}
          localities={localities}
          value={values.locality}
          onChange={(value) => set('locality', value)}
        />

        <Checkbox
          label={texts.rescuerLabel}
          checked={values.isRescuer}
          onChange={(event) => set('isRescuer', event.target.checked)}
        />

        {error ? <ErrorText id="profile-error">{error}</ErrorText> : null}

        <Button type="submit" variant="tirita" size="lg" loading={pending}>
          {texts.submit}
        </Button>
      </form>

      <Toast
        message={texts.saved}
        closeLabel={texts.toastClose}
        variant="success"
        open={saved}
        onOpenChange={setSaved}
      />
    </ToastProvider>
  )
}
