# Research: Los animales en adopción de cada rescatista en su perfil

Decisiones técnicas de `plan.md`, cada una con su alternativa descartada. Contexto leído: el perfil
público (`src/app/[locale]/(public)/perfil/[id]/page.tsx`), el listado (`listed_pets` en
`supabase/migrations/20261026120000_litter_lifecycle.sql`, `src/lib/supabase/queries/listed-pets.ts`,
`src/app/api/animales/route.ts`, `ListingController`), «Mis animales»
(`src/app/[locale]/(app)/mis-animales/page.tsx`), `CopyProfileLink` y la medición
(`src/lib/analytics/events.ts`, `visit-origin.ts`, `view-origin.ts`).

## R1. Las mismas reglas que el listado: un filtro de dueña dentro de `listed_pets`

**Decisión**: una migración nueva reemplaza `public.listed_pets` por la misma función con un
parámetro más al final, `p_owner_public_id text default null`. Con un valor, la consulta se queda con
las filas cuyo `owner_id` es el de `profiles.public_id = p_owner_public_id`; sin él, es el listado de
siempre. El cuerpo es el de `20261026120000_litter_lifecycle.sql` sin otro cambio: `pet_is_listed`
(teléfono de hoy y cuenta sin suspender), `litter_is_shown` y `litter_state = 'available'`, estados
disponible y en proceso, sin vencer ni dar de baja, el bloqueo de quien mira hacia quien publicó, y
el orden `published_at desc, code desc` con el cursor. Como cambia la firma, la migración hace
`drop function` de la firma vieja y `create function` de la nueva, con sus `revoke` y `grant` a
`anon, authenticated`, y `pnpm db:types` regenera los tipos.

**Por qué**: FR-002 pide que lo que muestra el perfil sea exactamente lo del listado. Con una sola
función, una regla que cambie mañana (por ejemplo, una camada con otro estado) cambia en los dos
lugares a la vez, y el test que compara los dos (R9) no puede quedar desparejo. Un id que no existe
da cero filas, igual que una persona sin animales a la vista.

**Alternativas**: una función nueva `profile_pets` con el cuerpo copiado (dos copias de la regla que
se separan con la próxima migración, que es justo lo que la decisión del enjambre quiere evitar);
filtrar por dueña en TypeScript sobre el listado entero (trae animales de otros y no escala); pasar
el `owner_id` en vez del `public_id` (el `id` de la cuenta nunca sale del servidor hacia el cliente,
y la ruta de tandas lo recibiría desde la dirección).

## R2. La consulta del perfil: `listProfilePets`

**Decisión**: `src/lib/supabase/queries/listed-pets.ts` suma `listProfilePets(publicId, cursor,
limit)`, que llama a `listed_pets` con `p_owner_public_id` y los filtros vacíos, y reutiliza el
armado de filas de `listListedPets` (se extrae a una función interna `listedPetsOf(rows, now)` para
no repetirlo). Devuelve el mismo `ListingPage`. `src/app/[locale]/_components/listing-view.ts` suma
`profilePetsView(publicId, cursor, shown)`, el gemelo de `listingView`: pide una de más, arma las
tarjetas con `listedCardViews` y el cursor con `nextCursor`. Sin total ni texto de total: el perfil
no dice cuántos tiene (FR-011).

**Alternativas**: devolver el total y no mostrarlo (un dato que viaja al cliente sin uso es un dato
que algún día se pinta).

## R3. Sin límite de Suspense: la primera tanda viene con el perfil

**Decisión**: la página del perfil pide `profilePetsView(id, null, shown).catch(() => null)` dentro
del mismo `Promise.all` que ya trae el perfil, la persona que mira y el historial, solo cuando la
vista no es `blocked` ni `not_found` (se pide en paralelo y se descarta en esos dos casos). `null`
es la falla (FR-009). El esqueleto aparece solo mientras «Probar de nuevo» trae la tanda (spec,
Assumptions).

**Por qué**: el comentario de la página explica que con un límite de Suspense el perfil no se lee
sin scripts (FR-010 de la #12): el contenido que llega por streaming queda escondido hasta que un
script lo intercambia. El listado hace lo mismo con su primera tanda (`listingView(...).catch`).

**Alternativas**: `<Suspense fallback={skeleton}>` alrededor de la sección (rompe la lectura sin
scripts y deja el esqueleto como lo único que ve un lector de vista previa o un crawler); pedir los
animales después del perfil en serie (suma una vuelta a la base al tiempo de la página).

## R4. «Ver más» y «Probar de nuevo»: una ruta de tandas del perfil

**Decisión**: `src/app/api/perfil/[id]/animales/route.ts`, `GET`, con `despues=<cursor>` para «Ver
más» y sin cursor para «Probar de nuevo» (la primera tanda). Responde el `ApiPage` del listado (sin
`total`) con `cache-control: no-store`, o `503` con `NO_RESPONSE_ERROR` si la base falla, igual que
`/api/animales`. Un `id` que no cumple `isPublicId` responde una tanda vacía sin ir a la base. No
mide nada (FR-022). La hoja cliente usa `listingRequester` (`useListingPages`), que ya aborta el
pedido anterior y separa «sin conexión» de «sin respuesta».

Sin JavaScript, «Ver más» es un enlace a `/perfil/<id>?mostrar=48#a-25`, como el listado
(`LoadMoreButton` en estado `link`, con el tope de 240 de `LISTING_MAX_SHOWN`). La página lee
`mostrar` con la misma validación del listado (`parseListingQuery(query).shown`) (múltiplo de 24, hasta 240) y una visita con
`mostrar` no se mide (FR-022).

**Alternativas**: sumar el parámetro de dueña a `/api/animales` (mezcla la medición de filtros del
listado con el perfil, y su `parseListingQuery` redirige direcciones no canónicas); una Server Action
para las tandas (las acciones van en serie y no se abortan; el listado ya eligió la ruta por eso).

## R5. La hoja cliente: `ProfilePets`, sin la maquinaria de filtros

**Decisión**: `src/components/pets/profile-pets.tsx`, `"use client"`, recibe la primera tanda (o la
falla) y los textos ya traducidos. Estado local mínimo con un reductor puro y testeado,
`src/lib/pets/profile-pets-state.ts`: `{ cards, next, pending: 'none' | 'retry' | 'more', failure:
null | { on: 'open' | 'more'; reason } , request }`. Dibuja:

- con tarjetas: `PetWall` (`photo={PetPhoto}`, `prefetch={false}`) y `LoadMoreButton`;
- falla al abrir: `SaveFailedStrip` con el texto de la sección y el botón «Probar de nuevo»
  (`Button` `secondary`, con `loading` mientras corre); mientras corre, el esqueleto de la pared;
- falla de «Ver más»: `SaveFailedStrip` al pie con el motivo, y «Ver más» vuelve a pedir la misma
  tanda (como el listado: «Tocá "Ver más" de nuevo.»);
- «Probar de nuevo» que trae cero tarjetas: el componente devuelve `null` y la sección entera
  desaparece (el título lo dibuja el componente, no la página, justamente para esto).

La sección con cero tarjetas en la primera tanda no se monta: lo decide la página en el servidor,
sin JavaScript de más para quien adopta y no publica (FR-006).

**Por qué**: `useListing` está atado a filtros, formulario, `sessionStorage` y la dirección; el
perfil no tiene nada de eso (la historia excluye filtros y orden propios). Un reductor de cuatro
transiciones cuesta menos que doblar `useListing` para que sirva a los dos.

**Alternativas**: reutilizar `ListingController` con props para apagar los filtros (un componente
con dos modos y la mitad de su estado sin uso); que el «Ver más» del perfil sea solo el enlace sin
JavaScript (recarga la página entera y pierde la posición en el teléfono).

## R6. El origen «desde un perfil» de la ficha

**Decisión**: `PetViewOrigin` suma `'profile'`. En `petViewOrigin`, cuando el `referer` es del mismo
host, `siteOrigin(path)` devuelve `'profile'` si el camino es el de un perfil público
(`/perfil/<22 caracteres>`, con la regla de `isPublicId`; el idioma va sin prefijo). La marca de
Compartir sigue ganando. Pegar la dirección de la ficha en otra pestaña no manda `referer`, así que
no cuenta como perfil (FR-018).

**Por qué**: es la misma regla que ya separa «desde el listado» y «desde la portada» por el camino del
`referer`, con su test. La navegación del cliente (`Link`) manda como `referer` la página en la que
se estaba.

**Alternativas**: una marca en la dirección de cada tarjeta (`?desde=perfil`, como «Ver su perfil»
de la solicitud): cambia la dirección de la ficha que se copia desde ahí y la pegaría con la marca en
un grupo, que contaría como perfil una visita de afuera; el `referer` no viaja al pegar.

## R7. «Mostró animales» en la visita al perfil

**Decisión**: `public_profile_viewed` pasa a `{ origin: ProfileViewOrigin; with_pets?: boolean }`.
`true` si la primera tanda tuvo al menos una tarjeta, `false` si la tanda llegó vacía, y sin la
propiedad si la tanda falló (FR-017). Una función pura `profileViewProps(origin, pets)` en
`src/lib/analytics/view-origin.ts` arma las propiedades, con su test. El `track` sigue en la página,
después del `Promise.all`, así que el dato es el de la tanda que se dibujó.

**Alternativas**: un evento nuevo `profile_pets_shown` (dos momentos por visita que hay que unir en
PostHog; la lectura pide «de las visitas a perfiles con animales»); mandar cuántos animales (FR-021
lo prohíbe).

## R8. El enlace del perfil en «Mis animales» y su medición

**Decisión**:

- `profile_link_copied` pasa a `{ from: ProfileLinkOrigin }` con `PROFILE_LINK_ORIGINS =
  ['my_profile', 'my_vouches', 'my_pets']`: el botón ya vive en «Mi perfil» y en el vacío de «Mis
  avales», y suma «Mis animales». `trackProfileMoment('profile_link_copied', { from })` valida `from`
  con `isOneOf` y responde `profile.errors.save_failed` si no es uno de los dos, como ya hace con el
  campo del contacto. `CopyProfileLink` suma la prop `from` y la pasa; `PublicProfileLinks` de «Mi
  perfil» pasa `'my_profile'` y `MyVouchesSections` pasa `'my_vouches'`.
- Componente nuevo `ProfileLinkLine` (`src/components/profile/profile-link-line.tsx`, Server
  Component): la línea «En el enlace de tu perfil se ven todos tus animales en adopción.» y
  `CopyProfileLink` con `from="my_pets"`. Va en «Mis animales» entre la fila de «Publicar un animal»
  y la pared.
- Si se muestra: «Mis animales» pide `profilePetsView(myPublicId, null, 1)` (una tarjeta alcanza) en
  su `Promise.all`; se muestra si trae al menos una. Es la misma regla que ve cualquiera (R1): sin
  teléfono de hoy, pausados, vencidos, adoptados o dados de baja dan cero (FR-015). Si falla, no se
  muestra (spec, Assumptions). El `public_id` de la sesión sale de `getMyProfile`/`requireProfile`
  (`Profile.publicId`, lo que ya usan «Mi perfil» y «Mis avales» para armar `publicProfileUrl`).

**Alternativas**: decidirlo en TypeScript con `listMyPets` y `listMyLitters` más el estado del
teléfono (una segunda copia de la regla de «a la vista», que se separa de la base con la próxima
camada o estado); mostrar el enlace con cualquier animal publicado (la decisión del enjambre lo pide
solo con alguno a la vista).

## R9. Qué se testea

- **RLS / base** (`tests/db/profile-pets.test.ts`, con `listing-support.ts` y `moderation-support.ts`):
  con una dueña con disponibles, en proceso, pausado, vencido, adoptado, dado de baja, una camada y
  otra persona con animales: `listed_pets(p_owner_public_id)` como anónimo trae solo los de la dueña
  a la vista, en el orden del listado, la camada una vez; las mismas filas que el listado filtradas
  por dueña (la comparación es la prueba de FR-002); la dueña sin teléfono de hoy, suspendida o
  inexistente da cero; quien bloqueó a la dueña no ve nada y la bloqueada sí; el cursor no repite ni
  saltea con 30. Es el test que intenta leer lo que no debe verse (constitución §V).
- **Puros** (Vitest + Stryker 100 %): `profilePetsReducer` (cada transición, `request` sube en cada
  falla para volver a montar el aviso), `petViewOrigin` con el camino de un perfil y uno que se le
  parece (`/perfil/corto`, `/perfil/<22>/foto`), `profileViewProps` (sí, no, sin dato).
- **e2e** (`tests/e2e/perfil-animales.spec.ts`): el camino del criterio 2 de la historia: la ficha →
  el nombre → el perfil con las tarjetas → otra ficha; y «Mis animales» → «Copiar el enlace» →
  «Enlace copiado». Un solo archivo, dos pruebas.
- **No se testea**: la página, `ProfileLinkLine`, la sección como dibujo, el esqueleto, los textos,
  la ruta de tandas (fina, como `/api/animales`) y la validación de `from` en la acción (`isOneOf`).

## R10. Dependencias

Ninguna nueva. Todo con lo que ya está en `docs/07-stack.md`.

## R11. La ficha lleva al perfil (se sumó en el build de US1)

**Decisión (2026-10-29, build de US1)**: el nombre de quien publicó, en la ficha de un animal y en la
de una camada, es un enlace a su perfil público. La spec lo daba por construido en la #57, pero
`OwnerCard` no enlazaba: la #57 lo dejó afuera «hasta la historia que lo sume» (docs/10). Sin él no
existe el camino del criterio 2 de la historia (la ficha, el nombre, el perfil, otra ficha). La misma
migración devuelve `publisher_public_id` en `pet_by_code` y `litter_by_code` para cualquiera que vea
la ficha; hasta acá salía solo para quien bloqueó a quien publicó (#13). Con «En adopción» el perfil
ya dice qué animales son de quién, así que esconder esa dirección en la ficha no protege nada. Las
dos pruebas que pedían la columna nula (`listed-pets.test.ts`, `moderation-blocks.test.ts`) pasan a
pedir el `public_id` de quien publicó.

**Alternativas**: una marca en la ficha con la dirección del perfil armada en el servidor desde el
`owner_id` (el `id` de la cuenta no sale del servidor, R1); dejar la ficha sin enlace y que el e2e
entre directo al perfil (el criterio 2 de la historia quedaría sin cumplir).
