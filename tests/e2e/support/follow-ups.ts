import { expect } from '@playwright/test'
import { service } from './pet-owner'

/**
 * La adopción marcada con la base y movida 31 días atrás, con la vuelta horaria corrida sin esperar:
 * el seguimiento queda pedido, como el día del correo (historia #69).
 */
export async function adoptedMonthAgo(ownerId: string, petId: string, applicationId: string) {
  const db = service()
  const marked = await db.rpc('mark_pet_adopted', {
    p_owner: ownerId,
    p_pet: petId,
    p_attempt: crypto.randomUUID(),
    p_application: applicationId,
  })
  expect(marked.error).toBeNull()
  // `adoptions_forward_only` no deja mover `marked_at`: la fila se vuelve a escribir con otro día.
  const { data: row } = await db.from('adoptions').select('*').eq('pet_id', petId).single()
  expect(row).not.toBeNull()
  await db.from('adoptions').delete().eq('id', row.id)
  const monthAgo = new Date(Date.now() - 31 * 24 * 3_600_000).toISOString()
  const inserted = await db.from('adoptions').insert({ ...row, marked_at: monthAgo })
  expect(inserted.error).toBeNull()
  expect((await db.rpc('run_follow_up_tick')).error).toBeNull()
}
