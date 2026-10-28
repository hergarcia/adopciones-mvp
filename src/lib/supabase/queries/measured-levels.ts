import {
  applicationMeasureOf,
  measuredLevelOf,
  type ApplicationMeasure,
  type MeasuredLevel,
} from '@/lib/analytics/measured-levels'
import { createServiceSupabase } from '@/lib/supabase/service'

// Lo que la medición lee de las personas (historia #236). Corre después de que la acción hizo lo
// suyo y nunca lanza: si la base falla, el momento sale sin el dato y la acción sigue igual (R7).

export async function getApplicationMeasure(
  applicationId: string,
): Promise<ApplicationMeasure | null> {
  try {
    const { data, error } = await createServiceSupabase().rpc('application_measure', {
      p_application: applicationId,
    })
    return error ? null : applicationMeasureOf(data[0])
  } catch {
    return null
  }
}

export async function getPetPublisherLevel(code: string): Promise<MeasuredLevel | null> {
  try {
    const { data, error } = await createServiceSupabase().rpc('pet_publisher_level', {
      p_code: code,
    })
    return error ? null : measuredLevelOf(data)
  } catch {
    return null
  }
}
