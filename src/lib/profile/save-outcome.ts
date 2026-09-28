import { SAVE_MOMENTS, type SaveMoment, type TrackedEvent } from '@/lib/analytics/events'

// El modo viene del formulario: solo decide la confirmación y la medición, nunca abre nada que la
// sesión no permita ya. Cualquier cosa que no sea un modo conocido es una edición.
export function parseSaveMoment(value: unknown): SaveMoment {
  return SAVE_MOMENTS.find((moment) => moment === value) ?? 'edit'
}

type Input = { existedBefore: boolean; mode: SaveMoment; recovered: boolean }

// Qué se cuenta y qué se confirma después de guardar. El reintento de un alta cuya respuesta se
// perdió encuentra el perfil ya creado: sigue siendo un alta para la persona («Perfil guardado») y
// no se cuenta otra vez, ni como alta ni como edición (FR-012, FR-013).
export function profileSaveOutcome({ existedBefore, mode, recovered }: Input): {
  events: TrackedEvent[]
  wasComplete: boolean
} {
  const events: TrackedEvent[] = []
  if (!existedBefore) events.push({ name: 'account_creation_finished' })
  else if (mode === 'edit') events.push({ name: 'profile_edited' })
  if (recovered) events.push({ name: 'profile_save_recovered', props: { moment: mode } })

  return { events, wasComplete: existedBefore && mode === 'edit' }
}
