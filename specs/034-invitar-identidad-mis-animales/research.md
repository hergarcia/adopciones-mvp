# Research: la invitación a verificar la identidad en «Mis animales»

Historia #281 · spec: [spec.md](./spec.md) · fecha: 2026-11-02

Todo lo que la invitación necesita ya existe en `main` salvo el «Ahora no» guardado. Cada decisión
reusa la pieza que ya resuelve lo mismo en otra pantalla.

## R1. Dónde se guarda «Ahora no»

**Decisión:** tabla nueva `public.identity_invite_dismissals` con una fila por persona:
`person_id uuid primary key references auth.users (id) on delete cascade` y
`dismissed_on date not null`, el día de Uruguay. RLS prendida y `revoke all` a `anon` y
`authenticated`: nadie la lee ni la escribe directo. Dos funciones `security definer` con
`search_path = ''`, ejecutables solo por `authenticated`:

- `public.dismiss_identity_invite() returns text`: inserta la fila de `auth.uid()` con
  `on conflict do nothing`; devuelve `dismissed` si insertó y `already` si ya estaba. Sin sesión,
  `not_signed_in`.
- `public.identity_invite_dismissed() returns boolean`: si existe la fila de `auth.uid()`.

**Por qué:** es el patrón de `verification_exit_asks` (#234): una marca por persona que solo usa el
sitio, sin políticas y leída por funciones. La clave primaria deja un solo día aunque se toque dos
veces o en dos pestañas (FR-017), y el primer día queda. `on delete cascade` sobre `auth.users` la
borra con la cuenta (FR-022), como las marcas de #234. Ninguna función de quien administra la lee
(FR-021).

**Descartado:** una columna en `profiles` (la leería cualquier función que ya lee el perfil, y el
perfil tiene políticas de lectura para su dueña que habría que recortar); guardarlo en el navegador
(no sobrevive a otro teléfono y la historia dice «para siempre para esa persona»); un `timestamptz`
(la historia pide solo el día).

## R2. Cuándo se muestra: una función pura

**Decisión:** `src/lib/verification/identity-invite.ts` con

```ts
identityInviteShown(input: {
  publications: number
  phone: PhoneStatus
  identity: IdentityStatus
  dismissed: boolean
}): boolean
```

que devuelve `true` solo con `publications > 0`, `isLevelOne(phone)`, `canRequest(identity)` y
`!dismissed`. `canRequest` ya existe (`identity-status.ts`) y es exactamente «no tiene la identidad,
no tiene un pedido en revisión y no está en el tope»: `none` (también retirado, que no deja
registro), `rejected` y `expired`; `in_review`, `approved` y `capped` quedan afuera (FR-001, FR-005).
El tope termina solo: `identityStatus` deja de devolver `capped` cuando el tercer rechazo sale de la
ventana de 30 días.

**Por qué:** la regla de negocio en una función pura con prueba y Stryker al 100 %, como
`canRequest` y `isLevelOne`. La página solo junta los datos.

## R3. Qué animal nombra

**Decisión:** en el mismo archivo,
`inviteSubject(pets: PetSummary[], litters: MyLitter[]): string | null` devuelve el nombre de la
única publicación cuando hay exactamente una y se ve en el listado: un animal con `state`
`available` o `in_process`, o una camada con `state` `available`. En cualquier otro caso `null`, y
el texto habla de «lo que publicás» (FR-007).

**Por qué:** el listado muestra animales disponibles y en proceso, y camadas con crías que se
pueden pedir (`listed_publisher_level`, `p.status in ('available', 'in_process')`). Nombrar a uno
que no está ahí diría que algo va a cambiar en el listado donde no aparece.

## R4. El origen del pedido de verificación

**Decisión:** el origen `my_pets` en `identity_requests.origin`, al lado de `profile`:

- la migración amplía `identity_requests_origin_valid` a `('profile', 'my_pets')` y
  `identity_expirations_notice_origin` no necesita cambio (no restringe valores);
- `IDENTITY_ORIGINS = ['profile', 'my_pets']` en `src/lib/verification/identity.ts`. El tipo
  `Origin` de `events.ts` sale de ahí, así que `identity_request_started`, `_consent_accepted`,
  `_sent`, `_withdrawn`, `_expired`, `_approved`, `_rejected` y `identity_cap_reached` ya lo llevan
  sin tocar cada llamada (FR-026);
- la marca `invitacion=1` en la dirección de la verificación (`INVITE_FLAG` en
  `src/lib/verification/paths.ts`, `identityFromInvitePath = /verificar-identidad?pedir=1&invitacion=1`).
  La página de verificar elige `origin = 'my_pets'` cuando viene la marca y no hay solicitud ni
  animal; si no, `profile` como hoy.

**Por qué:** la cadena ya existe de punta a punta: el formulario manda `origin`, el schema lo valida
contra `IDENTITY_ORIGINS`, `submit_identity_request` lo guarda, y retirar, vencer y resolver lo
devuelven (`request_origin`, `notice_origin`). Solo falta el valor. El nombre es un lugar, como
`profile`; las claves de la base van en inglés (CLAUDE.md §3).

**Precedencia:** solicitud (#257) > animal (#63) > invitación > Mi perfil. La invitación nunca trae
solicitud ni animal; la precedencia evita que una dirección armada a mano mezcle dos.

**Descartado:** derivar el origen del `Referer` (no llega siempre y no sobrevive a la puerta del
teléfono); una cookie (estado invisible que dura más que el pedido).

## R5. Las vueltas de la verificación

**Decisión:** `identityRoutes(applicationId, returnCode, invited)` suma el caso de la invitación:
`newPath` = `identityFromInvitePath`, `leavePath` = `/mis-animales` y `sentPath` `undefined` (al
mandar, la pantalla de estado en revisión de siempre, FR-013). `exitDestination('identity', place)`
devuelve `/mis-animales` cuando `place.invited`, así «Ahora no» y la pregunta de por qué se va
vuelven ahí (FR-013). La puerta del teléfono conserva `newPath` con la marca, como ya conserva la
solicitud y el animal.

**Por qué:** es lo que hizo #257 con la solicitud. «Al mandar» no cambia: la historia pide «los
mismos pasos que desde Mi perfil».

## R6. El origen de la pregunta de por qué se va

**Decisión:** el origen `invited` en `EXIT_ORIGINS` (`exit-question.ts`). `ExitPlace` suma
`invited: boolean`, que `exitPlaceOf` lee de la consulta de la pantalla (`invitacion=1`), como ya lee
`animal` y `solicitud`. `exitOrigin('identity', place)` devuelve `asked` si hay solicitud,
`invited` si hay marca, `apply` si hay animal y `self` si no. En la base: los tres `check` de
origen (`verification_exit_tickets`, `_answers`, `_counts`), la lista de `ask_verification_exit`,
las filas `('phone', 'invited')` e `('identity', 'invited')` de `verification_exit_counts`, y
`admin_verification_exit_summary` redefinida con el orden completo
`array['publish', 'apply', 'self', 'asked', 'invited']` (hoy `asked` cae al final por `null`, y con
dos valores sin lugar el orden quedaría librado a la base).

**Por qué `invited` y no `my_pets`:** los orígenes de la pregunta son motivos (publicar, solicitar,
por su cuenta, se la pidió alguien); el del pedido es un lugar (`profile`). La invitación es un
motivo nuevo: el sitio se la ofreció. Encuestas suma la columna sola porque `ExitOriginTable` y
`exitSummary` salen de `EXIT_ORIGINS`; el texto va en `surveys.exits.origins.invited`.

**Puerta del teléfono:** si entre que abrió «Mis animales» y el toque perdió el teléfono, la
pregunta del nivel teléfono cuenta `self`, como hoy cuenta cualquier puerta pedida desde la
identidad fuera de una ficha. Es un caso que la invitación ya filtra (exige nivel 1); no vale un
camino propio.

## R7. Los momentos nuevos

**Decisión:**

- **Invitación mostrada:** `identity_offer_viewed` con `origin: 'my_pets'`. Es el mismo momento que
  «Mi perfil» manda cuando dibuja la oferta de nivel 2 (`origin: 'profile'`), así se comparan las dos
  ofertas con la misma vara. Se manda en el servidor al dibujar la invitación, una vez por apertura
  (FR-025).
- **«Ahora no»:** `identity_invite_dismissed` con `origin: 'my_pets'`, nuevo en `EVENTS` y en
  `EventProps` (`Origin`). Lo manda la acción solo cuando la base devuelve `dismissed`: el segundo
  toque y el reintento no suman.
- **El pedido desde la invitación:** los momentos de siempre con `origin: 'my_pets'` (R4).

Ninguno lleva persona, animal ni camada: `Origin` es el único dato (FR-028). `track` ya no lanza ni
espera más de lo que espera hoy: si PostHog no responde, la pantalla y la acción terminan igual.

## R8. El correo de identidad aprobada

**Decisión:** `IdentityResult` aprobado suma `toMyPets: boolean`; `approveOrReject` en
`src/actions/review.ts` lo pone en `resolved.origin === 'my_pets'` (`resolve_identity_request` ya
devuelve el origen). `send-identity-result.ts` arma el segundo enlace con una función pura
`approvedSecondary(result, t)`, en su propio archivo `src/lib/email/identity-approved-link.ts`
(con su prueba al lado, Stryker mutaría todo `send-identity-result.ts`, y el envío no tiene prueba): el animal de #63 si hay, si no «Ver Mis animales» →
`/mis-animales` cuando `toMyPets`, si no nada (FR-019, FR-020). El texto nuevo es
`emails.identity_approved.my_pets_button`. Rechazo y vencimiento no cambian.

**Por qué:** el correo ya tiene el hueco del segundo enlace (`secondary`); sumar un caso es una línea
y una prueba.

## R9. La pantalla: composición y estados

**Decisión:** un componente de servidor de la ruta,
`src/app/[locale]/(app)/mis-animales/_components/identity-invite-slot.tsx`, recibe `phone`,
`pets` y `litters` ya traídos por la página, lee en paralelo `getMyIdentity()` e
`isIdentityInviteDismissed()`, decide con `identityInviteShown`, manda `identity_offer_viewed` y
arma `IdentityInvite` con sus textos. Cualquier falla de lectura (incluido `getMyIdentity()` nulo)
se trata como «no se sabe» y no dibuja nada (FR-004). La página lo pone debajo de la fila de
«Publicar un animal» y antes de `ProfileLinkLine`, solo en la rama con publicaciones.

- **Cargando:** la página no tiene `Suspense` interno: todo llega junto, así que la invitación está
  o no está desde el primer pintado (FR-010). `loading.tsx` no le reserva lugar, como a
  `ProfileLinkLine` (#238): reservarlo movería la pared de todos los que no la ven.
- **Vacío:** sin publicaciones la página dibuja `HeadedEmptyState` de hoy y el slot ni se monta.
- **Error:** si la lectura falla, nada; el resto de la página como hoy.

**Por qué:** la página ya pasa de ~50 líneas de JSX; la lectura y la decisión quedan en un
componente con nombre (CLAUDE.md §2), y los componentes de `components/verification` no hacen fetch.

## R10. «Ahora no» sin recargar

**Decisión:** `IdentityInvite` (servidor, `components/verification`) dibuja la nota y pone sus
acciones dentro de `IdentityInviteFrame` (cliente, la hoja más chica): guarda `dismissed` en estado,
y «Ahora no» es un `button` dentro de un `form` con `action={dismissIdentityInvite}`. Con
JavaScript, `onSubmit` pone `dismissed = true` en el acto, llama la acción dentro de una transición y
no mira el resultado: falle o no, la nota ya no está y no hay aviso (FR-015, FR-016). Sin
JavaScript, el `form` postea, la acción guarda y revalida `/mis-animales`, y la página vuelve sin la
nota. Al desaparecer, el foco pasa al título de la pantalla (`h1` con `tabIndex={-1}`, por id), así
un lector de pantalla no queda en un botón que ya no existe.

**Acción:** `dismissIdentityInvite(): Promise<ActionResult<null>>` en
`src/actions/identity-invite.ts`. Sin sesión, `ok: false` con `identity.invite.errors.session`; la
base falla, `ok: false` con `identity.invite.errors.failed` (las claves existen para el contrato de
`ActionResult`; la pantalla no las muestra, FR-016). `dismissed` manda el momento; `already`, no.

**Descartado:** `useOptimistic` (pensado para listas que vuelven del servidor; acá no hay nada que
reconciliar) y un `Sheet` de confirmación (la historia pide un toque y que se vaya).

## R11. Pruebas: qué y por qué

Se prueba lo que, si se rompe, engaña a una persona, expone un dato o calcula mal (CLAUDE.md
§Convenciones):

- **Unitarias con Stryker al 100 %:** `identityInviteShown` (cada condición sola la apaga; `rejected`,
  `expired` y `none` la dejan, `in_review`, `approved`, `capped` no; sin nivel 1 no; publicaciones 0
  no); `inviteSubject` (una disponible, una en proceso, una camada disponible nombran; dos, una
  adoptada, pausada, vencida o dada de baja, una camada adoptada no); `exitOrigin` y
  `exitDestination` con `invited` y su precedencia frente a `asked` y `apply`; `exitPlaceOf` con la
  marca; `identityRoutes` (en `identity-routes.ts` no hay prueba hoy porque es composición; la
  regla nueva vive en `exitDestination`, que sí la tiene); `approvedSecondary` (animal primero, Mis
  animales con `toMyPets`, nada sin ninguno).
- **`tests/db`** (`identity-invite-privacy.test.ts`, `identity-invite-rules.test.ts`): visitante
  anónimo, otra persona sembrada y quien administra no leen la tabla ni ven la marca de otro por
  `identity_invite_dismissed()`; tocar dos veces deja una fila con el primer día y devuelve
  `already`; borrar la cuenta borra la fila; `submit_identity_request` acepta `my_pets` y la base
  rechaza un origen desconocido; `ask_verification_exit('identity', 'invited')` cuenta en su fila y
  `admin_verification_exit_summary` la devuelve en su lugar.
- **e2e** (`tests/e2e/identidad-invitacion.spec.ts`): una persona sembrada de nivel 1 con un animal
  abre «Mis animales», ve la invitación, toca «Ahora no», recarga y no la ve; otra toca «Verificar
  mi identidad», llega a la verificación y «Ahora no» de la verificación la devuelve a «Mis
  animales» con la invitación. Es el flujo crítico de la historia; mandar las fotos ya lo cubre
  `identidad.spec.ts`.
- **Nada** para `IdentityInvite` ni `IdentityInviteFrame` (solo pintan y esconden), el slot
  (composición), las queries finas ni la página.
