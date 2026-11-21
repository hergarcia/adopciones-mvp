# Data model — Saber si el nivel de verificación pesa

Ninguna tabla, columna, política ni dato nuevo de una persona (spec FR-022). Lo nuevo son dos
funciones de lectura y la forma de unos momentos de medición.

## Funciones nuevas (migración `20261028130000_measured_levels.sql`)

### `public.application_measure(p_application uuid)`

`returns table (applicant_level smallint, applicant_follow_up boolean, publisher_level smallint)`,
`language sql stable security definer set search_path = ''`.

| Columna | Valor | Nulo cuando |
|---|---|---|
| `applicant_level` | `private.person_level(a.applicant_id)`: 0 a 3, la chapita de hoy | nunca: borrar la cuenta de quien solicitó borra la solicitud (`on delete cascade`), y no hay fila |
| `applicant_follow_up` | `(private.follow_up_counts(a.applicant_id)).adopted > 0` | ídem |
| `publisher_level` | `private.person_level(a.publisher_id)` | `a.publisher_id` es nulo |

Sin la solicitud, ninguna fila. No mira quién llama: el servicio ya resolvió la sesión y el dueño
antes (las acciones la llaman solo después de una respuesta hecha).

### `public.pet_publisher_level(p_code text)`

`returns smallint`, `language sql stable security definer set search_path = ''`.
`private.person_level(p.owner_id)` del animal con ese código, o nulo si no existe. Una cría está en
`pets` con su código y su `owner_id`.

### Grants

```text
revoke all on function public.application_measure(uuid) from public, anon, authenticated;
revoke all on function public.pet_publisher_level(text) from public, anon, authenticated;
grant execute on function public.application_measure(uuid) to service_role;
grant execute on function public.pet_publisher_level(text) to service_role;
```

## Tipos en TypeScript

- `MeasuredLevel = 0 | 1 | 2 | 3`
- `ApplicantMeasure = { level: MeasuredLevel; followUp: boolean }`
- `ApplicationMeasure = { applicant: ApplicantMeasure | null; publisherLevel: MeasuredLevel | null }`
- `ProfileViewOrigin = 'link' | 'site' | 'application'`
- `RequiredLevel = 1 | 2` (el que ya usa `apply_tapped.required`)

Una fila con un número fuera de 0 a 3 se lee como `null`, nunca se recorta a un nivel (FR-018).

## Validación

- El nivel exigido llega validado por los schemas de publicar (`lib/schemas/pet`, el de camada); no
  hay entrada nueva de la persona.
- La marca `desde=solicitud` se compara con un valor fijo; cualquier otro valor es «sin marca».
