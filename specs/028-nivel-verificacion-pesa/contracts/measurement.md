# Contrato — los momentos de medición que cambian

Las propiedades de cada momento después de esta historia. Lo que ya llevaba sigue igual. `?` es una
propiedad que falta cuando el dato no se pudo leer (spec FR-018); nunca vale `null` ni un nivel por
defecto. Ningún momento lleva un id, un código, un nombre ni un texto (FR-020).

| Momento | Propiedades nuevas | Cuándo |
|---|---|---|
| `pet_published` | `required_level: 1 \| 2` | una publicación nueva, animal o camada (una vez por camada) |
| `pet_edited` | `required_level: 1 \| 2` | una edición guardada; el valor después de guardar |
| `pet_viewed` | `publisher_level?: 1 \| 2 \| 3` | ficha de un animal o de una camada a la vista |
| `apply_tapped` | `publisher_level?: 0 \| 1 \| 2 \| 3` | con o sin sesión |
| `application_sent` | `applicant_level?: 0..3`, `publisher_level?: 0..3` | solicitud nueva enviada |
| `application_accepted` | `applicant_level?: 0..3`, `applicant_follow_up?: boolean` | aceptada ahora, no el segundo toque |
| `application_rejected` | ídem | rechazada ahora, con su `reason` |
| `question_asked` | ídem | pregunta hecha ahora |
| `application_first_response` | ídem, los mismos valores que el momento de la respuesta | la primera respuesta |
| `acceptance_revoked` | ídem | dejada sin efecto ahora, con su `reason` |
| `pet_handed_over` | ídem, **solo** con `to: 'site'` | entregado ahora; con `to: 'outside'` no lleva ninguna |
| `public_profile_viewed` | `origin` suma `'application'` | marca `desde=solicitud` y llegada desde el sitio |

## «Ver su perfil»

`publicProfilePath(publicId, { from: 'application' })` → `/perfil/<publicId>?desde=solicitud`. Solo
lo usa la pantalla de una solicitud del lado de quien publicó. Las demás llamadas siguen sin marca.

## Las consultas

```ts
getApplicationMeasure(applicationId: string): Promise<ApplicationMeasure | null>
getPetPublisherLevel(code: string): Promise<MeasuredLevel | null>
```

Las dos con el cliente de servicio, en `src/lib/supabase/queries/measured-levels.ts`. Nunca lanzan:
un error, una fila que falta o un valor fuera de rango dan `null`.
