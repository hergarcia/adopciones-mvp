# Contrato de rutas y acciones: la vida de una camada (#206)

## Rutas

| Ruta | Grupo | Quién | Qué |
|---|---|---|---|
| `/mis-animales/camadas/[id]` | `(app)` | dueña, con o sin nivel 1 | **nueva**: la camada con todo a la vista (`MyLitterPanel`): estado, vencimiento, acciones de la camada, cada cría con su sello, sus solicitudes nuevas, sus acciones, a quién se entregó y su seguimiento. De otra persona o inexistente: «esta camada no existe». A donde llevan «Ya no está disponible» y los avisos (FR-013, FR-021). `noindex`. `loading.tsx` y `error.tsx` como `/mis-animales/[id]` |
| `/mis-animales` | `(app)` | dueña | cambia: la camada con su sello, su vencimiento, `LitterStatusActions` y `YoungRows` (R9) |
| `/mis-animales/[id]/adoptado` | `(app)` | dueña | cambia: con el id de una cría, «¿A quién se la diste?» con las aceptadas de esa cría, el nombre de la camada en el compromiso y la vuelta a `/mis-animales/camadas/[id]` (FR-028) |
| `/solicitudes` | `(app)` | dueña | cambia: los animales sueltos como hoy y cada camada como `InboxLitterGroup` (R7, FR-023) |
| `/solicitudes/animal/[petId]` | `(app)` | dueña | cambia: con una cría, su nombre y el de la camada arriba y la vuelta a la bandeja |
| `/mis-solicitudes`, `/mis-solicitudes/[id]` | `(app)` | quien solicitó | cambia: el nombre de la camada en la solicitud de una cría (FR-036) |
| `/camadas/[code]` | `(public)` | cualquiera | cambia: sellos por cría, recuento al día, adoptada entera con su sello; pausada o vencida, `PetUnavailable` con los textos de la camada (FR-016 a FR-021) |
| `/camadas/[code]/imagen` | `(public)` | cualquiera | cambia: la adoptada dice que fue adoptada |
| `/sigue-disponible/[token]` | `(public)` | cualquiera con el enlace | cambia: un enlace de camada renueva o vuelve a publicar la camada y `RenewalResult` dice su nombre (FR-012) |
| `/solicitar/[code]` | `(app)` | como hoy | cambia: una cría adoptada muestra `YoungGone` en su variante «ya encontró hogar», con el camino a la ficha de la camada (FR-022) |

`litterPanelPath(litterId)` se suma a `src/lib/litters/paths.ts`.

## Server Actions (`src/actions/litter-status.ts`, nuevo)

Todas devuelven `ActionResult<T, Detail>`; el `error` es una clave de i18n bajo
`litters.status.errors.*`, y un rechazo por estado cambiado lleva el estado de ahora en `detail`
(FR-009).

| Acción | Entrada (zod en `lib/schemas/litter-status.ts`) | Salida |
|---|---|---|
| `changeLitterStatus` | `litterId`, `action` (`pause` · `resume` · `renew` · `republish`), `youngIds?` (solo `republish` de una adoptada, 1 a 10) | `{ state, expiresAt, notice }`; detalle `{ state, expiresAt }` |
| `changeYoungStatus` | `petId`, `action` (`mark_in_process` · `mark_available`) | `{ state, litterState, notice }` |
| `deleteYoung` | `petId` | `{ litterDeleted: boolean }` |

Después de un cambio: `revalidatePath` de `/mis-animales`, del panel de la camada, de `/camadas/{code}`
y del listado; si terminó una adopción, de `/solicitudes` y `/mis-solicitudes` (como
`changePetStatus`). `deleteYoung` y `deleteLitter` corren `trackApplicationClosures` y
`drainApplicationNotices` para que el correo de cierre salga en el momento (FR-034).

`markPetAdopted` (`src/actions/adoptions.ts`) no cambia de entrada; con una cría vuelve a
`/mis-animales/camadas/[id]` y su evento lleva `litter: true`.

## Consultas

- `src/lib/supabase/queries/litter-status.ts` (nuevo): `changeLitterStatusRecord`,
  `changeYoungStatusRecord`, `deleteYoungRecord`, `claimLitterReminders`, `claimLitterExpiries`,
  `createLitterRenewalLink`.
- `src/lib/supabase/queries/litters.ts`: `listMyLitters` y `getMyLitter(id)` con estado, vencimiento y
  crías con estado; `getLitterByCode` con estados.
- `application-responses.ts` (`publisher_inbox`, `inbox_pet`), `applications.ts`
  (`my_applications`, `my_application`), `adoptions.ts`, `follow-ups.ts`: leen `litter_name`.

## Tarea programada

`/api/cron/publicaciones` suma los recordatorios y vencimientos de camadas: por cada camada tomada,
`createLitterRenewalLink` y `sendLitterReminder` (asunto «¿<camada> sigue disponible?», la portada,
el día en que vence, «Sigue disponible» y «Ya no está disponible» al panel de la camada), con el mismo
espaciado que los de animales.
