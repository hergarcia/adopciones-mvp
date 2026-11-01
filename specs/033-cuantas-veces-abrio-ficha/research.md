# Research: cuántas veces se abrió la ficha, cuántos quisieron adoptar y a cuántos frenó la verificación

Historia #269 · spec: [spec.md](./spec.md). Cada decisión dice qué se eligió, por qué y qué se
descartó. Lo que está en `main` y se reusa se nombra con su archivo.

## R1. Dónde viven las cuentas: una fila por publicación, sin persona

**Decisión**: una tabla nueva, `public.publication_stats`, con una fila por animal publicado solo o
por camada: `pet_id` o `litter_id` (exactamente uno, cada uno `unique` y con `on delete cascade`),
`opens`, `taps`, `phone_stops`, `identity_stops` (enteros ≥ 0) y el inicio de la cuenta
(`counted_since date`, `from_publication boolean`). Las solicitudes no se copian: se cuentan de
`public.applications` al leer.

**Por qué**: es exactamente lo que la historia dice que se guarda (FR-026): cuatro números y un día
por publicación, sin quién, cuándo ni desde dónde. El `on delete cascade` desde `pets` y `litters`
cumple FR-028 sin código: borrar el animal, la camada o la cuenta (que ya borra sus publicaciones,
docs/03 §2) se lleva la fila.

**Descartado**:
- *Una fila por apertura o por toque con la hora*: permitiría números por día, que la historia saca
  del alcance, y guarda cuándo, que la historia prohíbe.
- *Leer los números de PostHog*: la medición va sin animal (docs/03 §7) y no se lee desde el sitio;
  agregarle el animal a los momentos rompe la decisión de #240 y la de esta historia.
- *Una columna en `pets` y otra en `litters`*: dos lugares para la misma regla, y `pets` se lee en
  el listado y la ficha públicos, donde estos números no pueden aparecer (FR-022, FR-025).

## R2. Desde cuándo: una marca al crear la fila, no `published_at`

**Decisión**: la fila nace con la publicación, por un disparador `after insert` en `pets` (solo con
`litter_id is null`) y otro en `litters`, con `counted_since = public.uruguay_today()` y
`from_publication = true`. La migración crea las filas de las publicaciones que ya existen con
`counted_since = public.uruguay_today()` y `from_publication = false`. El bloque dice «desde que
lo/la publicaste» con `from_publication` y «desde el <día>» sin él (FR-011, FR-012).

**Por qué**: `published_at` se mueve al renovar o volver a publicar (es el orden del listado), así
que compararlo con el día de la historia daría «desde el <día>» a un animal publicado después.
Renovar y volver a publicar no tocan la fila (FR-013). Una cría se inserta con `litter_id` y no
tiene fila: suma en su camada (FR-008).

**Descartado**: *crear la fila con la primera apertura*: no sabría si la publicación es anterior a
la historia.

## R3. Quién suma: solo el servidor, después de responder

**Decisión**: tres funciones `security definer` con `search_path = ''`, con `execute` solo para
`service_role` (revocado de `public`, `anon` y `authenticated`):
- `count_pet_open(p_code text, p_viewer uuid)` y `count_litter_open(p_code text, p_viewer uuid)`:
  suman una apertura si la publicación existe, no es una cría y `p_viewer` no es quien la publicó.
- `count_apply_tap(p_code text, p_viewer uuid, p_tap boolean, p_stop text)`: busca el animal por su
  código; si es una cría, suma en su camada; si `p_viewer` es quien publicó, no suma nada. `p_stop`
  es `phone`, `identity` o nulo.

Las llaman, con el cliente de servicio, funciones de `lib/supabase/queries/publication-stats.ts`
que **nunca lanzan** (como `getPetPublisherLevel` en `measured-levels.ts`), y las páginas las
programan con `deliver` (`lib/delivery/deliver.ts`, que usa `after` de `next/server` y corta a los
3 s): la ficha y la redirección salen sin esperar la cuenta (FR-009, SC-004).

**Por qué**: si `anon` pudiera ejecutar la función, cualquiera inflaría los números de cualquier
animal con un bucle contra la base, sin cargar ninguna ficha (FR-027). La sumatoria `set opens =
opens + 1` es una sola sentencia con el candado de la fila: dos al mismo tiempo suman las dos
(FR-010). Excluir a quien publicó en la base, además del código, cubre la ficha propia oculta y el
toque por una dirección armada a mano, y se prueba en `tests/db`.

**Descartado**: *esperar la cuenta antes de responder*: un segundo de base lenta demoraría la
ficha que llega desde el grupo, y un error rompería «Quiero adoptar».

## R4. Qué es una apertura en el código

**Decisión**: una regla pura `shouldCountOpen({ kind, isOwner, userAgent })` en
`lib/pet-stats/count-rules.ts`: cuenta cuando la página llegó a un estado de una publicación que
existe (`listed`, `paused`, `expired`, `unavailable`, `blocked`), no es `missing` ni `young`
(`own_hidden` y `own_listed` son de quien publicó y no cuentan) (la cría redirige a su camada, que cuenta la suya, FR-003), quien mira no es
quien publicó y `isLinkPreview(userAgent)` (`lib/analytics/link-preview.ts`, la misma lista que ya
saca a las vistas previas y a Googlebot de la medición) da falso (FR-002). La ficha de un animal y
la de una camada la llaman en el mismo lugar donde hoy arman `pet_viewed`, antes de elegir la
pantalla.

**Prefetch**: el `pet_viewed` de hoy ya no se dispara con el prefetch de las tarjetas del listado
(research de #57: el prefetch de una ruta dinámica se detiene antes de dibujar la página). La cuenta
va en el mismo lugar, así que hereda lo mismo; el e2e lo comprueba (pasar por la tarjeta y volver no
suma) y, si fallara, los enlaces a fichas pasan a `prefetch={false}`.

**Descartado**: *usar `petViewEvent`*: hoy solo devuelve un evento para `listed`; la historia pide
también pausada, vencida y adoptada, y cambiar el evento cambiaría la lectura 5 (FR-030).

## R5. Qué es un toque y un freno en el código: los mismos de #240

**Decisión**: en `solicitar/[code]/page.tsx`, la lista que ya devuelve `tapEvents`
(`lib/analytics/apply-tap.ts`) se traduce con una regla pura `applyCountOf(events)` a
`{ tap: boolean; stop: 'phone' | 'identity' | null }`: `tap` si viene `apply_tapped`, `stop` si
viene `apply_stopped` con `by` `phone` o `identity`; `limit` y `not_receiving` no suman freno
(FR-006). Si no hay nada que sumar, no se llama a la base. Va con `p_viewer` = la sesión, o nulo
sin sesión.

**Por qué**: la historia dice «con la misma regla que ya usa la medición» y #240 ya resolvió las
vueltas (entrar, verificar el teléfono, el correo de la identidad aprobada, recargar). Derivar las
cuentas de los mismos eventos hace imposible que la medición y el bloque cuenten distinto.

## R6. Quién lee: una función que pregunta si es suyo

**Decisión**: `my_publication_stats(p_pet uuid, p_litter uuid)` `security definer`, `execute` para
`authenticated`, que devuelve una fila solo si `auth.uid()` es quien publicó: los cuatro números,
`applications` (contadas de `public.applications` por `pet_id`, o por las crías con ese
`litter_id`, sin filtrar estado), `counted_since`, `from_publication` y `required_level`. La tabla
tiene RLS prendido y ninguna política; `revoke all` para `anon` y `authenticated`.

**Por qué**: FR-025 deja afuera también a quien administra. Una política de `select` por dueño
alcanzaría, pero el conteo de solicitudes cruza `applications`, cuyas políticas dejan leer a cada
lado lo suyo; una función con la regla escrita una vez es más fácil de probar con el arnés de
privacidad. Devuelve también el nivel que pide, así el bloque no depende de otra lectura.

**Solicitudes de alguien que borró su cuenta**: `applications.applicant_id` es `on delete cascade`,
así que dejan de contarse (spec §Assumptions). Una cría quitada pierde su `litter_id` con ella: sus
solicitudes quedan con `pet_id` nulo y dejan de contarse en la camada.

## R7. Cargando, vacío y error sin trabar la página

**Decisión**: la página de «Mis animales» dibuja el bloque dentro de un `Suspense` con
`PetStatsSkeleton` como respaldo (FR-018). Adentro, un Server Component llama a la acción
`readPetStats({ kind, id })` (`src/actions/pet-stats.ts`), que devuelve `ActionResult<PetStatsView>`
y nunca lanza; su resultado va a `PetStatsLive`, la hoja cliente más chica, que dibuja
`PetStatsBlock` con la vista o el error con «Probar de nuevo». «Probar de nuevo» llama a la misma
acción y reemplaza solo el bloque (FR-019); si vuelve a fallar, queda el mismo aviso.

**Por qué**: un `error.tsx` reemplazaría la página entera, y la historia pide que editar, pausar y
compartir sigan andando. `router.refresh()` volvería a pedir toda la página. Una sola acción sirve
a la carga y al reintento, así la regla del vacío y los textos se arman en un solo lugar.

**El vacío con la acción de copiar**: cuando la vista es vacía, la acción arma el texto para el
grupo con `petGroupPost` o `litterGroupPost` (`components/pets/group-post-texts.ts`, #248), sobre
`getPublicPet` o `getLitterByCode` del propio dueño; si hoy no se ofrece (pausada, adoptada, dada
de baja…), devuelven `null` y el vacío queda con la frase sola. `GroupPostButton` es el de hoy.

## R8. Dónde va el bloque: debajo de las acciones, y en el riel desde 1024

**Decisión**: `PetWorkLayout` (`photo="small"`) suma dos lugares opcionales, `aside` y `rest`, sin
cambiar a quien no los pasa (`PetReviewItem`). En el teléfono el orden del DOM y de lectura es: el
nombre y la foto chica, las acciones (`children`), el bloque (`aside`) y lo demás (`rest`: el
seguimiento en un animal, las crías en una camada). Desde 1024 la grilla pasa a tres filas
(`auto auto 1fr`): la foto ocupa las dos primeras de la columna angosta y el bloque la tercera,
debajo de la foto; el nombre, las acciones y lo demás siguen en la columna ancha.

**Por qué**: la historia pide «en el teléfono debajo de las acciones» y «en pantalla ancha, al
costado de la ficha, sin dejar un costado vacío». Debajo de la foto del riel hoy queda una columna
de 256 px vacía a lo largo de toda la página; el bloque la usa, y las acciones no se angostan. Una
tercera columna a la derecha angostaría las acciones y las filas de las crías.

**Descartado**: *dibujar el bloque dos veces y esconder uno por ancho*: docs/10 no deja contenido
que exista en un ancho y no en otro, y pediría los números dos veces.

## R9. Textos

**Decisión**: namespace `pets.stats` en `messages/es.json`, con ICU para el plural y el género:
el título «Cómo le va a {name}», «desde que {sex, select, female {la} other {lo}} publicaste» (una
camada usa `female`), «desde el {day}», cada renglón con su número, «Pedís el teléfono verificado»,
«Pedís la identidad verificada», el vacío «Todavía nadie abrió la ficha de {name}», el error y
«Probar de nuevo». Se escriben y se revisan con el skill `sin-slop`. Los cuatro textos que trae la
historia van palabra por palabra.

## R10. Qué se prueba y por qué

Según docs/09 §Qué vale la pena testear: lo que, si se rompe, engaña a quien publicó o expone un
dato.

- **Unitarias con Stryker al 100 %**: `shouldCountOpen` (cada estado, dueño, cada agente de la
  lista, agente nulo); `applyCountOf` (toque solo, cada freno, `limit` y `not_receiving` sin freno,
  lista vacía); `statsView` (el vacío solo con todo en cero, el renglón de identidad con nivel 2 o
  con frenos ya contados, «desde que» contra «desde el», el género); `petStatsRequestSchema` (tipo
  y uuid).
- **`tests/db` (privacidad)**: visitante, otra persona y quien administra no leen la fila ni la
  función les devuelve nada; ninguno de los tres puede ejecutar las funciones de sumar; la tabla no
  se lee directo con ninguna sesión.
- **`tests/db` (reglas)**: abrir suma y el dueño no suma; una cría suma en su camada; un código que
  no existe no suma; un toque con cada freno; las solicitudes retiradas y cerradas cuentan; la de
  quien borró su cuenta no; borrar el animal, la camada o la cuenta se lleva la fila; la fila de
  una publicación nueva viene con `from_publication`; 20 sumas en paralelo suman 20. Las filas que
  crea la migración para lo que ya existía no se prueban en `tests/db`: después de `db reset` no hay
  nada anterior (la semilla corre después); se revisan leyendo la migración.
- **e2e (uno)**: una persona sin sesión abre la ficha dos veces; una persona sin teléfono toca
  «Quiero adoptar» y la frena el teléfono; pasar por la tarjeta del listado no suma; quien publicó
  abre su ficha y después la página del animal en «Mis animales» y ve 2, 1, 1 freno por el teléfono
  y 0 solicitudes, con «Pedís el teléfono verificado».
- **No se prueba**: que el bloque se dibuje (solo pinta lo que dice `statsView`), la query fina, el
  esqueleto.
