# Research — Al borrar un animal que no se adoptó, decir por qué

Decisiones de diseño de la historia #263. Cada una dice qué se eligió, por qué y qué se descartó.
El código existente que se reusa está nombrado con su ruta.

## R1. Qué se guarda y dónde

**Decisión**: una tabla nueva, `public.deletion_reasons (id, kind, reason, deleted_on)`, con RLS
encendida, **sin políticas** y con `revoke all ... from anon, authenticated`, como las de #71 y #234
(`20261010120000_surveys_feedback.sql`, `20261028120000_verification_exits.sql`). `kind` es `pet` o
`litter`; `reason` es una de las cinco opciones o `unanswered`; `deleted_on` es el día de Uruguay
(`public.uruguay_today()`). Sin persona, sin animal, sin hora.

**Por qué**: es exactamente lo que la historia promete guardar (FR-024, Ley 18.331). Sin FK a nada,
borrar una cuenta no la toca (FR-023, SC-004). Todas las cuentas de Encuestas salen de esta tabla: una
fila es un borrado con pregunta, y «sin contestar» es una fila más, así que no hace falta una tabla
de cuentas aparte como en #234 (allá la pregunta se hacía sin respuesta; acá cada fila nace con el
borrado).

**Descartado**: guardar la respuesta en el momento `pet_deleted` de PostHog solamente. Quien
administra la tiene que leer en el sitio (decisión 2026-10-29, docs/03 §Métricas de éxito), y PostHog
no se lee desde Encuestas. Reusar `verification_exit_answers` con un nivel nuevo: mezclaría dos
preguntas con reglas y opciones distintas y obligaría a cambiar los `check` de #234 (la historia
dice que la pregunta de #234 no cambia).

## R2. Exactamente una respuesta por borrado hecho (FR-010 a FR-012)

**Decisión**: la respuesta se inserta **dentro de las funciones que ya borran**, `public.delete_pet`
y `public.delete_litter`, en la misma transacción que el `delete`. Las dos suman un parámetro
`p_reason text default null`:

- `null`: la confirmación no mostró la pregunta; no se cuenta nada.
- una opción o `unanswered`: la confirmación la mostró. Se inserta una fila **solo si** el borrado se
  hizo (`outcome = 'done'`) **y** el estado leído con `for update` antes de borrar era uno con
  pregunta (R3). Devuelven una columna nueva, `reason_counted boolean`.

**Por qué**: una sola transacción hace imposible contar sin borrar o borrar sin contar. El doble
toque y el reintento ya terminan en `not_found` la segunda vez (el animal no existe y
`usePetDeletion` lo da por borrado), y `not_found` no inserta: queda una sola fila sin ticket ni
clave de idempotencia. El estado de otra pestaña se lee con el mismo `for update` que ya toma el
borrado, así que el adoptado o dado de baja a último momento no cuenta (FR-012).

**Descartado**: una acción aparte `answerDeletionReason` después del borrado: un corte entre las dos
deja un borrado sin contar, o una respuesta contada dos veces si se reintenta. Un ticket como el de
#234 (R3 de esa historia): acá no hace falta, porque la respuesta no sobrevive al borrado.

## R3. Cuándo corresponde la pregunta (FR-001 a FR-003)

**Decisión**: la misma regla en dos lugares, con prueba que los compara:

- En el código, `src/lib/pets/deletion-reason.ts`: `petAsksDeletionReason(state: PetState)` es
  verdadero para `available`, `in_process`, `paused` y `expired`;
  `litterAsksDeletionReason(state: LitterState)` es verdadero para todo menos `adopted` y
  `taken_down`. `litterStateOf` ya da `adopted` cuando todas las crías lo están
  (`src/lib/litters/lifecycle.ts`), así que «al menos una cría sin adoptar» y «no dada de baja» son
  exactamente esos dos estados.
- En la base, dentro de `delete_pet` con `private.pet_state(...)` y dentro de `delete_litter` con
  `private.litter_state(...)`, antes del `delete`.

La pantalla usa la del código para decidir si la confirmación muestra la pregunta (con el estado que
ya tiene la card o el panel). La base decide si cuenta, con el estado de ese momento.

**Por qué**: la pantalla tiene que saber antes de abrir si pregunta; la base es la que sabe el estado
real al borrar (otra pestaña). Una regla en las dos, comparadas por una prueba de `tests/db` sobre
cada estado, como la lista de opciones de #234.

**Descartado**: que la pantalla pregunte siempre y la base filtre: mostraría la pregunta en un
adoptado, que la historia excluye.

## R4. La pregunta dentro de la confirmación

**Decisión**: `DestructiveConfirmDialog` (`src/components/ui/destructive-confirm-dialog.tsx`) suma
un `children` opcional que va entre el cuerpo y el error/los botones, y una función `onConfirm` que
ya existe. `DeletePetDialog` y `DeleteLitterDialog` reciben `reason: DeletionReasonTexts | null`
(null cuando no corresponde) y, con texto, ponen adentro `DeletionReasonField`: un `RadioGroup`
`column` con la pregunta como `legend` y una línea corta que dice que es opcional. Lo elegido vive en
un `useState` del diálogo, que se limpia al cerrarlo (FR-014). Al confirmar, el hook manda
`reason: selected ?? 'unanswered'`.

**Por qué**: es la confirmación de hoy, con un bloque más; no suma toques (FR-009) y reusa el error
de adentro sin cerrar (FR-013). `RadioGroup` ya es la primitiva de opción única con casillas de 44
px en columna para opciones largas (los motivos de `ReportSheet`).

**Descartado**: una `Sheet` aparte o un paso después de confirmar: suma un toque y otra hoja (la
historia lo pide en la misma confirmación). Botones sueltos como en #234: allá cada toque mandaba y
salía; acá elegir no hace nada hasta «Borrar para siempre», y eso es un grupo de radios.

## R5. Dejar sin elegir tocando otra vez (FR-008)

**Decisión**: `RadioGroup` suma la prop `clearable`. Con ella, un `click` sobre el radio que ya está
elegido llama `onChange('')`. El `click` lo disparan el toque, el mouse y la barra espaciadora sobre
el radio con foco, así que el teclado también deja sin elegir. Las flechas siguen eligiendo como
siempre.

**Por qué**: un radio nativo no se puede destildar, y la historia lo pide. Con la prop la primitiva
sigue sin dominio y el resto de los `RadioGroup` no cambia. La fila de docs/10 suma la variante con
su decisión.

**Descartado**: una sexta opción «Prefiero no decir» elegida por defecto: la historia dice que
ninguna viene elegida y son cinco. Un botón «Borrar mi respuesta»: es un toque más y un texto más.

## R6. La confirmación entra en el teléfono (FR-015)

**Decisión**: el `Dialog` (`src/components/ui/dialog.tsx`) limita su alto a la pantalla menos dos
gutters (`max-h-[calc(100dvh-var(--spacing-gutter)*2)]`) y deja correr su contenido
(`overflow-y-auto`) en la nota con cinta. Con la pregunta, en 390 × 844 entra todo sin correr; en un
teléfono más bajo, la lista corre dentro de la nota y los botones se alcanzan al terminar la lista.

**Por qué**: hoy ningún `Dialog` pasa del alto de un teléfono, así que ninguno cambia; este es el
primero que puede. La historia pide que los botones sigan a la vista al terminar la lista.

**Descartado**: cambiar a `Sheet` en el teléfono: docs/10 reserva `Dialog` para lo irreversible, y
cambiar de hoja según el ancho es otra confirmación.

## R7. Medición (FR-028)

**Decisión**: un momento nuevo, `pet_deletion_reason`, con `{ kind: 'pet' | 'litter'; reason:
DeletionReason | 'unanswered' }`, que la acción manda solo cuando la base devolvió
`reason_counted = true`. Su armado en `src/lib/analytics/deletion-reason-events.ts`, con prueba.

**Por qué**: `pet_deleted` hoy existe solo para un animal (`deleteLitter` no lo manda) y lleva el
estado de antes; sumarle la opción lo haría decir dos cosas, y la camada quedaría afuera. Un momento
propio se lee solo, como `verification_exit_answered` en #234.

**Descartado**: mandar el día: PostHog ya tiene la hora del momento y no es de la persona.

## R8. Encuestas (FR-017 a FR-023)

**Decisión**: `public.admin_deletion_reason_summary()` devuelve siempre las doce combinaciones
`kind × reason` (dos clases × cinco opciones + sin contestar) con su `total`, vacío si quien llama no
administra (`private.is_admin()`). `deletionReasonSummary(rows)` en
`src/lib/surveys/deletion-summary.ts` arma: cuántos borrados con pregunta, cuántos contestados y sin
contestar, por clase y en total, y cada opción con su total y su número por clase. La sección
`_components/deletion-reasons.tsx` lo pinta con `SurveySummary` y `ExitOriginTable` (las columnas
son «Animales» y «Camadas» en lugar de los orígenes de #234).

**Por qué**: es lo que pide la historia, solo cuentas (FR-022, FR-026): sin días ni filas sueltas,
con 3 a 5 rescatistas un día junto a «camada» podría decir quién fue. Reusa los componentes de #234
sin crear ninguno.

**Descartado**: mostrar el día o una lista de respuestas: la historia no lo pide y achica el
anonimato. Un filtro por período: Encuestas no lo tiene para nada.

## R9. Textos

**Decisión**: namespace `pets.deletion_reason` en `messages/es.json`, con `title` (`{sex, select,
female {¿Por qué la borrás?} other {¿Por qué lo borrás?}}`), `hint`, y `options.*` (la tercera con
`select` por sexo). Una camada pasa `sex: 'female'`. Encuestas en `surveys.deletions.*`. La pregunta
y las opciones van palabra por palabra de la historia; `hint`, las cuentas y los vacíos se escriben
con `sin-slop`. Propuesta para `hint`: «Si querés contarnos. Se borra igual y no dice quién sos.»

**Por qué**: la concordancia con `select` es como el resto de `pets.status` (FR-007).

## R10. Qué se prueba y por qué (docs/09 §Qué vale la pena testear)

- **Unitarias con Stryker al 100 %**: `deletion-reason.ts` (qué estado pregunta, la lista de
  opciones y `deletionAnswerOf`), el schema de borrado con la opción (`src/lib/schemas/pet-status.ts`
  y el de camada), `deletion-summary.ts` (sumas, vacío, sin contestar, por clase) y el armado del
  momento. Si se rompen, cuentan mal o muestran una pregunta donde no va.
- **`tests/db`**: privacidad (visitante y persona no leen la tabla ni reciben nada de la función de
  quien administra; quien administra sí, solo cuentas); reglas (borrar en cada estado con y sin
  opción cuenta o no; `not_found` no cuenta; el estado cambiado antes de borrar no cuenta; opción
  inválida rechazada; borrar una cuenta no cambia las cuentas; la regla de la base coincide con la
  del código en cada estado).
- **e2e (uno)**: Carla borra una hembra disponible después de elegir, dejar sin elegir y volver a
  elegir una opción, y en un adoptado ve la confirmación sin pregunta. Lo que lee quien administra
  se prueba en `tests/db` y en las capturas: el e2e no suma una segunda sesión.
- **Nada** para `DeletionReasonField`, la sección de Encuestas ni las primitivas: solo pintan.
