import type { ExitLevel, ExitOption, ExitOrigin } from '@/lib/verification/exit-question'
import type { TrackedEvent } from './events'

// Lo que se mide de «¿Qué te frena?» (historia #234, research R9): el nivel, el origen, la opción y
// si escribió. Nunca el texto ni un id, como el resto de la medición del sitio.

export function verificationExitAskedEvent(level: ExitLevel, origin: ExitOrigin): TrackedEvent {
  return { name: 'verification_exit_asked', props: { level, origin } }
}

export function verificationExitAnsweredEvent(answer: {
  level: ExitLevel
  option: ExitOption
  origin: ExitOrigin
  wrote: boolean
}): TrackedEvent {
  return {
    name: 'verification_exit_answered',
    props: {
      level: answer.level,
      option: answer.option,
      origin: answer.origin,
      wrote: answer.wrote,
    },
  }
}

export function verificationExitSkippedEvent(level: ExitLevel, origin: ExitOrigin): TrackedEvent {
  return { name: 'verification_exit_skipped', props: { level, origin } }
}
