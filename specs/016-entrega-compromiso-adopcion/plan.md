# Implementation Plan: Marcar a quién se entregó cada animal y aceptar entre los dos el compromiso de adopción

**Branch**: `feature/67-entrega-compromiso-adopcion` | **Date**: 2026-10-08 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/016-entrega-compromiso-adopcion/spec.md` (4 user stories). Decisiones técnicas
en [research.md](./research.md) (R1–R12); tabla y funciones en [data-model.md](./data-model.md);
rutas, acciones, correos y eventos en [contracts/routes.md](./contracts/routes.md).

## Summary

Hoy «Marcar adoptado» es un toque y todas las aceptadas siguen viendo el teléfono después. Al
terminar, marcar adoptado lleva a una pantalla que pregunta «¿A quién se lo diste?» entre las
aceptadas, o «por fuera del sitio»; al elegir a una persona, quien publicó lee y acepta el
compromiso en el mismo paso. Queda una **adopción**: la persona recibe un correo, ve el compromiso
en Mi solicitud y lo acepta o dice «Yo no adopté»; cuando las dos lo aceptaron, cada una recibe el
texto por correo. Solo el par sigue viendo el teléfono, hasta que el animal se vuelve a publicar,
la persona dice que no lo adoptó o un bloqueo o una suspensión lo cortan para siempre.

Cinco decisiones ordenan el plan:

1. **Una tabla `adoptions`** (R1), una fila por cada vez que se marca, con todas las fechas del
   compromiso; sin políticas, leída por funciones que miran quién pregunta (R2).
2. **Marcar adoptado es una sola función con candado** (R3) que elige, cierra y adopta en una
   transacción; `change_pet_status` deja de adoptar.
3. **El contacto del par se apaga con una marca que no vuelve** (R4): `contact_cut_at`, escrita por
   los disparadores de bloqueo y suspensión de #63.
4. **Los correos, por la bandeja de salida de #65** (R7), con tres tipos nuevos; el del compromiso
   lleva el texto entero.
5. **Lo que se ve, en funciones puras** (R9): las cláusulas, el estado de la adopción para cada
   lado y el renglón de Mis animales.

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router).

**Primary Dependencies**: las de `main`. **Ninguna nueva** (R12).

**Storage**: Postgres de Supabase (local). Una migración nueva (data-model.md).

**Testing**: Vitest (unidad y base local), Playwright (un flujo crítico), Stryker al 100 % sobre lo
que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: el presupuesto de docs/07. La pantalla nueva es un Server Component con una
hoja cliente (`HandoverForm`); Mi solicitud suma dos hojas cliente chicas (aceptar, «Yo no
adopté»); Mis animales, un diálogo para volver a publicar. Nada cambia en la ficha pública ni en el
listado.

**Constraints**: sin Vercel (todo local); nada se indexa (la ruta nueva es `noindex`); los correos
sin `RESEND_API_KEY` van a `.artifacts/mail/`.

**Scale/Scope**: 1 página nueva, 5 que cambian (Mis animales, el animal, Mi solicitud, Mis
solicitudes, Una solicitud para el publicador), 1 migración, 1 archivo de acciones nuevo y 1 que
cambia, ~9 componentes nuevos en `components/adoptions/`, 3 correos.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas ni rutas; el cómo está acá. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, en orden: P1 marcar adoptado eligiendo, P2 aceptar el compromiso y sus correos, P3 «Yo no adopté», P4 volver a publicar y el contacto cortado. |
| **III. Compuertas verdes** | `pnpm gates:affected` en cada ronda; `pnpm verify` al cerrar; qué se testea en §Qué se testea. |
| **IV. Reglas como código** | Quién se puede elegir, una vigente por animal, el doble toque, las transiciones del compromiso, el contacto del par y el corte son funciones y disparadores con tests de base; las cláusulas, el estado por lado, el renglón de Mis animales, la traducción de cada `outcome`, los eventos y los schemas son funciones puras con test. |
| **V. Datos personales** | Quién adoptó lo leen solo las dos personas (R2), y los tests lo intentan como otra solicitante, otra persona, quien administra y `anon`. El teléfono queda solo para el par y se apaga para siempre con el corte; lo prueban intentos después de terminar, deshacer, bloquear, suspender, desbloquear y reactivar. De una entrega por fuera no se guarda nada de la persona (check). Ningún correo ni evento lleva teléfono, correo, respuestas ni nombres en eventos. |
| **VI. Sin deriva** | Sin seguimiento, sin historial en el perfil, sin recordatorios, sin cambiar a quién se entregó, sin compromiso editable, sin avisos por WhatsApp ni panel. |
| **VII. Liviana y linda** | Server Components; hojas cliente chicas. Todo contra docs/10; ningún token nuevo. |
| **VIII. Autonomía con veto** | `aviso` en Ship: el contacto cortado congela el compromiso, el mismo texto para bloqueo y suspensión, `change_pet_status` deja de adoptar, el texto del compromiso es la primera versión. Nada reservado. |

**Sin violaciones**: Complexity Tracking vacío. Ningún cambio transversal de stack.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir este plan; Build lo vuelve a cargar antes del
primer JSX.

**La idea.** El cartel de «se busca hogar» se cierra cuando alguien se lleva al animal: la última
tirita arrancada es la de quien se lo llevó. «¿A quién se lo diste?» son **las tiritas que
quedaron en la mano**: las personas aceptadas, una por renglón, con la chapita al frente. El
compromiso es **la hoja que se firma de palabra**: un texto corto de tres o cuatro cláusulas, en la
columna de lectura, con los nombres escritos en el texto, sin firma dibujada ni sello de
escribanía (docs/06: no es un contrato). Lo que queda es **el talón**: en Mis animales, «Adoptado por
Ana» debajo del sello del animal, y la fecha en que cada una dijo que sí.

**Lo único que llama la atención**, por pantalla: en Marcar adoptado, «Acepto el compromiso y marco
adoptado a Ana» (`tirita`); en Mi solicitud con el compromiso pendiente, «Acepto el compromiso»
(`tirita`); con el compromiso aceptado o terminado, nada: el sello `primary` «Adoptaste».

### Tokens

Color: `--color-ink` (texto y botones), `--color-ink-muted` (fechas, ayudas, «Compromiso
pendiente de Ana» en Mis animales), `--color-line` (divisores entre personas y el borde de la hoja
del compromiso), `--color-surface` (la nota «No queda compromiso ni a quién se lo diste» de por
fuera y la del camino a Solicitudes), `--color-primary` / `--color-primary-soft` **solo** en lo que
es confianza: la chapita de cada persona, el sello «Adoptaste» y «Compromiso aceptado»;
`--color-warning` en «Compromiso pendiente» del lado de quien adoptó (le toca actuar);
`--color-accent` solo en `ErrorText`, `SaveFailedStrip` y el disparador «Yo no adopté a Tobi»
(`ghost-danger`). Sellos (`Stamp`): `primary` «Adoptaste», `muted` «Adopción terminada».
Tipografía: `.afiche` en el `h1`; el compromiso en `--text-base` con interlineado de lectura, cada
cláusula en su párrafo; fechas en `--text-sm`. Espacio: `--space-2` dentro de un renglón,
`--space-4` entre renglones, `--space-8` entre bloques. Movimiento: el de `Button`, `Dialog`,
`RadioGroup` y `Toast`; el compromiso entra con fade de `--dur-base` (`--ease-out`) al elegir a una
persona, nada con `prefers-reduced-motion`. **Ningún token nuevo, ni variante nueva de primitiva.**

### Marcar adoptado · `/mis-animales/{id}/adoptado` (nueva)

```
390 px, paso 1
┌──────────────────────────────────────┐
│ ← Tobi                     (TextLink)│
│ ¿A quién se lo diste?   (h1 afiche)  │
│ Elegí a quién le diste a Tobi. (sm)  │
│ ────────────────────────────────────── │
│ ( ) [avatar] Ana                     │ ← HandoverCandidate (RadioGroup `column`)
│     (chapita md) Nivel 1             │
│     Aceptaste su solicitud el 3 oct  │
│ ────────────────────────────────────── │
│ ( ) [avatar] Diego                   │
│ ────────────────────────────────────── │
│ ( ) Se lo di a alguien que no vino   │
│     por el sitio                     │
└──────────────────────────────────────┘

paso 2, eligió a Ana (debajo, en la misma pantalla)
│ El compromiso                (h2 lg) │
│ ┌──────────────────────────────────┐ │ ← CommitmentText (borde --color-line)
│ │ Ana se compromete a cuidar a     │ │
│ │ Tobi y llevarlo al veterinario…  │ │
│ │ A castrarlo.  (si corresponde)   │ │
│ │ A no venderlo, regalarlo ni…     │ │
│ │ Si no puede tenerlo más, a…      │ │
│ │ Vos te comprometés a recibirlo…  │ │
│ │ Es un acuerdo de palabra entre   │ │
│ │ ustedes dos, no un contrato. (sm)│ │
│ └──────────────────────────────────┘ │
│ [ ACEPTO EL COMPROMISO Y MARCO       │ ← tirita lg, ancho completo
│   ADOPTADO A ANA ]                   │
│ Cancelar                     (ghost) │

eligió por fuera
│ ┌ No queda compromiso ni a quién se ┐ │ ← FormNote --color-surface
│ │ lo diste.                         │ │
│ └───────────────────────────────────┘ │
│ [ Marcar adoptado ]       (secondary) │
│ Cancelar                     (ghost) │

vacío (sin aceptadas)
│ ( ) Se lo di a alguien que no vino…  │ (única opción)
│ ┌ Si se lo vas a dar a alguien que ┐ │ ← FormNote + TextLink «Ver las
│ │ te lo pidió acá, aceptá primero  │ │    solicitudes de Tobi»
│ │ su solicitud.                    │ │
│ └──────────────────────────────────┘ │
```

- `HandoverForm` (adoptions, hoja cliente): recibe el animal y las aceptadas por props. Estado:
  la opción elegida, `attemptId` por apertura. Sin elegir, no hay botón de confirmar (FR-001).
  Llama a `markPetAdopted`; mientras corre, el botón con su carga y el resto apagado; con error de
  red, `SaveFailedStrip` y reintentar con lo elegido; con `gone`/`you_blocked`/`revoked`,
  `ErrorText` arriba de la lista («Ana ya no sigue con esta solicitud.»), `router.refresh()` y la
  opción vuelve a «sin elegir». Al salir bien, `router.replace(returnTo)` con el aviso
  (`ScreenToast` de #59: «Tobi quedó adoptado por Ana»).
- `HandoverCandidate` (adoptions): un renglón del `RadioGroup` con `Avatar md`, el nombre,
  `VerificationBadge` `md` con el nivel y «Aceptaste su solicitud el 3 de octubre» en `--text-sm`.
- `CommitmentText` (adoptions): las cláusulas de `commitmentClauses` en párrafos de `--text-base`,
  con los tres nombres; la última, «acuerdo de palabra», en `--text-sm` `ink-muted`. Sin caja de
  color: un borde de 1 px `--color-line` y `--space-4` adentro. Lo usan la pantalla nueva, Mi
  solicitud y Una solicitud para el publicador.
- Cargando: el `h1` y tres renglones esqueleto con su forma. Error: `ErrorScreen` con «Reintentar»
  y «Ir a Mis animales». A 1280, la columna de lectura (`PageShell` `reading`).

### Mis animales y la pantalla del animal (cambian)

```
debajo de la card de un adoptado
│ [foto 4:5 ⟦ADOPTADO⟧]                │ ← PetCard / PetStatusStamp (#59)
│ Tobi                                 │
│ Adoptado por Ana            (sm ink) │ ← HandoverLine
│ Compromiso pendiente de Ana  (sm mut)│
│   ó  Compromiso aceptado el 9 de oct │
│   ó  Ana dijo que no lo adoptó       │
│   ó  Adoptado por fuera del sitio    │
```

- `HandoverLine` (adoptions): una o dos líneas en `--text-sm`, elegidas por `handoverLine`. Sin
  adopción registrada (anterior a esta historia o la persona borró su cuenta), nada.
- «Marcar adoptado» en `PetStatusActions` pasa a ser `LinkButton` a la ruta nueva (con `volver`),
  mismo lugar y mismo texto.
- `EndAdoptionDialog` (adoptions, hoja cliente): «Volver a publicar» de un adoptado con persona
  abre `Dialog` + `ConfirmBody`: «La adopción con Ana termina: ninguna de las dos va a ver más el
  teléfono de la otra.» con «Volver a publicar» / «Cancelar»; confirma con el flujo de siempre
  (`usePetStatus`). Sin persona, «Volver a publicar» corre directo, como hoy.
- `PetStatusActions` suma dos props opcionales, que la página arma desde `my_pet_adoptions`:
  `handoverHref` (la ruta nueva con `volver`) y `endsAdoption: { name } | null`; `MyPetActions` y
  `MyPetPanel` los pasan y dibujan `HandoverLine`. Las páginas siguen siendo las únicas que traen
  datos.

### Mi solicitud · `/mis-solicitudes/{id}` (cambia)

```
390 px, compromiso pendiente
│ [foto] Tobi ⟦ADOPTASTE⟧              │ ← ApplicationDetailHeader (de #63)
│ Adoptaste a Tobi           (h2 lg)   │ ← AdoptionPanel
│ Rocío te lo dio el 8 de octubre (sm) │
│ CommitmentText                       │
│ [ ACEPTO EL COMPROMISO ] (tirita lg) │ ← AcceptCommitmentButton
│ Yo no adopté a Tobi   (ghost-danger) │ ← DeclineAdoptionDialog
│ ContactReveal (de #65) con Rocío     │

aceptado
│ CommitmentText                       │
│ Rocío lo aceptó el 8 de octubre (sm) │ ← CommitmentDates
│ Vos lo aceptaste el 9 de octubre     │
│ ContactReveal                        │

terminada
│ ⟦ADOPCIÓN TERMINADA⟧                 │
│ La adopción de Tobi terminó. (base)  │
│ CommitmentText + CommitmentDates     │

contacto cortado
│ CommitmentText (+ fechas, si hay)    │
│ El contacto ya no está disponible.   │ ← ContactReveal `unavailable`
```

- `AdoptionPanel` (adoptions): recibe lo de `adoptionView` y los textos; dibuja el título, la
  línea de quien lo dio, `CommitmentText`, `CommitmentDates` y, si `canAccept`/`canDecline`, los
  dos disparadores. Sin lógica propia.
- `AcceptCommitmentButton` (adoptions, hoja cliente): `tirita` `lg`; mientras corre, su carga; si
  falla, `SaveFailedStrip` «No se pudo por la conexión. Tocá «Acepto el compromiso» de nuevo.» y
  sigue pendiente; al salir bien, `ScreenToast` «Aceptaste el compromiso» y `router.refresh()`.
- `DeclineAdoptionDialog` (adoptions, hoja cliente): disparador `ghost-danger`; sobre
  `DestructiveConfirmDialog` (el mismo de «Retirar solicitud»: no se deshace): «Rocío se va a
  enterar de que no adoptaste a Tobi. Tobi sigue adoptado.» con «Yo no lo adopté» / «Cancelar».
  Al salir bien, Mi solicitud con el aviso «Le avisamos a Rocío que no adoptaste a Tobi».
- `CommitmentDates` (adoptions): una línea por persona que aceptó, en `--text-sm`; pendiente,
  «Compromiso pendiente» en `--color-warning`.
- `ContactReveal` suma `unavailable`: «El contacto ya no está disponible.» en `--text-base`, sin
  número ni botón, sin fondo verde (no es confianza).
- `ApplicationStamp` suma `handed_over` (`primary` «Adoptaste») y `handed_over_ended` (`muted`
  «Adopción terminada»).

### Mis solicitudes (cambia)

`MyApplicationCard` con el sello nuevo y, con el compromiso pendiente, «Compromiso pendiente» en
`--text-sm` `--color-warning` debajo del nombre. Va con las cerradas (no cuenta entre activas).

### Una solicitud, para el publicador · `/solicitudes/{id}` (cambia)

- `HandoverSummary` (adoptions): «Se lo diste a Ana el 8 de octubre» en `--text-base`, el sello
  `primary` «Adoptado», `CommitmentText` y `CommitmentDates`; terminada, «La adopción terminó»;
  deshecha, «Ana dijo que no lo adoptó» sin el compromiso. `ContactReveal` según `adoptionView`.
- Las demás cerradas como «Tobi encontró hogar», ahora sin `ContactReveal`.

### Correos

La plantilla de `sendEmail` con su extra `image` (de #59) y el extra nuevo `lines` (párrafos
debajo del cuerpo, mismos estilos que el cuerpo). Nada de teléfono, correo ni respuestas.

### Copy y antipatrones

Voseo, verbos que dicen lo que pasa («Acepto el compromiso y marco adoptado a Ana», «Acepto el
compromiso», «Yo no lo adopté», «Volver a publicar»), el mismo verbo en el aviso. «Compromiso»,
nunca «contrato» ni «firma» (docs/06). Sin «¡Felicitaciones!» ni confeti: la adopción se cuenta
con el sello. Sin `·` entre datos: frases de `messages/`.

### Textos (`messages/es.json`)

`adoptions.handover.*` (pantalla nueva, opciones, errores), `adoptions.commitment.*` (cláusulas,
fechas, botones, errores), `adoptions.decline.*`, `adoptions.end.*` (la confirmación de volver a
publicar), `adoptions.line.*` (Mis animales y el publicador), `applications.status.handed_over*`,
`applications.contact.unavailable`, `emails.applications.{adoption_marked,commitment_accepted,
adoption_declined}.*`, `metadata.handover.*`.

## Qué se testea (y qué no)

**Base (`tests/db/`, contra Supabase local)** — lo que expone un dato o engaña:

- `adoptions-privacy.test.ts`: `adoption_of`, `my_pet_adoptions` y `handover_candidates` no
  devuelven nada a otra solicitante del mismo animal, a otra persona, a quien administra ni a
  `anon`; la tabla `adoptions` no se lee con ninguna sesión; quien dijo «Yo no adopté» deja de
  leer `adoption_of`; `application_contact`: lo lee el par después de marcar; no lo lee una
  aceptada no elegida, ni nadie con por fuera, ni el par después de terminar, de «Yo no adopté», de
  un bloqueo en cada dirección y de una suspensión de cada lado, **ni después de desbloquear o
  reactivar**; una entrega por fuera no guarda nada de la persona (el check rechaza el intento).
- `adoptions-rules.test.ts`: marcar exige una aceptada de ese animal y de ese publicador (rechaza
  `sent`, `rejected`, `withdrawn`, ajena; `gone` tras retiro, bloqueo de quien solicitó o
  suspensión; `you_blocked`; `revoked`); `change_pet_status('mark_adopted')` devuelve `changed`;
  mismo `attempt_id` dos veces → una fila y `already`; dos intentos distintos → el segundo
  `changed`; la elegida queda `handed_over` y fuera de las 3 activas, las otras `adopted`;
  `includes_neuter` = no castrado al marcar y no cambia al editar el animal; aceptar y «Yo no
  adopté» solo por quien adoptó, solo pendiente, solo vigente y sin corte, y no con la cuenta
  suspendida; dos veces → `already`; «Yo no adopté» pasa la solicitud a `adopted`; volver a
  publicar pone `ended_at` y una nueva adopción del mismo animal tiene su fila; borrar la cuenta de
  quien adoptó deja la fila sin persona; borrar el animal la borra; las fechas no vuelven atrás.
- `application-notices.test.ts` (suma): marcar a una persona escribe `adoption_marked` para ella y
  `closed_adopted` para las demás (no para ella); por fuera, solo `closed_adopted`; aceptar escribe
  dos `commitment_accepted` (una por persona) y una sola vez con doble toque; «Yo no adopté» escribe
  un `adoption_declined`; volver a publicar, bloquear y suspender no escriben nada.

**Unidad (Vitest, con mutación al 100 %)**: `commitmentClauses` (con y sin castración, orden),
`adoptionView` (cada estado por lado: pendiente, aceptado, deshecho, terminado, cortado; qué
acciones y si hay contacto), `handoverLine` (persona, por fuera, deshecha, sin persona, pendiente,
aceptado), `handoverOutcome` / `commitmentOutcome` (cada `outcome` a su clave; `already` es éxito),
`handoverSchema` / `commitmentActionSchema` (uuid, `applicationId` null solo para por fuera), los
eventos nuevos (sin ids ni textos; días y horas redondeados), `noticeEmail` con los tres `kind`
nuevos (destino por lado), `renderNoticeEmail` con `lines` (escapa el HTML).

**E2E (Playwright)**: `tests/e2e/handover.spec.ts` — con una aceptada sembrada: la publicadora toca
«Marcar adoptado», elige a la persona, ve el compromiso, confirma y ve «Adoptado por …»; la
adoptante abre Mi solicitud, ve el compromiso, lo acepta y ve las dos fechas; el correo del
compromiso aparece en `.artifacts/mail/` sin teléfono.

**Qué no**: las páginas, `ui/`, los componentes que solo pintan (`HandoverCandidate`,
`CommitmentText`, `CommitmentDates`, `HandoverLine`, `HandoverSummary`, `AdoptionPanel`), las
queries finas, la plantilla de cada correo y la función de la base que ya tiene test.

## Docs que cambian en este PR

- `docs/03-mvp-features.md`: las siete decisiones del enjambre de la historia, palabra por palabra
  (§5) — ya en esta rama desde la etapa Spec.
- `docs/06-i18n.md`: suma al glosario «adopción / entrega» (`adoption` / `handover`), «por fuera
  del sitio» (`outside`), «Yo no adopté» (`decline adoption`); tilda «compromiso de adopción» en
  §Qué se traduce.
- `docs/10-design-system.md` §Componentes: `HandoverForm`, `HandoverCandidate`, `CommitmentText`,
  `CommitmentDates`, `HandoverLine`, `HandoverSummary`, `AdoptionPanel`, `AcceptCommitmentButton`,
  `DeclineAdoptionDialog`, `EndAdoptionDialog`; `ContactReveal` con `unavailable`;
  `ApplicationStamp` con «Adoptaste» y «Adopción terminada».

## Project Structure

### Documentation (this feature)

```text
specs/016-entrega-compromiso-adopcion/
├── story.md
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/routes.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<ts>_adoptions.sql             nueva
supabase/seed.sql                                  una solicitud aceptada de una persona sembrada a un animal de otra
src/lib/supabase/types.ts                          regenerado (pnpm db:types)
src/lib/supabase/queries/adoptions.ts              nueva: handoverPet, handoverCandidates, myPetAdoptions, adoptionOf,
                                                   markPetAdopted, acceptCommitment, declineAdoption, commitmentForEmail
src/lib/supabase/queries/applications.ts           cambia: `adoption` en my_applications / my_application
src/lib/supabase/queries/application-responses.ts  cambia: `handed_over` en publisher_application
src/lib/adoptions/                                 commitment.ts, adoption-view.ts, handover-line.ts, outcomes.ts,
                                                   paths.ts, types.ts (+ tests)
src/lib/schemas/adoption.ts (+ test)               nueva
src/lib/analytics/adoption-events.ts (+ test)      nueva · events.ts cambia
src/lib/applications/notices.ts (+ test)           cambia: tres kind nuevos
src/lib/email/send-application-notice.ts           cambia: deriva commitment_accepted
src/lib/email/send-commitment-email.ts             nueva
src/lib/email/notice-email-template.ts (+ test)    cambia: extra `lines`
src/actions/adoptions.ts                           nueva
src/actions/pet-status.ts                          cambia: adoption_ended al volver a publicar
src/components/adoptions/                          handover-form.tsx, handover-candidate.tsx, commitment-text.tsx,
                                                   commitment-dates.tsx, handover-line.tsx, handover-summary.tsx,
                                                   adoption-panel.tsx, accept-commitment-button.tsx,
                                                   decline-adoption-dialog.tsx, end-adoption-dialog.tsx
src/components/applications/                       contact-reveal.tsx, application-stamp.tsx, my-application-card.tsx cambian
src/components/pets/                               pet-status-actions.tsx, my-pet-actions.tsx, my-pet-panel.tsx cambian
src/app/[locale]/(app)/mis-animales/[id]/adoptado/ page.tsx, loading.tsx, error.tsx (nuevas)
src/app/[locale]/(app)/mis-animales/page.tsx · [id]/page.tsx     cambian
src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx · page.tsx   cambian
src/app/[locale]/(app)/solicitudes/[id]/page.tsx                  cambia
messages/es.json                                   adoptions.*, applications.*, emails.applications.*, metadata
tests/db/adoptions-privacy.test.ts · adoptions-rules.test.ts      nuevos; application-notices.test.ts cambia
tests/e2e/handover.spec.ts                         nuevo
```

## Complexity Tracking

Vacío.

## Para Ship

- `aviso`: el contacto cortado congela el compromiso y usa el mismo texto para bloqueo y
  suspensión; `change_pet_status` deja de adoptar (todo pasa por `mark_pet_adopted`); el texto del
  compromiso es la primera versión, para mostrar a los rescatistas antes de la beta; los adoptados
  anteriores a la migración quedan sin a quién.
- Las siete decisiones del enjambre ya están en docs/03 en esta rama.
