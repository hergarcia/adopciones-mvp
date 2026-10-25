# Research: Publicar una camada (#205)

Cada decisión con su motivo y lo que se descartó. Las referencias a código son de `main` al
2026-10-25 (después de #222).

## R1. Una cría es un animal (`pets`) que pertenece a una camada (`litters`)

- **Decision**: tabla nueva `litters` con lo común, y cada cría es una fila de `pets` con
  `litter_id` (FK, `on delete cascade`). Lo común se escribe en la camada y se **copia** a cada cría
  en la misma transacción de publicar o guardar; lo propio (nombre, sexo, descripción, fotos) vive
  solo en la cría.
- **Rationale**: todo lo que pasa después de ver un animal está atado a `pets.id`: la solicitud de
  #63 (`applications.pet_id`), sus respuestas y la bandeja de #65, la entrega de #67, el seguimiento
  de #69, los avisos por correo, `/solicitar/[code]` y lo que #206 va a construir por cría (estados,
  vencimiento, entrega). Con la cría como `pets`, pedir una cría es pedir un animal sin tocar nada
  de eso, y las columnas `not null` de `pets` (especie, edad, tamaño, zona, nivel exigido) tienen
  valor porque se copian. La camada es la única fuente de lo común: nadie edita lo común de una
  cría por separado (las funciones de guardar un animal la rechazan, R6).
- **Alternatives considered**: (a) tabla `litter_young` aparte y solicitudes polimórficas (pet o
  cría): duplica #63, #65, #67 y #69 y obliga a #206 a hacerlo otra vez. (b) Sin tabla de camada,
  agrupando `pets` por un `group_id` y lo común repetido: no hay dónde guardar el nombre de la
  camada, sus fotos, su enlace ni su revisión. (c) Leer lo común con un join en cada consulta en
  lugar de copiarlo: cada función que hoy lee `pets` (listado, solicitudes, correos, admin) tendría
  que aprender el join; la copia deja esas funciones como están.

## R2. Las crías no vencen ni cambian de estado en esta historia

- **Decision**: una cría nace con `status = 'available'` y `expires_at = 'infinity'`. Las
  funciones del ciclo de vida de un animal (`change_pet_status`, `delete_pet`, renovar, volver a
  publicar, `create_pet_renewal_link`) y `save_pet` rechazan una fila con `litter_id` con el error
  `litter_young`. Los recordatorios y vencimientos (`claim_pet_reminders`, `claim_pet_expiries`)
  no las tocan porque `infinity` nunca entra en su ventana.
- **Rationale**: la spec deja los estados, la pausa y el vencimiento por cría a #206 (Assumptions).
  `infinity` es un valor válido de `timestamptz` y no pide tocar ninguna consulta del ciclo de vida;
  #206 lo reemplaza por la fecha real.
- **Alternatives considered**: `expires_at` nullable: obliga a revisar cada comparación con
  `now()` de cuatro migraciones; una fecha lejana inventada: engaña a quien lea la fila.

## R3. El enlace de la camada es `/camadas/{code}`, con el código del mismo pozo

- **Decision**: `litters.code` sale del pozo `pet_codes` de #57 (`private.claim_pet_code`), con los
  mismos triggers de asignar y no cambiar. La ficha es `/camadas/{code}` y su imagen
  `/camadas/{code}/imagen`. Las crías también tienen su código de `pets` (lo exige
  `/solicitar/{code}`), pero no enlace público propio: `/animales/{código de una cría}` redirige
  (307) a `/camadas/{código de la camada}`.
- **Rationale**: un pozo único garantiza que ningún código se repite entre animales y camadas, así
  el cursor del listado `(published_at, code)` sigue siendo un orden total con las dos mezcladas. Una
  ruta aparte deja a la ficha de un animal tal cual y le da a la camada su propia vista previa.
  Redirigir el código de una cría cubre los enlaces de «volver a la ficha» que ya existen en el
  cuestionario y en «Mis solicitudes» sin tocarlos (FR-034: las crías no tienen enlace propio).
- **Alternatives considered**: servir la camada en `/animales/{code}`: `pet_by_code` tendría que
  devolver dos formas, y la ficha de un animal mezclaría dos pantallas.

## R4. El listado es una sola función que mezcla animales sueltos y camadas

- **Decision**: `listed_pets` se borra y se recrea con tres columnas nuevas, `kind`
  (`pet` | `litter`), `young_count` y `available_count`, y la unión de los animales sueltos a la
  vista (`litter_id is null`) con las camadas a la vista. En una camada, `sex` es `null`, los
  filtros de especie, tamaño, departamento, castrado y edad se aplican a la camada, y el de sexo
  pide que exista una cría disponible de ese sexo. El `count(*) over ()` cuenta una fila por camada.
  La portada del sitio usa la misma función (FR-041).
- **Rationale**: un solo orden y un solo cursor; el total sale bien sin sumar dos consultas.
  Disponible en esta historia es «la cría existe y su camada está a la vista» (R2); #206 lo cambia
  en un solo lugar (`private.litter_available_count`).
- **Alternatives considered**: dos consultas intercaladas en TypeScript: el cursor y el total se
  rompen en el borde de cada página.

## R5. A la vista y privacidad: las mismas reglas, en la base

- **Decision**: `private.litter_is_shown(l)` = sin baja y `private.pet_is_listed(owner)`;
  `public.litter_by_code(code)` copia la forma de `pet_by_code` (bloqueo primero, suspendida como
  inexistente, `hidden` para la persona sin nivel 1 hoy, todo para la dueña) y suma `young jsonb`
  con cada cría (id público = su código, nombre, sexo, descripción, fotos). Las fotos se sirven con
  la policy de storage de #57 ensanchada: `pet_photo_object_listed` acepta la foto de una camada a
  la vista y la de una cría cuya camada está a la vista; `pet_photo_object_in_review` igual para
  quien administra. `litters` tiene RLS con lectura solo de la dueña; nadie más lee la tabla.
- **Rationale**: constitución §V, cada regla de visibilidad vive en la base y tiene su test.
  Copiar la forma de `pet_by_code` deja que la ficha reuse el armado de estados de
  `lib/pets/pet-page-state.ts`.

## R6. Publicar y guardar: dos funciones atómicas e idempotentes

- **Decision**: `publish_litter(p_owner, p_attempt, p_pending_ttl, p_staged_ttl, p_fields,
  p_photo_ids, p_young)` y `save_litter(p_owner, p_litter, p_pending_ttl, p_staged_ttl, p_fields,
  p_photo_ids, p_young)`. `p_young` es un arreglo de `{ id?, key, name, sex, description,
  photo_ids }`: `key` es un uuid que el navegador genera al agregar la cría y se guarda como
  `pets.attempt_id`, así un reintento encuentra la cría ya creada en lugar de crear otra (FR-016).
  `publish_litter` exige 2 a 10 crías; `save_litter`, 1 a 10. Una cría existente que no viene en
  `p_young` se quita borrando su fila: el trigger `applications_close_on_pet_delete` de #63 ya
  cierra sus solicitudes abiertas con el motivo `unpublished` y el nombre de la cría (FR-019). Esta
  historia no suma avisos a quienes pidieron: si el sitio ya les muestra el cierre de una solicitud
  por un animal borrado, lo ven igual; lo propio de la camada es de #206. Quitar la última no pasa por `save_litter`: es `delete_litter(p_owner, p_litter)`, que
  borra la camada, sus crías y sus fotos (FR-020). Un `preview_litter_removal(p_litter, p_ids)`
  devuelve cuántas solicitudes abiertas se cierran, para la confirmación.
- **Rationale**: igual que `publish_pet` y `save_pet` (#53, #59): `lock_phone_account`, nivel 1,
  fotos en espera del dueño y dentro del TTL, todo en una transacción.
- **Nombres repetidos**: columna generada `pets.name_key` (`lower(btrim(name))`) y una restricción
  `unique (litter_id, name_key) deferrable initially deferred`, así intercambiar dos nombres en un
  guardado no choca a mitad de la sentencia. El formulario los marca antes (FR-008); la base es la
  red.
- **Fecha de entrega**: `litters.delivers_from date null`. Las dos funciones rechazan
  (`delivery_date_past`) una fecha menor que `public.uruguay_today()` solo si cambió (FR-013).

## R7. Fotos de la camada en `pet_photos`

- **Decision**: `pet_photos` suma `litter_id` (FK `on delete cascade`). Una foto pegada tiene
  `pet_id` o `litter_id`, nunca los dos (check), y su `position`; único `(litter_id, position)`
  diferido como el de `pet_id`. Las fotos de una cría son fotos de su fila `pets`, de 0 a 5. Se
  suben con el mismo `stage_pet_photo` y las purga la misma purga.
- **Rationale**: el procesado en el navegador (3 WebP + ThumbHash, sin ubicación), la subida, la
  firma de URLs y la purga ya existen para `pet_photos`; una tabla de fotos aparte los duplicaría.

## R8. Revisión: la camada es una entrada de `pet_reviews`

- **Decision**: `pet_reviews` suma `litter_id`; `pet_id` pasa a nullable con un check de que hay
  exactamente uno. Un trigger en `litters` crea la revisión `new`; el trigger de `pets` no la crea
  para una cría. `save_litter` vuelve a encolar con `edited`, como `save_pet`. `pet_review_queue`
  devuelve `kind` y, para una camada, sus crías con sus fotos; `count_pet_reviews` las cuenta.
  `resolve_litter_review` marca revisada o da de baja: la baja escribe `taken_down_at`, motivo y
  nota en la camada y en cada cría, y sus solicitudes abiertas las cierra el trigger
  `applications_close_on_pet_change` de #63 al cambiar `taken_down_at` de cada cría, la misma regla
  que un animal dado de baja (FR-044).
- **Rationale**: una sola cola y un solo contador en el inicio de Administrar (#191); copiar la baja
  a las crías hace que `pet_is_shown` y las funciones de solicitar las vean dadas de baja sin
  cambios.

## R9. «Publicar un animal» empieza con la pregunta, y una cría sola pasa al formulario de un animal

- **Decision**: `/mis-animales/publicar` sin `tipo` muestra la pregunta con dos enlaces
  (`?tipo=animal`, `?tipo=camada`), que funcionan sin JavaScript. Con `tipo`, el servidor monta
  `PublishFlow`, un componente cliente que tiene el formulario de la camada o el de un animal. «Publicala
  como un animal» (FR-012) no navega: `PublishFlow` cambia al formulario del animal con una semilla
  armada por `lib/litters/single-young-seed.ts` (lo propio primero, lo común de respaldo, las fotos
  ya preparadas y en espera) y reemplaza la URL por `?tipo=animal` con `history.replaceState`.
  `PetForm` acepta esa semilla como valores iniciales, fotos incluidas.
- **Rationale**: las fotos preparadas viven en memoria y en espera en el servidor; una navegación
  las perdería, y la spec dice «con lo que ya cargué».

## R10. Lo escrito sin publicar

- **Decision**: `useLitterDraft` con la misma mecánica que `usePetDraft` (clave por cuenta, sin
  fotos, se borra al publicar, al empezar de cero, al cerrar sesión y al borrar la cuenta), con una
  clave propia para no pisar el borrador de un animal (FR-017). Si `usePetDraft` se puede
  parametrizar por clave y forma sin ramas, se generaliza en `useFormDraft` y los dos lo usan; si
  no, se extrae lo común a `lib/pets/draft.ts`.

## R11. Medición

- **Decision**: `pet_publish_started`, `pet_published`, el abandono y `pet_edited` suman
  `litter: boolean` y, en camada, `young: number`. El `ordinal` de `pet_published` cuenta
  publicaciones: animales sueltos más camadas (`countMyPublications`), así una camada suma uno
  (FR-049). `pet_viewed` y los momentos de pedir (`apply_*`, `application_sent`) suman
  `litter: boolean`. La ficha de la camada emite `pet_viewed` con su origen como la de un animal.
- **Rationale**: docs/03 §Métricas de éxito (decisión 2026-10-20) y FR-048 a FR-050. Sin código de
  animal ni de persona, como el resto (#169).

## R12. Sin dependencias nuevas

Todo se construye con lo que ya está: Next 16, Supabase, next-intl, zod, `next/og`, Radix. No se
suma nada a `docs/07-stack.md`.
