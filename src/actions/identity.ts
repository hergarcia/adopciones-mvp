'use server'

import { revalidatePath } from 'next/cache'
import { track } from '@/lib/analytics/track'
import { identitySubmissionSchema } from '@/lib/schemas/identity'
import {
  submitIdentityRequest as submitRequest,
  withdrawIdentityRequest as withdrawRequest,
} from '@/lib/supabase/queries/identity'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { isIdentityOrigin, type IdentityOrigin } from '@/lib/verification/identity'
import type { ActionResult } from './result'

// El id de la cuenta sale de la sesión, nunca del navegador.

const PROFILE_PATH = '/mi-perfil'

// El consentimiento de verdad viaja con el envío; esto solo marca el momento (FR-035).
export async function acceptIdentityConsent(origin: IdentityOrigin): Promise<void> {
  if (!isIdentityOrigin(origin) || (await getSessionUser()) === null) return
  await track('identity_consent_accepted', { origin })
}

async function photoOf(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) return null
  return { type: value.type, bytes: new Uint8Array(await value.arrayBuffer()) }
}

export async function submitIdentityRequest(form: FormData): Promise<ActionResult<null>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'identity.errors.session' }

  const parsed = identitySubmissionSchema.safeParse({
    consent: form.get('consent'),
    origin: form.get('origin'),
    front: await photoOf(form.get('front')),
    selfie: await photoOf(form.get('selfie')),
  })
  if (!parsed.success) return { ok: false, error: 'identity.errors.photo' }
  const { origin, front, selfie } = parsed.data

  const submitted = await submitRequest({
    userId: user.id,
    origin,
    front: Buffer.from(front.bytes).toString('base64'),
    selfie: Buffer.from(selfie.bytes).toString('base64'),
  })

  switch (submitted?.decision) {
    case 'sent':
      await track('identity_request_sent', { origin })
      revalidatePath(PROFILE_PATH)
      return { ok: true, data: null }
    case 'no_phone':
      return { ok: false, error: 'identity.errors.no_phone' }
    case 'already_open':
    case 'already_verified':
      return { ok: false, error: 'identity.errors.already_open' }
    case 'capped':
      await track('identity_cap_reached', { origin })
      return { ok: false, error: 'identity.errors.capped' }
    default:
      return { ok: false, error: 'identity.errors.send_failed' }
  }
}

export async function withdrawIdentityRequest(): Promise<ActionResult<null>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'identity.errors.session' }

  const withdrawn = await withdrawRequest(user.id)
  if (withdrawn === null) return { ok: false, error: 'identity.errors.withdraw_failed' }
  if (withdrawn.decision !== 'withdrawn') return { ok: false, error: 'identity.errors.not_open' }

  await track('identity_request_withdrawn', { origin: withdrawn.origin })
  revalidatePath(PROFILE_PATH)
  return { ok: true, data: null }
}
