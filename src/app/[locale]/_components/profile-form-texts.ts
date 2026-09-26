import { getTranslations } from 'next-intl/server'
import type { ProfileFormTexts } from '@/components/profile/profile-form-types'
import { DEPARTMENTS } from '@/lib/zones/departments'
import { localitiesFor } from '@/lib/zones/localities'

// Las dos pantallas del formulario —completar y editar— comparten todo salvo el verbo del botón y
// el aviso de guardado. Armar los textos dos veces sería el mismo bloque copiado (docs/08 §Regla
// de dos), así que vive acá.
export async function profileFormTexts(mode: 'complete' | 'edit'): Promise<ProfileFormTexts> {
  const t = await getTranslations('profile.form')
  const errors = await getTranslations('profile.errors')
  const failed = await getTranslations('profile.save_failed')
  const mine = await getTranslations(mode === 'complete' ? 'profile.complete' : 'profile.edit')

  return {
    nameLabel: t('name_label'),
    namePlaceholder: t('name_placeholder'),
    nameFromGoogle: t('name_from_google'),
    departmentLabel: t('department_label'),
    departmentPlaceholder: t('department_placeholder'),
    localityLabel: t('locality_label'),
    localityLabelMontevideo: t('locality_label_montevideo'),
    locality: {
      label: t('locality_label'),
      placeholder: t('locality_placeholder'),
      hint: t('locality_hint'),
      suggestionsNone: t('locality_suggestions_none'),
      suggestionsOne: t('locality_suggestions_one'),
      suggestionsMany: t.raw('locality_suggestions_many'),
    },
    rescuerLabel: t('rescuer_label'),
    submit: mine('submit'),
    leaving: {
      title: t('leaving_title'),
      body: t('leaving_body'),
      stay: t('leaving_stay'),
      leave: t('leaving_leave'),
      close: t('leaving_close'),
    },
    saveFailed: {
      offline: failed('offline'),
      noResponse: failed('no_response'),
      session: failed('session'),
      sessionDraft: failed('session_draft'),
      sessionDraftPhoto: failed('session_draft_photo'),
      retry: failed('retry'),
      signIn: failed('sign_in'),
    },
    avatar: {
      add: t('photo_add'),
      change: t('photo_change'),
      remove: t('photo_remove'),
      alt: t('photo_alt'),
      suggestion: {
        question: t('photo_google_question'),
        use: t('photo_google_use'),
        alt: t('photo_google_alt'),
      },
    },
    errors: {
      'profile.errors.name_required': errors('name_required'),
      'profile.errors.name_too_short': errors('name_too_short'),
      'profile.errors.name_too_long': errors('name_too_long'),
      'profile.errors.name_has_email': errors('name_has_email'),
      'profile.errors.name_has_phone': errors('name_has_phone'),
      'profile.errors.name_has_web': errors('name_has_web'),
      'profile.errors.locality_required': errors('locality_required'),
      'profile.errors.locality_too_long': errors('locality_too_long'),
      'profile.errors.locality_has_email': errors('locality_has_email'),
      'profile.errors.locality_has_phone': errors('locality_has_phone'),
      'profile.errors.locality_has_web': errors('locality_has_web'),
      'profile.errors.department_required': errors('department_required'),
      'profile.errors.photo_type': errors('photo_type'),
      'profile.errors.photo_too_big': errors('photo_too_big'),
      'profile.errors.photo_failed': errors('photo_failed'),
      'profile.errors.google_photo_failed': errors('google_photo_failed'),
      'profile.errors.save_failed': errors('save_failed'),
      'profile.errors.session': errors('session'),
    },
  }
}

export function departmentOptions() {
  return DEPARTMENTS.map((d) => ({ value: d.code, label: d.name }))
}

// Todas las localidades viajan con la pantalla: FR-019a prohíbe una espera y un error en las
// sugerencias, así que no puede haber carga por departamento.
export function localitiesByDepartment(): Record<string, readonly string[]> {
  return Object.fromEntries(DEPARTMENTS.map((d) => [d.code, localitiesFor(d.code)]))
}
